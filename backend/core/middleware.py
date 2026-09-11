from django.http import Http404
from decouple import config


class AdminIPRestrictionMiddleware:
    """Block /api/panel/ and the Django admin URL from non-allowlisted IPs.

    Set ALLOWED_ADMIN_IPS on Railway as a comma-separated list of IPs.
    If the env var is empty or absent, restriction is disabled (safe dev fallback).
    """

    def __init__(self, get_response):
        self.get_response = get_response
        ips = config('ALLOWED_ADMIN_IPS', default='')
        self.allowed_ips = {ip.strip() for ip in ips.split(',') if ip.strip()}
        raw_admin = config('ADMIN_URL', default='nepsaathi-admin/').rstrip('/') + '/'
        self._admin_prefix = f'/{raw_admin}'

    def __call__(self, request):
        if self.allowed_ips:
            path = request.path
            if path.startswith('/api/panel/') or path.startswith(self._admin_prefix):
                if self._get_ip(request) not in self.allowed_ips:
                    raise Http404
        return self.get_response(request)

    @staticmethod
    def _get_ip(request):
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
        if forwarded:
            return forwarded.split(',')[-1].strip()
        return request.META.get('REMOTE_ADDR', '')
