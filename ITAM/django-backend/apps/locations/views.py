from rest_framework import viewsets

from config.permissions import IsITStaffOrAdminOrReadOnly

from .models import Location
from .serializers import LocationSerializer


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.select_related("parent").all()
    serializer_class = LocationSerializer
    permission_classes = [IsITStaffOrAdminOrReadOnly]
    search_fields = ("name", "code", "building", "room")
    ordering_fields = ("name", "code", "created_at")
