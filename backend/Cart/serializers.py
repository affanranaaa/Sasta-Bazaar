from rest_framework import serializers
from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    """
    product_title/product_price are read-only extras pulled from the
    related Product, so the frontend doesn't need a second API call
    just to show what's in the cart.
    """

    product_title = serializers.ReadOnlyField(source="product.title")
    product_price = serializers.ReadOnlyField(source="product.price")
    available_quantity = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "product_title",
            "product_price",
            "quantity",
            "available_quantity",
        ]
        read_only_fields = ["id", "product"]

    def get_available_quantity(self, obj):
        return max(obj.product.stock_quantity - obj.product.reserved_quantity, 0)


class CartSerializer(serializers.ModelSerializer):
    """
    Read-only summary of the logged-in user's whole cart, with all its
    items nested inside. Cart itself has no directly-editable fields —
    editing happens through the CartItem endpoints, not this one.
    """

    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "created_at", "updated_at"]
