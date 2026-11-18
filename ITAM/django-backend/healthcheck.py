import os
import sys

import django
from django.core.management import call_command


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    django.setup()
    try:
        call_command("check")
        print("django healthcheck: ok")
        sys.exit(0)
    except Exception as exc:  # pragma: no cover
        print(f"django healthcheck: failed: {exc}")
        sys.exit(1)
