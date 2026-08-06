from django.conf import settings
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import OTPPurpose, Role, User
from .permissions import IsTransporter
from .serializers import (
    ChangeOnlineStatusSerializer,
    LoginSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    PasswordResetConfirmSerializer,
    RegisterSerializer,
    ShipperProfileSerializer,
    TransporterProfileSerializer,
    UserSerializer,
    issue_tokens,
)
from .services import send_otp_email

# Returned for any OTP request so the endpoint cannot be used to discover which
# email addresses are registered.
OTP_GENERIC_RESPONSE = {
    "detail": "If an account exists for this email, a verification code has been sent."
}


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_scope = "otp"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        send_otp_email(user, OTPPurpose.VERIFY_EMAIL)
        return Response(
            {
                "detail": "Account created. A verification code has been sent to your email.",
                "email": user.email,
                "role": user.role,
                "otp_expires_in_minutes": settings.OTP_TTL_MINUTES,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        if not user.is_email_verified:
            send_otp_email(user, OTPPurpose.VERIFY_EMAIL)
            return Response(
                {
                    "detail": "Your account is not verified yet. We sent you a new code.",
                    "verification_required": True,
                    "email": user.email,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response({"user": UserSerializer(user).data, "tokens": issue_tokens(user)})


class ResendOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "otp"

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email__iexact=serializer.validated_data["email"]).first()
        if user:
            send_otp_email(user, serializer.validated_data["purpose"])
        return Response(OTP_GENERIC_RESPONSE)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "otp"

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        if not user.is_email_verified:
            user.is_email_verified = True
            user.save(update_fields=["is_email_verified"])

        return Response({"user": UserSerializer(user).data, "tokens": issue_tokens(user)})


class PasswordResetRequestView(ResendOTPView):
    def post(self, request):
        user = User.objects.filter(email__iexact=request.data.get("email", "")).first()
        if user:
            send_otp_email(user, OTPPurpose.RESET_PASSWORD)
        return Response(OTP_GENERIC_RESPONSE)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "otp"

    def post(self, request):
        data = {**request.data, "purpose": OTPPurpose.RESET_PASSWORD}
        serializer = PasswordResetConfirmSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        user.set_password(serializer.validated_data["new_password"])
        user.is_email_verified = True
        user.save(update_fields=["password", "is_email_verified"])
        return Response({"detail": "Password updated. You can now sign in."})


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def _serializer(self, user, **kwargs):
        # `data` must be omitted entirely on reads — passing data=None makes DRF
        # treat the serializer as bound and refuse to render `.data`.
        if user.role == Role.SHIPPER:
            return ShipperProfileSerializer(user.shipper_profile, **kwargs)
        return TransporterProfileSerializer(user.transporter_profile, **kwargs)

    def get(self, request):
        return Response(self._serializer(request.user).data)

    def patch(self, request):
        serializer = self._serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class OnlineStatusView(APIView):
    permission_classes = [IsTransporter]

    def post(self, request):
        serializer = ChangeOnlineStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = request.user.transporter_profile
        profile.set_online(serializer.validated_data["is_online"])
        return Response(
            {"is_online": profile.is_online, "last_online_at": profile.last_online_at}
        )
