from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User, UserRole


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
            "is_active",
            "date_joined",
        )
        read_only_fields = ("id", "date_joined")


class UserCreateSerializer(serializers.ModelSerializer):
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
        )

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("first_name", "last_name", "email", "role", "department", "is_active")

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