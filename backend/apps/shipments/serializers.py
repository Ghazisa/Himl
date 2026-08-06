from django.utils import timezone
from rest_framework import serializers

from apps.vehicles.models import Vehicle
from apps.vehicles.serializers import VehicleListingSerializer

from .models import CargoType, RequestStatus, ShipmentRequest, Trip, TripStatus


class ShipmentRequestSerializer(serializers.ModelSerializer):
    vehicle = VehicleListingSerializer(read_only=True)
    vehicle_id = serializers.PrimaryKeyRelatedField(
        source="vehicle", queryset=Vehicle.objects.filter(is_active=True), write_only=True
    )
    shipper_name = serializers.CharField(source="shipper.get_full_name", read_only=True)
    shipper_company = serializers.CharField(
        source="shipper.shipper_profile.company_name", read_only=True, default=""
    )
    transporter_name = serializers.CharField(
        source="transporter.get_full_name", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    cargo_type_display = serializers.CharField(source="get_cargo_type_display", read_only=True)
    trip_id = serializers.IntegerField(source="trip.id", read_only=True, default=None)

    class Meta:
        model = ShipmentRequest
        fields = [
            "id",
            "vehicle",
            "vehicle_id",
            "shipper_name",
            "shipper_company",
            "transporter_name",
            "cargo_type",
            "cargo_type_display",
            "cargo_description",
            "weight_tons",
            "volume_m3",
            "required_body_type",
            "pickup_city",
            "pickup_address",
            "dropoff_city",
            "dropoff_address",
            "pickup_date",
            "offered_price",
            "notes",
            "status",
            "status_display",
            "decline_reason",
            "created_at",
            "responded_at",
            "trip_id",
        ]
        read_only_fields = ["id", "status", "decline_reason", "created_at", "responded_at"]

    def validate_pickup_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError("The pickup date cannot be in the past.")
        return value

    def validate(self, attrs):
        vehicle = attrs.get("vehicle")
        weight = attrs.get("weight_tons")
        if vehicle and weight and weight > vehicle.capacity_tons:
            raise serializers.ValidationError(
                {
                    "weight_tons": (
                        f"This vehicle carries up to {vehicle.capacity_tons} tons, "
                        f"but the cargo weighs {weight} tons."
                    )
                }
            )
        if vehicle and vehicle.owner == self.context["request"].user:
            raise serializers.ValidationError(
                {"vehicle_id": "You cannot send a request to your own vehicle."}
            )
        return attrs

    def create(self, validated_data):
        vehicle = validated_data["vehicle"]
        return ShipmentRequest.objects.create(
            shipper=self.context["request"].user,
            transporter=vehicle.owner,
            **validated_data,
        )


class DeclineRequestSerializer(serializers.Serializer):
    decline_reason = serializers.CharField(max_length=255, allow_blank=True, required=False)


class AcceptRequestSerializer(serializers.Serializer):
    agreed_price = serializers.DecimalField(
        max_digits=9, decimal_places=2, required=False, allow_null=True
    )


class TripSerializer(serializers.ModelSerializer):
    request = ShipmentRequestSerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Trip
        fields = [
            "id",
            "request",
            "status",
            "status_display",
            "agreed_price",
            "started_at",
            "delivered_at",
            "created_at",
        ]
        read_only_fields = fields


class TripStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[TripStatus.IN_TRANSIT, TripStatus.DELIVERED, TripStatus.CANCELLED]
    )


def options_payload():
    return {
        "cargo_types": [{"value": v, "label": l} for v, l in CargoType.choices],
        "request_statuses": [{"value": v, "label": l} for v, l in RequestStatus.choices],
        "trip_statuses": [{"value": v, "label": l} for v, l in TripStatus.choices],
    }
