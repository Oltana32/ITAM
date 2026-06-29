from django.db.models import Q
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from config.permissions import IsAdmin, IsITStaffOrAdmin, IsSelfOrITStaffOrAdmin

from .models import User, UserRole
from .serializers import UserCreateSerializer, UserSerializer, UserUpdateSerializer


class UserViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ("create", "list", "retrieve", "destroy"):
            return [IsAdmin()]
        if self.action in ("update", "partial_update"):
            return [IsAuthenticated(), IsSelfOrITStaffOrAdmin()]
        if self.action == "me":
            return [IsAuthenticated()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action in ("update", "partial_update"):
            return UserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return qs.none()
        role = getattr(user, "role", None)
        if role == UserRole.FINANCE:
            return qs.filter(pk=user.pk)
        if role == UserRole.IT_TEAM:
            return qs.filter(Q(pk=user.pk) | ~Q(role=UserRole.ADMIN))
        return qs

    @action(detail=False, methods=["get", "patch"])
    def me(self, request):
        if request.method == "GET":
            return Response(UserSerializer(request.user).data)
        ser = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        ser.is_valid(raise_exception=True)
        if getattr(request.user, "role", None) != UserRole.ADMIN:
            ser.validated_data.pop("role", None)
        ser.save()
        return Response(UserSerializer(request.user).data)