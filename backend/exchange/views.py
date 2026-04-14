import requests
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions


class ExchangeRateView(APIView):
    """
    GET /api/exchange/
    Returns live exchange rates — how many NPR per 1 foreign currency.
    e.g. 1 AUD = 88.50 NPR
    """
    permission_classes = (permissions.AllowAny,)
    CACHE_KEY = 'nepsaathi_exchange_rates'
    CACHE_TIMEOUT = 60 * 60  # 1 hour

    CURRENCY_INFO = {
        'AUD': {'flag': '🇦🇺', 'name': 'Australian Dollar'},
        'GBP': {'flag': '🇬🇧', 'name': 'British Pound'},
        'USD': {'flag': '🇺🇸', 'name': 'US Dollar'},
        'CAD': {'flag': '🇨🇦', 'name': 'Canadian Dollar'},
    }

    def get(self, request):
        # Try cache first
        cached = cache.get(self.CACHE_KEY)
        if cached:
            return Response({'rates': cached, 'source': 'cache', 'base': 'NPR'})

        try:
            # Free API — base is USD, we convert via USD
            # 1 USD = X NPR, 1 USD = Y AUD → 1 AUD = (X/Y) NPR
            url = 'https://api.exchangerate-api.com/v4/latest/USD'
            response = requests.get(url, timeout=5)
            data = response.json()
            all_rates = data.get('rates', {})

            usd_to_npr = all_rates.get('NPR', 133.5)

            rates = {}
            for currency, info in self.CURRENCY_INFO.items():
                usd_to_currency = all_rates.get(currency, 1)
                # 1 currency = (NPR per USD) / (currency per USD) NPR
                rate = round(usd_to_npr / usd_to_currency, 2)
                rates[currency] = {
                    'rate': rate,
                    'flag': info['flag'],
                    'name': info['name'],
                }

            cache.set(self.CACHE_KEY, rates, self.CACHE_TIMEOUT)
            return Response({'rates': rates, 'source': 'live', 'base': 'NPR'})

        except Exception:
            # Fallback approximate rates
            fallback = {
                'AUD': {'rate': 88.50, 'flag': '🇦🇺', 'name': 'Australian Dollar'},
                'GBP': {'rate': 163.20, 'flag': '🇬🇧', 'name': 'British Pound'},
                'USD': {'rate': 133.50, 'flag': '🇺🇸', 'name': 'US Dollar'},
                'CAD': {'rate': 98.20, 'flag': '🇨🇦', 'name': 'Canadian Dollar'},
            }
            return Response({
                'rates': fallback,
                'source': 'fallback',
                'base': 'NPR',
                'note': 'Approximate rates — live data unavailable',
            })