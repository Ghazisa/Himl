from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from .models import EmailOTP, OTPPurpose

SUBJECTS = {
    OTPPurpose.VERIFY_EMAIL: "Himl — Account verification code | حِمْل — رمز تفعيل الحساب",
    OTPPurpose.RESET_PASSWORD: "Himl — Password reset code | حِمْل — رمز إعادة تعيين كلمة المرور",
}


def send_otp_email(user, purpose=OTPPurpose.VERIFY_EMAIL):
    """Issue a fresh one-time code and email it. Returns the OTP record."""
    otp, raw_code = EmailOTP.objects.issue(user, purpose)
    context = {
        "code": raw_code,
        "first_name": user.first_name,
        "ttl_minutes": settings.OTP_TTL_MINUTES,
        "is_reset": purpose == OTPPurpose.RESET_PASSWORD,
    }
    text_body = render_to_string("emails/otp.txt", context)
    html_body = render_to_string("emails/otp.html", context)

    message = EmailMultiAlternatives(
        subject=SUBJECTS[purpose],
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    message.attach_alternative(html_body, "text/html")
    message.send(fail_silently=False)
    return otp
