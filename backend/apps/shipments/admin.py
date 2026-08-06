from django.contrib import admin

from .models import ShipmentRequest, Trip


@admin.register(ShipmentRequest)
class ShipmentRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "shipper", "transporter", "pickup_city", "dropoff_city", "pickup_date", "status")
    list_filter = ("status", "cargo_type", "pickup_city")
    search_fields = ("shipper__email", "transporter__email", "cargo_description")
    autocomplete_fields = ("shipper", "transporter", "vehicle")


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ("id", "request", "status", "agreed_price", "started_at", "delivered_at")
    list_filter = ("status",)
