from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from django.shortcuts import get_object_or_404

from Products.models import Product
from Coupons.models import Coupon
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from .session_cart import SessionCart


def calculate_cart_totals(request):
    subtotal = 0

    if request.user.is_authenticated:
        cart = Cart.objects.filter(user=request.user).first()

        if cart:
            # Preserve the existing rule against keeping your own
            # products in your cart.
            cart.items.filter(product__owner=request.user).delete()

            items = cart.items.select_related("product").all()

            for item in items:
                subtotal += item.product.price * item.quantity

    else:
        session_cart = SessionCart(request)
        session_items = session_cart.items()

        products = Product.objects.filter(id__in=session_items.keys())
        found_ids = set()

        for product in products:
            product_id = str(product.id)
            found_ids.add(product_id)
            quantity = session_items[product_id]
            subtotal += product.price * quantity

        # Remove session entries for products that no longer exist.
        for product_id in list(session_items.keys()):
            if product_id not in found_ids:
                session_cart.remove(product_id)

    coupon = None
    discount_amount = 0
    applied_coupon_code = request.session.get("applied_coupon")

    if applied_coupon_code:
        coupon = Coupon.objects.filter(code=applied_coupon_code).first()

        if coupon and coupon.is_valid():
            discount_amount = subtotal * coupon.discount_percentage
        else:
            request.session.pop("applied_coupon", None)
            coupon = None

    total = subtotal - discount_amount

    return subtotal, coupon, discount_amount, total


def cart_summary(request):
    subtotal, coupon, discount_amount, total = calculate_cart_totals(request)

    return {
        "subtotal": subtotal,
        "discount_amount": discount_amount,
        "total": total,
        "coupon_code": coupon.code if coupon else None,
        "coupon_percent": (int(coupon.discount_percentage * 100) if coupon else 0),
    }


class CartViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        summary = cart_summary(request)

        if request.user.is_authenticated:
            cart = Cart.objects.filter(user=request.user).first()

            items = (
                CartItemSerializer(
                    cart.items.select_related("product").all(), many=True
                ).data
                if cart
                else []
            )

            return Response(
                {
                    "id": cart.id if cart else None,
                    "items": items,
                    **summary,
                }
            )

        # Guest cart items use product IDs as their item IDs.
        session_cart = SessionCart(request)
        session_items = session_cart.items()
        products = Product.objects.filter(id__in=session_items.keys())

        items = []

        for product in products:
            quantity = session_items.get(str(product.id), 0)

            items.append(
                {
                    "id": product.id,
                    "product": product.id,
                    "product_title": product.title,
                    "product_price": product.price,
                    "quantity": quantity,
                    "available_quantity": max(
                        product.stock_quantity - product.reserved_quantity, 0
                    ),
                }
            )

        return Response(
            {
                "id": None,
                "items": items,
                **summary,
            }
        )

    @action(detail=False, methods=["post"], url_path=r"add/(?P<product_id>\d+)")
    def add_item(self, request, product_id=None):
        product = get_object_or_404(Product, id=product_id)

        if request.user.is_authenticated and product.owner == request.user:
            return Response(
                {"error": "You cannot add your own product to your cart."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quantity = int(request.data.get("quantity", 1))
        except (TypeError, ValueError):
            return Response(
                {"error": "Quantity must be a valid number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quantity < 1:
            return Response(
                {"error": "Quantity must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        available = max(product.stock_quantity - product.reserved_quantity, 0)

        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)

            item = CartItem.objects.filter(cart=cart, product=product).first()

            current_quantity = item.quantity if item else 0
            requested_total = current_quantity + quantity

            if requested_total > available:
                return Response(
                    {
                        "error": (
                            f'Not enough stock for "{product.title}". '
                            f"Available: {available}; "
                            f"already in cart: {current_quantity}; "
                            f"requested: {quantity} more."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if item:
                item.quantity = requested_total
                item.save(update_fields=["quantity"])
            else:
                item = CartItem.objects.create(
                    cart=cart, product=product, quantity=quantity
                )

            return Response(
                {
                    "message": f"{product.title} added to cart.",
                    "item": CartItemSerializer(item).data,
                },
                status=status.HTTP_200_OK,
            )

        session_cart = SessionCart(request)
        current_quantity = session_cart.items().get(str(product_id), 0)
        requested_total = current_quantity + quantity

        if requested_total > available:
            return Response(
                {
                    "error": (
                        f'Not enough stock for "{product.title}". '
                        f"Available: {available}; "
                        f"already in cart: {current_quantity}; "
                        f"requested: {quantity} more."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        session_cart.add(product_id, quantity)

        return Response(
            {
                "message": f"{product.title} added to cart.",
                "product_id": product.id,
                "product_title": product.title,
                "quantity": requested_total,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path=r"update/(?P<item_id>\d+)")
    def update_item(self, request, item_id=None):
        try:
            quantity = int(request.data.get("quantity", 1))
        except (TypeError, ValueError):
            return Response(
                {"error": "Quantity must be a valid number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quantity < 1:
            return Response(
                {"error": "Quantity must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.is_authenticated:
            item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
            product = item.product

        else:
            session_cart = SessionCart(request)

            if str(item_id) not in session_cart.items():
                return Response(
                    {"error": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND
                )

            product = get_object_or_404(Product, id=item_id)

        available = max(product.stock_quantity - product.reserved_quantity, 0)

        if quantity > available:
            return Response(
                {
                    "error": (
                        f'Not enough stock for "{product.title}". '
                        f"Available quantity: {available}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.is_authenticated:
            item.quantity = quantity
            item.save(update_fields=["quantity"])
            item_data = CartItemSerializer(item).data
        else:
            session_cart.update_quantity(item_id, quantity)
            item_data = None

        summary = cart_summary(request)

        response_data = {
            **summary,
            "line_total": product.price * quantity,
        }

        if item_data is not None:
            response_data["item"] = item_data

        return Response(response_data)

    @action(detail=False, methods=["post"], url_path=r"remove/(?P<item_id>\d+)")
    def remove_item(self, request, item_id=None):
        if request.user.is_authenticated:
            item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
            item.delete()

            cart = Cart.objects.filter(user=request.user).first()
            cart_empty = not cart or not cart.items.exists()

        else:
            session_cart = SessionCart(request)

            if str(item_id) not in session_cart.items():
                return Response(
                    {"error": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND
                )

            session_cart.remove(item_id)
            cart_empty = not session_cart.items()

        return Response(
            {
                **cart_summary(request),
                "cart_empty": cart_empty,
            }
        )

    @action(detail=False, methods=["post"], url_path="apply-coupon")
    def apply_coupon(self, request):
        code = request.data.get("coupon_code", "").strip().upper()

        coupon = Coupon.objects.filter(code=code).first()

        if not coupon:
            return Response(
                {"error": "Invalid coupon code."}, status=status.HTTP_400_BAD_REQUEST
            )

        if not coupon.is_valid():
            return Response(
                {"error": "This coupon has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.session["applied_coupon"] = coupon.code

        return Response(cart_summary(request))

    @action(detail=False, methods=["post"], url_path="remove-coupon")
    def remove_coupon(self, request):
        request.session.pop("applied_coupon", None)

        return Response(cart_summary(request))
