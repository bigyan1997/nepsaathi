#!/bin/bash
echo "Running migrations..."
python3 manage.py migrate
echo "Starting gunicorn on port $PORT..."
exec gunicorn core.wsgi --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120