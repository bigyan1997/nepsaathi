from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class SilentJWTAuthentication(JWTAuthentication):
    """
    Falls back to anonymous instead of raising 401 when a token is present
    but expired/invalid. This lets public endpoints serve unauthenticated
    requests even when the client sends a stale token.
    Protected endpoints still receive 401 via DRF's www-authenticate challenge.
    """

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except (InvalidToken, TokenError):
            return None
