from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from config.permissions import IsITStaffOrAdminOrReadOnly

from .models import Manufacturer
from .serializers import ManufacturerSerializer
from .services import create_or_update_manufacturers


class ManufacturerViewSet(viewsets.ModelViewSet):
    queryset = Manufacturer.objects.all()
    serializer_class = ManufacturerSerializer
    permission_classes = [IsITStaffOrAdminOrReadOnly]
    search_fields = ("name", "support_email")
    ordering_fields = ("name", "created_at")

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=["post"])
    def sync_real_manufacturers(self, request):
        """Sync manufacturers with real vendors from assets and licenses."""
        try:
            count = create_or_update_manufacturers()
            return Response({
                "status": "success",
                "message": f"Created {count} new manufacturer(s) from real data."
            })
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=500)
