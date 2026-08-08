#!/usr/bin/env bash
# Render build step for the Himl API.
#
# Render's Python runtime installs from requirements.txt, but this project's
# source of truth is uv.lock. Exporting the lock at build time keeps the
# deployed dependency set byte-for-byte identical to the one CI tests against,
# instead of maintaining a second file that silently drifts.
set -o errexit
set -o pipefail
set -o nounset

pip install --upgrade pip uv

uv export --frozen --no-dev --no-emit-project --format requirements-txt -o requirements.txt
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate --no-input

# Optional demo content. Off by default so a real deployment is never seeded
# with accounts whose password is published in the README.
if [ "${SEED_DEMO:-false}" = "true" ]; then
  echo "SEED_DEMO=true — loading demo accounts and vehicles"
  python manage.py seed_demo
fi
