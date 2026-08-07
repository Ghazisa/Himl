from datetime import date, timedelta

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import (
    Role,
    ShipperProfile,
    TransporterProfile,
    User,
)
from apps.shipments.models import ShipmentRequest, Trip
from apps.vehicles.models import BodyType, Vehicle, VehicleSize

PASSWORD = "Himl2026Test"


def make_vehicle(owner, **overrides):
    fields = {
        "owner": owner,
        "body_type": BodyType.REFRIGERATED,
        "size": VehicleSize.MEDIUM,
        "make": "Mercedes-Benz",
        "model_name": "Actros",
        "manufacture_year": 2022,
        "plate_number": "ABC 1234",
        "capacity_tons": "5.00",
        "capacity_volume_m3": "30.00",
        "base_city": "Riyadh",
        "price_per_km": "3.50",
    }
    fields.update(overrides)
    return Vehicle.objects.create(**fields)


def make_user(email, phone, role, **extra):
    user = User.objects.create_user(
        email=email,
        phone=phone,
        password=PASSWORD,
        first_name="Test",
        last_name="User",
        role=role,
        is_email_verified=True,
        **extra,
    )
    if role == Role.SHIPPER:
        ShipperProfile.objects.create(user=user)
    else:
        TransporterProfile.objects.create(user=user)
    return user


class ShipmentRequestTests(APITestCase):
    def setUp(self):
        self.shipper = make_user("shipper@t.sa", "+966500000010", Role.SHIPPER)
        self.transporter = make_user("driver@t.sa", "+966500000011", Role.TRANSPORTER)
        self.vehicle = make_vehicle(self.transporter)

    def payload(self, **overrides):
        data = {
            "vehicle_id": self.vehicle.id,
            "cargo_type": "general",
            "cargo_description": "Twelve pallets of dates",
            "weight_tons": "3.00",
            "pickup_city": "Riyadh",
            "pickup_address": "Al Olaya, Warehouse 12",
            "dropoff_city": "Dammam",
            "dropoff_address": "Industrial City 2",
            "pickup_date": str(date.today() + timedelta(days=7)),
        }
        data.update(overrides)
        return data

    def test_shipper_can_send_request(self):
        self.client.force_authenticate(self.shipper)
        response = self.client.post(reverse("requests-list"), self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(ShipmentRequest.objects.count(), 1)

    def test_cargo_heavier_than_capacity_is_rejected(self):
        """The core marketplace rule: never match cargo a vehicle cannot carry."""
        self.client.force_authenticate(self.shipper)
        response = self.client.post(
            reverse("requests-list"), self.payload(weight_tons="8.00"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ShipmentRequest.objects.count(), 0)

    def test_transporter_cannot_create_a_request(self):
        self.client.force_authenticate(self.transporter)
        response = self.client.post(reverse("requests-list"), self.payload(), format="json")
        self.assertIn(
            response.status_code,
            (status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST),
        )

    def test_anonymous_cannot_create_a_request(self):
        response = self.client.post(reverse("requests-list"), self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RequestResponseTests(APITestCase):
    def setUp(self):
        self.shipper = make_user("shipper2@t.sa", "+966500000020", Role.SHIPPER)
        self.transporter = make_user("driver2@t.sa", "+966500000021", Role.TRANSPORTER)
        self.other_driver = make_user("driver3@t.sa", "+966500000022", Role.TRANSPORTER)
        self.vehicle = make_vehicle(
            self.transporter,
            body_type=BodyType.STANDARD,
            size=VehicleSize.LARGE,
            plate_number="XYZ 9876",
            capacity_tons="20.00",
            capacity_volume_m3="60.00",
        )
        self.request = ShipmentRequest.objects.create(
            shipper=self.shipper,
            vehicle=self.vehicle,
            transporter=self.transporter,
            cargo_type="general",
            cargo_description="Steel beams",
            weight_tons="10.00",
            pickup_city="Riyadh",
            pickup_address="Gate 4",
            dropoff_city="Jeddah",
            dropoff_address="Port warehouse",
            pickup_date=date.today() + timedelta(days=3),
        )

    def accept_url(self):
        return reverse("requests-accept", args=[self.request.id])

    def test_accepting_creates_a_trip(self):
        self.client.force_authenticate(self.transporter)
        response = self.client.post(self.accept_url())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.request.refresh_from_db()
        self.assertEqual(self.request.status, "accepted")
        self.assertEqual(Trip.objects.filter(request=self.request).count(), 1)

    def test_another_transporter_cannot_accept(self):
        """Object-level ownership must be enforced, not just role."""
        self.client.force_authenticate(self.other_driver)
        response = self.client.post(self.accept_url())
        self.assertIn(
            response.status_code,
            (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND),
        )
        self.request.refresh_from_db()
        self.assertEqual(self.request.status, "pending")

    def test_shipper_cannot_accept_their_own_request(self):
        self.client.force_authenticate(self.shipper)
        response = self.client.post(self.accept_url())
        self.assertIn(
            response.status_code,
            (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND),
        )

    def test_declining_creates_no_trip(self):
        self.client.force_authenticate(self.transporter)
        response = self.client.post(reverse("requests-decline", args=[self.request.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.request.refresh_from_db()
        self.assertEqual(self.request.status, "declined")
        self.assertEqual(Trip.objects.count(), 0)

    def test_incoming_feed_only_shows_own_requests(self):
        self.client.force_authenticate(self.other_driver)
        response = self.client.get(reverse("requests-incoming"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"], [])
