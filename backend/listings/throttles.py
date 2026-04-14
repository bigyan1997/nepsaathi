from rest_framework.throttling import UserRateThrottle


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