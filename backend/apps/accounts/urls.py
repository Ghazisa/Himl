from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = "accounts"

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("otp/resend/", views.ResendOTPView.as_view(), name="otp-resend"),
    path("otp/verify/", views.VerifyOTPView.as_view(), name="otp-verify"),
    path(
        "password/reset/",
        views.PasswordResetRequestView.as_view(),
        name="password-reset",
    ),
    path(
        "password/reset/confirm/",
        views.PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
    path("me/", views.MeView.as_view(), name="me"),
    path("me/profile/", views.ProfileView.as_view(), name="me-profile"),
    path("me/online/", views.OnlineStatusView.as_view(), name="me-online"),
]
