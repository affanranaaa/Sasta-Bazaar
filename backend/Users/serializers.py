from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """
    Signup. The password is write_only (never sent back), checked against
    Django's AUTH_PASSWORD_VALIDATORS, and hashed with set_password().
    display_picture is optional and arrives as multipart/form-data when
    React sends a FormData body.
    """

    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "phone_number",
            "address",
            "display_picture",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)  # hashes it, never stored raw
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    The logged-in user's own profile. No password field here, and
    id/username are read-only (username is fixed after signup).
    display_picture comes back as an absolute URL because the generic
    views pass the request into the serializer context, which React
    (running on a different origin) needs to be able to load the image.
    """

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "phone_number",
            "address",
            "display_picture",
        ]
        read_only_fields = ["id", "username", "email"]
