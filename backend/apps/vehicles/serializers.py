from rest_framework import serializers

from .models import BodyType, Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    """Full representation used by a transporter managing their own fleet."""

    body_type_display = serializers.CharField(source="get_body_type_display", read_only=True)
    size_display = serializers.CharField(source="get_size_display", read_only=True)

    class Meta:
        model = Vehicle
        fields = [
            "id",
            "body_type",
            "body_type_display",
            "size",
            "size_display",
            "make",
            "model_name",
            "manufacture_year",
            "plate_number",
            "capacity_tons",
            "capacity_volume_m3",
            "bed_length_m",
            "has_tail_lift",
            "has_gps_tracking",
            "min_temperature_c",
            "max_temperature_c",
            "base_city",
            "operating_regions",
            "price_per_km",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        def resolve(field):
            if field in attrs:
                return attrs[field]
            return getattr(self.instance, field, None)

        low = resolve("min_temperature_c")
        high = resolve("max_temperature_c")
        if low is not None and high is not None and low > high:
            raise serializers.ValidationError(
                {"max_temperature_c": "Maximum temperature must not be below the minimum."}
            )
        if resolve("body_type") == BodyType.REFRIGERATED and low is None and high is None:
            raise serializers.ValidationError(
                {"min_temperature_c": "Refrigerated vehicles need a temperature range."}
            )
        return attrs


class TransporterSummarySerializer(serializers.Serializer):
    """Public-facing owner details shown to shippers browsing the marketplace."""

    id = serializers.IntegerField()
    full_name = serializers.CharField(source="get_full_name")
    city = serializers.CharField(source="transporter_profile.city")
    rating = serializers.DecimalField(
        source="transporter_profile.rating", max_digits=3, decimal_places=2
    )
    completed_trips = serializers.IntegerField(source="transporter_profile.completed_trips")
    years_of_experience = serializers.IntegerField(
        source="transporter_profile.years_of_experience"
    )
    is_online = serializers.BooleanField(source="transporter_profile.is_online")


class VehicleListingSerializer(VehicleSerializer):
    """Marketplace listing — no plate number, owner contact stays private until accept."""

    owner = TransporterSummarySerializer(read_only=True)

    class Meta(VehicleSerializer.Meta):
        fields = [f for f in VehicleSerializer.Meta.fields if f != "plate_number"] + ["owner"]
        read_only_fields = fields
