from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from django_filters import rest_framework as filters

from apps.locations.models import Location
from config.permissions import IsITStaffOrAdmin, IsITStaffOrAdminOrReadOnly

from .history import log_asset_creation, log_asset_updates, log_status_change
from .models import Asset, AssetStatusHistory
from .serializers import AssetSerializer, AssetStatusHistorySerializer
from .services import retire_asset, set_asset_location
from .specs import CATEGORY_SPECS


class AssetFilter(filters.FilterSet):
    status = filters.CharFilter(field_name="status", lookup_expr="exact")
    category = filters.CharFilter(field_name="category", lookup_expr="exact")
    manufacturer = filters.NumberFilter(field_name="manufacturer_id", lookup_expr="exact")
    location = filters.NumberFilter(field_name="location_id", lookup_expr="exact")

    class Meta:
        model = Asset
        fields = ["status", "category", "manufacturer", "location"]


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.select_related(
        "manufacturer", "location", "created_by", "updated_by"
    ).all()
    serializer_class = AssetSerializer
    permission_classes = [IsITStaffOrAdminOrReadOnly]
    filter_backends = (filters.DjangoFilterBackend, SearchFilter, OrderingFilter)
    filterset_class = AssetFilter
    search_fields = ("name", "tag", "serial_number", "model", "department")
    ordering_fields = ("name", "tag", "status", "created_at", "updated_at")

    def get_queryset(self):
        qs = super().get_queryset()
        include_retired = self.request.query_params.get("include_retired", "false").lower() in (
            "1",
            "true",
            "yes",
        )
        if not include_retired:
            qs = qs.exclude(status__in=("retired", "disposed"))
        return qs

    def perform_create(self, serializer):
        asset = serializer.save(created_by=self.request.user)
        log_asset_creation(asset, changed_by=self.request.user)

    def perform_update(self, serializer):
        old_asset = Asset.objects.select_related("manufacturer", "location").get(
            pk=serializer.instance.pk
        )
        asset = serializer.save(updated_by=self.request.user)
        log_asset_updates(asset, old_asset, changed_by=self.request.user)

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        """GET /api/assets/:id/history/ — change log for this asset."""
        asset = self.get_object()
        qs = (
            AssetStatusHistory.objects.filter(asset=asset)
            .select_related("changed_by")
            .order_by("-changed_at")
        )
        serializer = AssetStatusHistorySerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsITStaffOrAdmin])
    def move(self, request, pk=None):
        """POST /api/assets/:id/move/ { "location": <id> }"""
        asset = self.get_object()
        loc_id = request.data.get("location")
        if not loc_id:
            return Response({"location": "Required."}, status=status.HTTP_400_BAD_REQUEST)
        location = Location.objects.filter(pk=loc_id).first()
        if not location:
            return Response({"location": "Invalid location."}, status=status.HTTP_400_BAD_REQUEST)

        old_asset = Asset.objects.select_related("manufacturer", "location").get(pk=asset.pk)
        set_asset_location(asset, location)
        asset.refresh_from_db()
        log_asset_updates(asset, old_asset, changed_by=request.user, fields=("location",))
        return Response(AssetSerializer(asset).data)

    @action(detail=True, methods=["post"], permission_classes=[IsITStaffOrAdmin])
    def retire(self, request, pk=None):
        asset = self.get_object()
        old_status = asset.status
        retire_asset(asset)
        asset.refresh_from_db()
        log_status_change(
            asset,
            old_status,
            asset.status,
            changed_by=request.user,
            reason="Asset retired",
        )
        return Response(AssetSerializer(asset).data)

    @action(detail=False, methods=["get"])
    def specs_config(self, request):
        """GET /api/assets/specs_config/ — get all category specs configurations."""
        return Response(CATEGORY_SPECS)

    @action(detail=False, methods=["get"])
    def category_specs(self, request):
        """GET /api/assets/category_specs/?category=laptop — get specs for specific category."""
        category = request.query_params.get("category")
        if not category:
            return Response({"error": "category parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        specs = CATEGORY_SPECS.get(category, {})
        if not specs:
            return Response({"error": f"No specs configuration found for category: {category}"}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(specs)
