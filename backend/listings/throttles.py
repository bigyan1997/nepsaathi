from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class ListingCreateThrottle(UserRateThrottle):
    """
    Limits how many listings a user can create per hour.
    Prevents spam posting.
    """
    scope = 'listing_create'


class BusinessCreateThrottle(UserRateThrottle):
    """
    Limits how many businesses a user can register per hour.
    """
    scope = 'business_create'


class ListingViewThrottle(AnonRateThrottle):
    """Limits view-ping requests to prevent artificial inflation of view counts."""
    scope = 'listing_view'