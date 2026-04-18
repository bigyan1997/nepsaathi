#!/bin/bash
echo "Running migrations..."
python3 manage.py migrate
echo "Expiring old listings..."
python3 manage.py expire_listings
echo "Sending expiry warnings..."
python manage.py send_expiry_warnings
echo "Starting gunicorn on port $PORT..."
exec gunicorn core.wsgi --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120