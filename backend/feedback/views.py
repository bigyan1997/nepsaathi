from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .serializers import FeedbackSerializer
from .models import FeedbackResponse
from .sheets import sync_to_sheet


class FeedbackView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = FeedbackSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user if request.user.is_authenticated else None
        feedback = FeedbackResponse.objects.create(
            satisfaction=serializer.validated_data['satisfaction'],
            reason=serializer.validated_data['reason'],
            page_url=serializer.validated_data.get('page_url', ''),
            user=user,
        )
        sync_to_sheet(feedback)
        return Response({'detail': 'Thank you for your feedback!'}, status=status.HTTP_201_CREATED)
