from django.contrib import admin

from .models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ("plate_number", "make", "model_name", "body_type", "size", "capacity_tons", "base_city", "is_active")
    list_filter = ("body_type", "size", "is_active", "base_city")
    search_fields = ("plate_number", "make", "model_name", "owner__email")
    autocomplete_fields = ("owner",)
