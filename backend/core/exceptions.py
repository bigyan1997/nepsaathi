from rest_framework.views import exception_handler
from rest_framework.exceptions import (
    Throttled, NotAuthenticated, AuthenticationFailed,
    PermissionDenied, NotFound, MethodNotAllowed,
    ValidationError, ParseError, UnsupportedMediaType,
)


def _friendly_wait(seconds):
    if seconds is None:
        return "a moment"
    minutes = int(seconds // 60)
    hours = int(minutes // 60)
    if hours >= 1:
        return f"{hours} hour{'s' if hours != 1 else ''}"
    if minutes >= 1:
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    return "a moment"


# Raw DRF messages that should never reach users
_RAW_REPLACEMENTS = {
    "Authentication credentials were not provided.": "Please sign in to continue.",
    "Given token not valid for any token type": "Your session has expired. Please sign in again.",
    "Token is invalid or expired": "Your session has expired. Please sign in again.",
    "No active account found with the given credentials": "Incorrect email or password.",
    "User account is disabled.": "This account has been suspended.",
    "Permission denied.": "You don't have permission to do that.",
    "Not found.": "That page or item could not be found.",
    "Method not allowed.": "This action is not supported.",
    "Unsupported media type": "Invalid file format.",
    "This field may not be null.": "This field is required.",
    "This field may not be blank.": "This field is required.",
    "A valid integer is required.": "Please enter a valid number.",
    "A valid number is required.": "Please enter a valid number.",
}


def _translate(msg: str) -> str:
    """Replace known raw DRF strings with human-readable equivalents."""
    for raw, friendly in _RAW_REPLACEMENTS.items():
        if raw.lower() in msg.lower():
            return friendly
    return msg


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return response

    if isinstance(exc, Throttled):
        wait_str = _friendly_wait(exc.wait)
        response.data = {
            "detail": f"You're doing that too often. Please wait {wait_str} and try again."
        }
        return response

    if isinstance(exc, NotAuthenticated):
        response.data = {"detail": "Please sign in to continue."}
        return response

    if isinstance(exc, AuthenticationFailed):
        raw = str(exc.detail) if hasattr(exc, "detail") else ""
        response.data = {"detail": _translate(raw) if raw else "Authentication failed. Please sign in again."}
        return response

    if isinstance(exc, PermissionDenied):
        response.data = {"detail": "You don't have permission to do that."}
        return response

    if isinstance(exc, NotFound):
        response.data = {"detail": "That page or item could not be found."}
        return response

    if isinstance(exc, MethodNotAllowed):
        response.data = {"detail": "This action is not supported here."}
        return response

    if isinstance(exc, (ParseError, UnsupportedMediaType)):
        response.data = {"detail": "The data you sent couldn't be read. Please try again."}
        return response

    # For ValidationError and everything else: walk the response data and translate
    # any raw DRF strings that snuck through
    if isinstance(response.data, dict):
        for key, val in response.data.items():
            if isinstance(val, str):
                response.data[key] = _translate(val)
            elif isinstance(val, list):
                response.data[key] = [_translate(v) if isinstance(v, str) else v for v in val]

    return response
