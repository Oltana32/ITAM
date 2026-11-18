from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User, UserRole


def build_awashwine_email(first_name: str | None, last_name: str | None) -> str:
    name = (first_name or last_name or "").strip()
    if not name:
        return ""
    cleaned = "".join(name.lower().split())
    return f"{cleaned}@awashwine.com"


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "department",
            "avatar",
            "is_active",
            "must_change_password",
            "date_joined",
        )
        read_only_fields = ("id", "date_joined", "must_change_password")


class UserCreateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "email",
            "password",
            "first_name",
            "last_name",
            "role",
            "department",
            "avatar",
            "must_change_password",
        )

    def validate(self, attrs):
        attrs = super().validate(attrs)
        email = (attrs.get("email") or "").strip()
        if not email:
            generated = build_awashwine_email(attrs.get("first_name"), attrs.get("last_name"))
            if generated:
                attrs["email"] = generated
            else:
                raise serializers.ValidationError({"email": "This field is required."})
        return attrs

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data.setdefault("must_change_password", True)
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("first_name", "last_name", "email", "role", "department", "avatar", "is_active")

    def validate_role(self, value: str) -> str:
        request = self.context.get("request")
        actor = getattr(request, "user", None)
        if not actor or not actor.is_authenticated:
            raise serializers.ValidationError("Not authenticated.")
        actor_role = getattr(actor, "role", None)
        if actor_role != UserRole.ADMIN:
            raise serializers.ValidationError("Only admins can change user roles.")
        if value not in {UserRole.ADMIN, UserRole.IT_TEAM, UserRole.FINANCE}:
            raise serializers.ValidationError("Invalid role.")
        return value