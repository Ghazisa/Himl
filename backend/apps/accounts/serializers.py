from django.contrib.auth import authenticate, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    EmailOTP,
    OTPPurpose,
    Role,
    ShipperProfile,
    TransporterProfile,
    User,
)
from .validators import normalize_saudi_phone


def issue_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


class ShipperProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipperProfile
        fields = ["company_name", "commercial_registration", "city"]


class TransporterProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransporterProfile
        fields = [
            "national_id",
            "license_number",
            "city",
            "years_of_experience",
            "is_online",
            "last_online_at",
            "rating",
            "completed_trips",
        ]
        read_only_fields = ["is_online", "last_online_at", "rating", "completed_trips"]


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="get_full_name", read_only=True)
    shipper_profile = ShipperProfileSerializer(read_only=True)
    transporter_profile = TransporterProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "phone",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "preferred_language",
            "is_email_verified",
            "date_joined",
            "shipper_profile",
            "transporter_profile",
        ]
        read_only_fields = ["id", "email", "role", "is_email_verified", "date_joined"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    confirm_password = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "email",
            "phone",
            "role",
            "preferred_language",
            "password",
            "confirm_password",
        ]

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_phone(self, value):
        try:
            normalized = normalize_saudi_phone(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc
        if User.objects.filter(phone=normalized).exists():
            raise serializers.ValidationError(
                "An account with this phone number already exists."
            )
        return normalized

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        try:
            password_validation.validate_password(attrs["password"])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        if user.role == Role.SHIPPER:
            ShipperProfile.objects.create(user=user)
        else:
            TransporterProfile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(help_text="Email address or Saudi mobile number.")
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        identifier = attrs["identifier"].strip()
        email = identifier.lower()

        if "@" not in identifier:
            try:
                normalized = normalize_saudi_phone(identifier)
            except DjangoValidationError:
                raise serializers.ValidationError(
                    {"identifier": "Enter a valid email address or mobile number."}
                ) from None
            matched = User.objects.filter(phone=normalized).values_list("email", flat=True)
            email = matched[0] if matched else ""

        user = authenticate(
            request=self.context.get("request"), username=email, password=attrs["password"]
        )
        if user is None:
            # Deliberately generic: never reveal whether the account exists.
            raise serializers.ValidationError(
                {"detail": "Incorrect credentials. Please check and try again."}
            )
        attrs["user"] = user
        return attrs


class OTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    purpose = serializers.ChoiceField(
        choices=OTPPurpose.choices, default=OTPPurpose.VERIFY_EMAIL
    )


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=4, max_length=4)
    purpose = serializers.ChoiceField(
        choices=OTPPurpose.choices, default=OTPPurpose.VERIFY_EMAIL
    )

    def validate_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("The verification code must be 4 digits.")
        return value

    def validate(self, attrs):
        user = User.objects.filter(email__iexact=attrs["email"]).first()
        otp = (
            EmailOTP.objects.filter(
                user=user, purpose=attrs["purpose"], consumed_at__isnull=True
            ).first()
            if user
            else None
        )
        if otp is None or not otp.verify(attrs["code"]):
            raise serializers.ValidationError(
                {"code": "This code is invalid or has expired. Request a new one."}
            )
        attrs["user"] = user
        return attrs


class PasswordResetConfirmSerializer(OTPVerifySerializer):
    new_password = serializers.CharField(write_only=True, style={"input_type": "password"})
    confirm_password = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )

    def validate(self, attrs):
        # Check the new password before touching the OTP, so a weak password does
        # not burn the user's one-time code.
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        try:
            password_validation.validate_password(attrs["new_password"])
        except DjangoValidationError as exc:
            raise serializers.ValidationError(
                {"new_password": list(exc.messages)}
            ) from exc
        return super().validate(attrs)


class ChangeOnlineStatusSerializer(serializers.Serializer):
    is_online = serializers.BooleanField()
