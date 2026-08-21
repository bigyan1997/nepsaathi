from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .serializers import FeedbackSerializer
from .models import FeedbackResponse, NewsletterSubscriber
from .sheets import sync_to_sheet
from core.emails import send_newsletter_welcome_email


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


class NewsletterSubscribeView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email or '@' not in email:
            return Response({'detail': 'A valid email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        subscriber, created = NewsletterSubscriber.objects.get_or_create(
            email=email,
            defaults={'is_active': True},
        )
        if not created and subscriber.is_active:
            return Response({'detail': "You're already subscribed."}, status=status.HTTP_200_OK)

        if not created:
            subscriber.is_active = True
            subscriber.save(update_fields=['is_active'])

        send_newsletter_welcome_email(email)
        return Response({'detail': "You're subscribed! Check your inbox for a welcome email."}, status=status.HTTP_201_CREATED)
