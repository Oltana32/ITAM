from django.contrib import admin

from .models import Location


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "building", "floor", "room", "parent")
    search_fields = ("name", "code", "building", "address")
    list_filter = ("building",)
    raw_id_fields = ("parent",)
