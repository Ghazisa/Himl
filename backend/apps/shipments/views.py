from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.permissions import IsShipper, IsTransporter, IsVerified

from .models import RequestStatus, ShipmentRequest, Trip, TripStatus
from .serializers import (
    AcceptRequestSerializer,
    DeclineRequestSerializer,
    ShipmentRequestSerializer,
    TripSerializer,
    TripStatusSerializer,
    options_payload,
)


class ShipmentRequestViewSet(viewsets.ModelViewSet):
    """Shippers create and cancel requests; transporters accept or decline them."""

    serializer_class = ShipmentRequestSerializer
    permission_classes = [IsVerified]
    filterset_fields = ["status", "cargo_type", "pickup_city", "dropoff_city"]
    ordering_fields = ["created_at", "pickup_date"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        return (
            ShipmentRequest.objects.filter(Q(shipper=user) | Q(transporter=user))
            .select_related(
                "vehicle",
                "vehicle__owner",
                "vehicle__owner__transporter_profile",
                "shipper",
                "shipper__shipper_profile",
                "transporter",
                "trip",
            )
            .distinct()
        )

    def create(self, request, *args, **kwargs):
        if not request.user.is_shipper:
            raise PermissionDenied("Only shipper accounts can send shipment requests.")
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=["get"], permission_classes=[IsTransporter])
    def incoming(self, request):
        """Live feed of pending requests for the signed-in transporter."""
        queryset = self.filter_queryset(
            self.get_queryset().filter(
                transporter=request.user, status=RequestStatus.PENDING
            )
        )
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsTransporter])
    def accept(self, request, pk=None):
        shipment_request = self.get_object()
        self._assert_actionable(shipment_request, request.user.id, "transporter")

        serializer = AcceptRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            shipment_request.status = RequestStatus.ACCEPTED
            shipment_request.responded_at = timezone.now()
            shipment_request.save(update_fields=["status", "responded_at"])
            trip = Trip.objects.create(
                request=shipment_request,
                agreed_price=serializer.validated_data.get("agreed_price")
                or shipment_request.offered_price,
            )
        return Response(TripSerializer(trip).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], permission_classes=[IsTransporter])
    def decline(self, request, pk=None):
        shipment_request = self.get_object()
        self._assert_actionable(shipment_request, request.user.id, "transporter")

        serializer = DeclineRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shipment_request.status = RequestStatus.DECLINED
        shipment_request.decline_reason = serializer.validated_data.get("decline_reason", "")
        shipment_request.responded_at = timezone.now()
        shipment_request.save(update_fields=["status", "decline_reason", "responded_at"])
        return Response(self.get_serializer(shipment_request).data)

    @action(detail=True, methods=["post"], permission_classes=[IsShipper])
    def cancel(self, request, pk=None):
        shipment_request = self.get_object()
        self._assert_actionable(shipment_request, request.user.id, "shipper")

        shipment_request.status = RequestStatus.CANCELLED
        shipment_request.responded_at = timezone.now()
        shipment_request.save(update_fields=["status", "responded_at"])
        return Response(self.get_serializer(shipment_request).data)

    @staticmethod
    def _assert_actionable(shipment_request, user_id, party):
        if getattr(shipment_request, f"{party}_id") != user_id:
            raise PermissionDenied("This request does not belong to you.")
        if shipment_request.status != RequestStatus.PENDING:
            raise ValidationError(
                {
                    "detail": (
                        "This request is already "
                        f"{shipment_request.get_status_display().lower()}."
                    )
                }
            )


class TripViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [IsVerified]
    filterset_fields = ["status"]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        user = self.request.user
        return (
            Trip.objects.filter(
                Q(request__shipper=user) | Q(request__transporter=user)
            )
            .select_related(
                "request",
                "request__vehicle",
                "request__vehicle__owner",
                "request__vehicle__owner__transporter_profile",
                "request__shipper",
                "request__shipper__shipper_profile",
                "request__transporter",
            )
            .distinct()
        )

    @action(detail=True, methods=["post"], permission_classes=[IsTransporter])
    def set_status(self, request, pk=None):
        trip = self.get_object()
        if trip.request.transporter_id != request.user.id:
            raise PermissionDenied("This trip does not belong to you.")
        if trip.status in {TripStatus.DELIVERED, TripStatus.CANCELLED}:
            raise ValidationError({"detail": "This trip is already closed."})

        serializer = TripStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]

        if new_status == TripStatus.DELIVERED and trip.status != TripStatus.IN_TRANSIT:
            raise ValidationError(
                {"status": "Start the trip before marking it as delivered."}
            )

        with transaction.atomic():
            trip.advance_to(new_status)
            if new_status == TripStatus.DELIVERED:
                profile = request.user.transporter_profile
                profile.completed_trips += 1
                profile.save(update_fields=["completed_trips"])
        return Response(self.get_serializer(trip).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def shipment_options(request):
    return Response(options_payload())
