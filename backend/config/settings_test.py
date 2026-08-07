"""Settings used by the test suite.

Rate limiting is a production concern; leaving it on makes tests fail for
reasons unrelated to what they assert. Password hashing is also swapped for a
fast hasher so the suite stays quick as it grows.
"""

from .settings import *  # noqa: F403

REST_FRAMEWORK = {  # noqa: F405
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_THROTTLE_RATES": {"otp": None, "login": None},
}

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

DATABASES = {  # noqa: F405
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}
