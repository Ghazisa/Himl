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

# Nothing under test serves a static file, and both of these warn loudly when
# STATIC_ROOT has not been collected — which it never is in a test run.
MIDDLEWARE = [m for m in MIDDLEWARE if "whitenoise" not in m]  # noqa: F405
STORAGES = {  # noqa: F405
    **STORAGES,  # noqa: F405
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

DATABASES = {  # noqa: F405
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}
