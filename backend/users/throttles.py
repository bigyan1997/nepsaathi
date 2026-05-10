from rest_framework.throttling import AnonRateThrottle

class LoginRateThrottle(AnonRateThrottle):
    """Limit login attempts to prevent brute force."""
    scope = 'login'

class RegisterRateThrottle(AnonRateThrottle):
    """Limit registration attempts."""
    scope = 'register'

class PasswordResetThrottle(AnonRateThrottle):
    """Limit password reset attempts."""
    scope = 'password_reset'

class ContactRateThrottle(AnonRateThrottle):
    """Limit contact form submissions to prevent email flooding."""
    scope = 'contact'