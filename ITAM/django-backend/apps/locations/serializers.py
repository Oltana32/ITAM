from rest_framework import serializers

from .models import Location, City


class LocationSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source="parent.name", read_only=True)
    city_display = serializers.CharField(source="get_city_display", read_only=True)

    class Meta:
        model = Location
        fields = (
            "id",
            "name",
            "code",
            "building",
            "floor",
            "room",
            "city",
            "city_display",
            "address",
            "parent",
            "parent_name",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
