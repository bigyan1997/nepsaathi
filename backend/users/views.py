from rest_framework import generics, permissions
from .serializers import UserSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/users/profile/  — retrieve logged in user's profile
    PATCH /api/users/profile/ — update logged in user's profile
    """
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user