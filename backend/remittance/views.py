from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import RemittanceRate
from .serializers import RemittanceRateSerializer


class RemittanceRateListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        rates = RemittanceRate.objects.all().order_by('provider')[:100]
        return Response(RemittanceRateSerializer(rates, many=True).data)
