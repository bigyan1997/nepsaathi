#!/bin/bash
set -e
echo "Running expire_listings..."
python manage.py expire_listings
echo "Running send_expiry_warnings..."
python manage.py send_expiry_warnings
echo "Done."
