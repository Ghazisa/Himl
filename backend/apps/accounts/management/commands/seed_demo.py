import random
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import Role, ShipperProfile, TransporterProfile, User
from apps.vehicles.models import BodyType, Vehicle, VehicleSize

DEMO_PASSWORD = "Himl2026"

CITIES = ["Riyadh", "Jeddah", "Dammam", "Makkah", "Madinah", "Abha", "Tabuk", "Buraydah"]

TRANSPORTERS = [
    ("Faisal", "Al-Otaibi", "faisal@demo.sa", "0501000001", "Riyadh"),
    ("Mohammed", "Al-Harbi", "mohammed@demo.sa", "0501000002", "Jeddah"),
    ("Saleh", "Al-Qahtani", "saleh@demo.sa", "0501000003", "Dammam"),
    ("Abdulaziz", "Al-Shammari", "abdulaziz@demo.sa", "0501000004", "Riyadh"),
    ("Turki", "Al-Dossari", "turki@demo.sa", "0501000005", "Makkah"),
    ("Nawaf", "Al-Zahrani", "nawaf@demo.sa", "0501000006", "Madinah"),
]

MAKES = [
    ("Mercedes-Benz", "Actros"),
    ("Volvo", "FH16"),
    ("Isuzu", "NPR"),
    ("Hino", "500 Series"),
    ("MAN", "TGX"),
    ("Scania", "R450"),
]

CAPACITY_BY_SIZE = {
    VehicleSize.SMALL: (1, 3),
    VehicleSize.MEDIUM: (3, 10),
    VehicleSize.LARGE: (10, 25),
    VehicleSize.HEAVY: (25, 40),
}


class Command(BaseCommand):
    help = "Create demo shipper, transporter and vehicle records for local testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--vehicles", type=int, default=18, help="How many demo vehicles to create."
        )

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(7)

        shipper, created = User.objects.get_or_create(
            email="shipper@demo.sa",
            defaults={
                "phone": "+966509000001",
                "first_name": "Layla",
                "last_name": "Al-Fahad",
                "role": Role.SHIPPER,
                "is_email_verified": True,
            },
        )
        shipper.set_password(DEMO_PASSWORD)
        shipper.save(update_fields=["password"])
        if created:
            ShipperProfile.objects.create(
                user=shipper, company_name="Fahad Trading Co.", city="Riyadh"
            )

        transporters = []
        for first, last, email, phone, city in TRANSPORTERS:
            user, made = User.objects.get_or_create(
                email=email,
                defaults={
                    "phone": f"+966{phone[1:]}",
                    "first_name": first,
                    "last_name": last,
                    "role": Role.TRANSPORTER,
                    "is_email_verified": True,
                },
            )
            user.set_password(DEMO_PASSWORD)
            user.save(update_fields=["password"])
            if made:
                TransporterProfile.objects.create(
                    user=user,
                    city=city,
                    years_of_experience=random.randint(1, 18),
                    is_online=random.random() > 0.35,
                    rating=Decimal(f"{random.uniform(3.6, 5.0):.2f}"),
                    completed_trips=random.randint(0, 240),
                )
            transporters.append(user)

        existing = Vehicle.objects.count()
        wanted = options["vehicles"]
        for index in range(existing, wanted):
            owner = random.choice(transporters)
            size = random.choice(list(VehicleSize))
            body_type = random.choice(list(BodyType))
            low, high = CAPACITY_BY_SIZE[size]
            make, model_name = random.choice(MAKES)
            refrigerated = body_type == BodyType.REFRIGERATED

            Vehicle.objects.create(
                owner=owner,
                body_type=body_type,
                size=size,
                make=make,
                model_name=model_name,
                manufacture_year=random.randint(2015, 2025),
                plate_number=f"{random.choice('ABDRSTX')}{random.choice('BJKLNRT')}"
                f"{random.choice('ADHKLMU')} {random.randint(1000, 9999)}",
                capacity_tons=Decimal(f"{random.uniform(low, high):.2f}"),
                capacity_volume_m3=Decimal(f"{random.uniform(8, 90):.2f}"),
                bed_length_m=Decimal(f"{random.uniform(3.5, 13.6):.2f}"),
                has_tail_lift=random.random() > 0.6,
                has_gps_tracking=random.random() > 0.3,
                min_temperature_c=random.choice([-25, -18, 0]) if refrigerated else None,
                max_temperature_c=random.choice([2, 5, 8]) if refrigerated else None,
                base_city=owner.transporter_profile.city,
                operating_regions=", ".join(random.sample(CITIES, k=random.randint(2, 4))),
                price_per_km=Decimal(f"{random.uniform(2.5, 9.5):.2f}"),
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo data ready — {User.objects.count()} users, "
                f"{Vehicle.objects.count()} vehicles. Password: {DEMO_PASSWORD}"
            )
        )
