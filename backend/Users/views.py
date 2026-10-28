from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.views import TokenObtainPairView

from Products.models import Product
from Cart.models import Cart, CartItem
from .serializers import RegisterSerializer, UserSerializer
from Cart.session_cart import SessionCart

User = get_user_model()


def merge_session_cart(request, user):
    """Merge guest session cart items into the authenticated user's cart."""
    session_cart = SessionCart(request)
    guest_items = dict(session_cart.items())

    if not guest_items:
        return

    with transaction.atomic():
        cart, _ = Cart.objects.get_or_create(user=user)

        for product_id, quantity in guest_items.items():
            product = Product.objects.filter(id=product_id).first()

            if product is None:
                continue

            item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={"quantity": quantity},
            )

            if not created:
                item.quantity += quantity
                item.save(update_fields=["quantity"])

    # Clear the session cart only after the database merge succeeds.
    session_cart.clear()


class CartMergingTokenObtainPairView(TokenObtainPairView):
    """Issue JWT tokens and merge the guest cart after successful login."""

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as error:
            raise InvalidToken(error.args[0]) from error

        # SimpleJWT sets serializer.user after validating credentials.
        merge_session_cart(request, serializer.user)

        return Response(
            serializer.validated_data,
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    POST /api/auth/logout/ - wipe the Django session.

    Clears the applied coupon and any leftover guest data so the next
    visitor in this browser starts clean. Authentication is disabled so
    logout still works when the access token has already expired.
    """

    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        request.session.flush()
        return Response({"detail": "Logged out."}, status=status.HTTP_200_OK)


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ - public signup."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    # Prevent an old JWT from blocking public signup.
    authentication_classes = []


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/auth/profile/  -> logged-in user's profile
    PATCH /api/auth/profile/ -> update the user's profile
    """

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
