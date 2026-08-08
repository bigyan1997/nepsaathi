import logging
import requests
from django.core.management.base import BaseCommand
from remittance.models import RemittanceRate

logger = logging.getLogger(__name__)

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/124.0.0.0 Safari/537.36'
    ),
    'Accept': 'application/json',
}

PROVIDERS = {
    'wise': {
        'send_url': 'https://wise.com/au/send-money/#/',
    },
    'remitly': {
        'send_url': 'https://www.remitly.com/au/en/nepal',
    },
    'worldremit': {
        'send_url': 'https://www.worldremit.com/en/australia/send-money-to-nepal',
    },
    'wu': {
        'send_url': 'https://www.westernunion.com/au/en/send-money/app/start',
    },
}


def fetch_wise():
    """Mid-market AUD→NPR rate from Wise public rates API."""
    resp = requests.get(
        'https://api.wise.com/v1/rates',
        params={'source': 'AUD', 'target': 'NPR'},
        headers=HEADERS,
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    # Returns a list; grab the first entry
    rate = float(data[0]['rate'])
    # Wise charges ~0.55% + fixed fee; use a conservative flat fee for display
    return rate, 3.99


def fetch_remitly():
    """AUD→NPR rate from Remitly's public calculator endpoint."""
    resp = requests.get(
        'https://api.remitly.io/v3/calculator/estimate',
        params={
            'sourceCountry': 'AUS',
            'destinationCountry': 'NPL',
            'sourceCurrency': 'AUD',
            'destinationCurrency': 'NPR',
            'amount': '500',
            'receiptType': 'BANK_DEPOSIT',
            'paymentType': 'debitCard',
        },
        headers=HEADERS,
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    exchange_rate = float(data['exchangeRate'])
    fee = float(data.get('transferFee', 0))
    return exchange_rate, fee


def fetch_worldremit():
    """AUD→NPR rate from WorldRemit's public calculator API."""
    resp = requests.get(
        'https://api.worldremit.com/v3/calculators/send',
        params={
            'fromCountryIso3': 'AUS',
            'toCountryIso3':   'NPL',
            'fromCurrencyIso3': 'AUD',
            'toCurrencyIso3':   'NPR',
            'sendAmount': '500',
            'deliveryMethod': 'BANK_TRANSFER',
        },
        headers=HEADERS,
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    rate = float(data['exchangeRate'])
    fee  = float(data.get('fee', {}).get('amount', 0))
    return rate, fee


def fetch_wu():
    """AUD→NPR rate from Western Union's public price service."""
    resp = requests.get(
        'https://www.westernunion.com/api/en-AU/price-service/v2/public/rates',
        params={
            'fromCurrencyCode': 'AUD',
            'toCurrencyCode':   'NPR',
        },
        headers={**HEADERS, 'Accept': 'application/json, text/plain, */*'},
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    # WU returns a list of corridors; find our pair
    for entry in data:
        if entry.get('toCurrencyCode') == 'NPR':
            rate = float(entry['exchangeRate'])
            fee  = float(entry.get('fees', [{'amount': 0}])[0].get('amount', 0))
            return rate, fee
    raise ValueError('NPR corridor not found in WU response')


FETCHERS = {
    'wise':       fetch_wise,
    'remitly':    fetch_remitly,
    'worldremit': fetch_worldremit,
    'wu':         fetch_wu,
}


class Command(BaseCommand):
    help = 'Fetch live AUD→NPR rates from Wise, Remitly, WorldRemit, Western Union'

    def handle(self, *args, **options):
        for provider, meta in PROVIDERS.items():
            try:
                rate, fee = FETCHERS[provider]()
                obj, created = RemittanceRate.objects.update_or_create(
                    provider=provider,
                    defaults={
                        'rate':     rate,
                        'fee_aud':  fee,
                        'send_url': meta['send_url'],
                    },
                )
                action = 'Created' if created else 'Updated'
                self.stdout.write(f'{action} {provider}: {rate} NPR/AUD, fee=${fee}')
            except Exception as e:
                logger.error(f'fetch_remittance_rates: {provider} failed — {e}')
                self.stderr.write(f'SKIP {provider}: {e}')
