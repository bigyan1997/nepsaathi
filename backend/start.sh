#!/bin/bash
echo "Starting on port $PORT"
python manage.py migrate
exec gunicorn core.wsgi:application --bind "0.0.0.0:${PORT}"

