from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.permissions import IsShipper, IsTransporter

from .filters import VehicleSearchFilter
from .models import BodyType, Vehicle, VehicleSize
from .serializers import VehicleListingSerializer, VehicleSerializer


class MyVehicleViewSet(viewsets.ModelViewSet):
    """A transporter's own fleet — full CRUD, scoped to the signed-in owner."""

    serializer_class = VehicleSerializer
    permission_classes = [IsTransporter]

    def get_queryset(self):
        return Vehicle.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class VehicleSearchViewSet(viewsets.ReadOnlyModelViewSet):
    """Marketplace listings browsed by shippers."""

    serializer_class = VehicleListingSerializer
    permission_classes = [IsShipper]
    filterset_class = VehicleSearchFilter
    search_fields = ["make", "model_name", "base_city", "operating_regions"]
    ordering_fields = ["capacity_tons", "price_per_km", "created_at"]
    ordering = ["-owner__transporter_profile__is_online", "-created_at"]

    def get_queryset(self):
        return Vehicle.objects.filter(
            is_active=True, owner__is_active=True, owner__is_email_verified=True
        ).select_related("owner", "owner__transporter_profile")


@api_view(["GET"])
@permission_classes([AllowAny])
def vehicle_options(request):
    """Choice lists so the frontend never hardcodes enum values."""
    return Response(
        {
            "body_types": [{"value": v, "label": l} for v, l in BodyType.choices],
            "sizes": [{"value": v, "label": l} for v, l in VehicleSize.choices],
        }
    )
