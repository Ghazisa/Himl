from django.core import mail
from django.urls import reverse, reverse_lazy
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import EmailOTP, Role, TransporterProfile, User

VALID_PASSWORD = "Himl2026Test"


def registration_payload(**overrides):
    payload = {
        "first_name": "Nora",
        "last_name": "Al-Harbi",
        "email": "nora@example.sa",
        "phone": "0512345678",
        "password": VALID_PASSWORD,
        "confirm_password": VALID_PASSWORD,
        "role": Role.SHIPPER,
    }
    payload.update(overrides)
    return payload


class PasswordPolicyTests(APITestCase):
    """The policy is advertised in the UI but must be enforced server-side."""

    url = reverse_lazy("accounts:register")

    def assert_rejected(self, password, fragment):
        response = self.client.post(
            self.url,
            registration_payload(password=password, confirm_password=password),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(fragment, str(response.data).lower())

    def test_rejects_short_password(self):
        self.assert_rejected("Ab1cdef", "8 characters")

    def test_rejects_password_without_uppercase(self):
        self.assert_rejected("himl2026test", "uppercase")

    def test_rejects_password_without_digit(self):
        self.assert_rejected("HimlTestOnly", "number")

    def test_rejects_mismatched_confirmation(self):
        response = self.client.post(
            self.url,
            registration_payload(confirm_password="DifferentPass1"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accepts_compliant_password(self):
        response = self.client.post(self.url, registration_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class RegistrationAndOTPTests(APITestCase):
    def setUp(self):
        self.client.post(reverse("accounts:register"), registration_payload(), format="json")
        self.user = User.objects.get(email="nora@example.sa")

    def test_new_account_starts_unverified(self):
        self.assertFalse(self.user.is_email_verified)

    def test_registration_sends_one_email(self):
        self.assertEqual(len(mail.outbox), 1)

    def test_otp_is_not_stored_in_plain_text(self):
        otp = EmailOTP.objects.filter(user=self.user).latest("created_at")
        self.assertNotIn(otp.code_hash, [str(n).zfill(4) for n in range(10000)])
        self.assertEqual(len(otp.code_hash), 64)  # sha256 hex digest

    def test_login_before_verification_is_refused(self):
        response = self.client.post(
            reverse("accounts:login"),
            {"identifier": "nora@example.sa", "password": VALID_PASSWORD},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(response.data.get("verification_required"))

    def test_wrong_otp_does_not_verify(self):
        real = EmailOTP.objects.filter(user=self.user).latest("created_at")
        wrong = "1111" if real.code_hash == EmailOTP.hash_code("0000") else "0000"
        response = self.client.post(
            reverse("accounts:otp-verify"),
            {"email": "nora@example.sa", "code": wrong},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_email_verified)


class LoginTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="fahad@example.sa",
            phone="+966500000001",
            password=VALID_PASSWORD,
            first_name="Fahad",
            last_name="Al-Otaibi",
            role=Role.SHIPPER,
            is_email_verified=True,
        )

    def test_login_with_email(self):
        response = self.client.post(
            reverse("accounts:login"),
            {"identifier": "fahad@example.sa", "password": VALID_PASSWORD},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data["tokens"])

    def test_login_with_phone(self):
        response = self.client.post(
            reverse("accounts:login"),
            {"identifier": "0500000001", "password": VALID_PASSWORD},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_wrong_password_is_refused(self):
        response = self.client.post(
            reverse("accounts:login"),
            {"identifier": "fahad@example.sa", "password": "WrongPass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_account_error_matches_wrong_password_error(self):
        """Neither response may reveal whether an email is registered."""
        unknown = self.client.post(
            reverse("accounts:login"),
            {"identifier": "nobody@example.sa", "password": "WrongPass123"},
            format="json",
        )
        wrong = self.client.post(
            reverse("accounts:login"),
            {"identifier": "fahad@example.sa", "password": "WrongPass123"},
            format="json",
        )
        self.assertEqual(str(unknown.data), str(wrong.data))


class ProfileTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="turki@example.sa",
            phone="+966500000002",
            password=VALID_PASSWORD,
            first_name="Turki",
            last_name="Al-Dossari",
            role=Role.TRANSPORTER,
            is_email_verified=True,
        )
        TransporterProfile.objects.create(user=self.user)
        self.client.force_authenticate(self.user)

    def test_profile_is_readable(self):
        """Regression: the view once passed data=None and could not serialise."""
        response = self.client.get(reverse("accounts:me-profile"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("is_online", response.data)

    def test_profile_is_patchable(self):
        response = self.client.patch(
            reverse("accounts:me-profile"), {"city": "Dammam"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["city"], "Dammam")

    def test_work_mode_toggles(self):
        response = self.client.post(
            reverse("accounts:me-online"), {"is_online": True}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_online"])

    def test_anonymous_access_is_refused(self):
        self.client.force_authenticate(None)
        response = self.client.get(reverse("accounts:me-profile"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
