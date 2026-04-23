from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

class LoginRateThrottle(AnonRateThrottle):
    """Limit login attempts to prevent brute force."""
    scope = 'login'

class RegisterRateThrottle(AnonRateThrottle):
    """Limit registration attempts."""
    scope = 'register'

class PasswordResetThrottle(AnonRateThrottle):
    """Limit password reset attempts."""
    scope = 'password_reset'