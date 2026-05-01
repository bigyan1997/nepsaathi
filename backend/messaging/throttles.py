from rest_framework.throttling import UserRateThrottle


class MessageSendThrottle(UserRateThrottle):
    scope = 'message_send'
