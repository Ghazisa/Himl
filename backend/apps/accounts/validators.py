import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

SAUDI_PHONE_RE = re.compile(r"^(?:\+9665|9665|05|5)\d{8}$")


class PlatformPasswordValidator:
    """Password policy: 8+ characters, letters and digits, at least one uppercase."""

    MIN_LENGTH = 8

    def validate(self, password, user=None):
        errors = []
        if len(password) < self.MIN_LENGTH:
            errors.append(_("Password must be at least 8 characters long."))
        if not re.search(r"[A-Z]", password):
            errors.append(_("Password must contain at least one uppercase letter."))
        if not re.search(r"[a-z]", password):
            errors.append(_("Password must contain at least one lowercase letter."))
        if not re.search(r"\d", password):
            errors.append(_("Password must contain at least one number."))
        if errors:
            raise ValidationError(errors)

    def get_help_text(self):
        return _(
            "Your password must be at least 8 characters and include an uppercase "
            "letter, a lowercase letter, and a number."
        )


def normalize_saudi_phone(value: str) -> str:
    """Reduce accepted Saudi mobile formats to a single canonical +9665XXXXXXXX form."""
    digits = re.sub(r"[\s\-()]", "", value or "")
    if not SAUDI_PHONE_RE.match(digits):
        raise ValidationError(
            _("Enter a valid Saudi mobile number, for example 0512345678.")
        )
    tail = digits[-9:]
    return f"+966{tail}"
