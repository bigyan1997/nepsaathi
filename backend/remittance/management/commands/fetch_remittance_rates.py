import logging
import requests
from django.core.management.base import BaseCommand
from remittance.models import RemittanceRate

logger = logging.getLogger(__name__)

# Mid-market AUD→NPR from open.er-api.com (free, no key required)
RATES_URL = 'https://open.er-api.com/v6/latest/AUD'

# Provider spreads (markup over mid-market) and typical fees.
# Sourced from public rate-comparison research for AUD→NPR corridor.
# Wise is tightest (~0.5%), WU highest (~3.5%).
PROVIDERS = {
    'wise': {
        'spread':   0.0055,   # ~0.55% markup
        'fee_aud':  3.99,
        'send_url': 'https://wise.com/au/send-money/#/',
    },
    'remitly': {
        'spread':   0.012,    # ~1.2% markup
        'fee_aud':  0.00,     # typically free for bank transfers from AU
        'send_url': 'https://www.remitly.com/au/en/nepal',
    },
    'worldremit': {
        'spread':   0.018,    # ~1.8% markup
        'fee_aud':  1.99,
        'send_url': 'https://www.worldremit.com/en/australia/send-money-to-nepal',
    },
    'wu': {
        'spread':   0.035,    # ~3.5% markup
        'fee_aud':  5.00,
        'send_url': 'https://www.westernunion.com/au/en/send-money/app/start',
    },
}


class Command(BaseCommand):
    help = 'Fetch mid-market AUD→NPR rate and derive per-provider estimates'

    def handle(self, *args, **options):
        # 1. Get mid-market rate
        try:
            resp = requests.get(RATES_URL, timeout=10)
            resp.raise_for_status()
            mid = float(resp.json()['rates']['NPR'])
            self.stdout.write(f'Mid-market AUD→NPR: {mid}')
        except Exception as e:
            logger.error(f'fetch_remittance_rates: mid-market fetch failed — {e}')
            self.stderr.write(f'FATAL: could not fetch base rate — {e}')
            return

        # 2. Derive and store each provider's rate
        for provider, cfg in PROVIDERS.items():
            rate = round(mid * (1 - cfg['spread']), 4)
            try:
                obj, created = RemittanceRate.objects.update_or_create(
                    provider=provider,
                    defaults={
                        'rate':     rate,
                        'fee_aud':  cfg['fee_aud'],
                        'send_url': cfg['send_url'],
                    },
                )
                action = 'Created' if created else 'Updated'
                self.stdout.write(f'{action} {provider}: {rate} NPR/AUD, fee=${cfg["fee_aud"]}')
            except Exception as e:
                logger.error(f'fetch_remittance_rates: DB write failed for {provider} — {e}')
                self.stderr.write(f'SKIP {provider}: {e}')
