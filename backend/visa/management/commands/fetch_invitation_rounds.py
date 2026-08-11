"""
Fetch SkillSelect invitation round data from the DOHA website and store in DB.
Source: https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds

Run manually:  python manage.py fetch_invitation_rounds
Cron (monthly): 0 9 1 * * cd /app && python manage.py fetch_invitation_rounds
"""
import re
import datetime
import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand
from visa.models import InvitationRound

DOHA_URL = (
    'https://immi.homeaffairs.gov.au/visas/working-in-australia/'
    'skillselect/invitation-rounds'
)

MONTH_MAP = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4,
    'may': 5, 'june': 6, 'july': 7, 'august': 8,
    'september': 9, 'october': 10, 'november': 11, 'december': 12,
}

VISA_ALIASES = {
    '189': '189', 'subclass 189': '189', '190': '190', 'subclass 190': '190',
    '491': '491', 'subclass 491': '491',
}


def parse_month_year(text: str) -> str | None:
    """Convert 'March 2025' or 'March 2025' → '2025-03', return None if unparseable."""
    text = text.strip().lower()
    for name, num in MONTH_MAP.items():
        if name in text:
            m = re.search(r'(\d{4})', text)
            if m:
                return f"{m.group(1)}-{num:02d}"
    return None


def parse_date(text: str) -> datetime.date | None:
    """Parse a date string like '15 March 2025' into a date object."""
    text = text.strip()
    for fmt in ('%d %B %Y', '%d %b %Y', '%B %d %Y', '%b %d %Y'):
        try:
            return datetime.datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def parse_int(text: str) -> int | None:
    """Strip commas and parse integer."""
    cleaned = re.sub(r'[^\d]', '', text.strip())
    return int(cleaned) if cleaned else None


class Command(BaseCommand):
    help = 'Fetch SkillSelect invitation round data from DOHA and save to database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Print what would be saved without writing to DB',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        self.stdout.write(f'Fetching invitation rounds from DOHA...')

        try:
            response = requests.get(DOHA_URL, timeout=20, headers={
                'User-Agent': (
                    'Mozilla/5.0 (compatible; NepSaathi/1.0; '
                    '+https://nepsaathi.com)'
                )
            })
            response.raise_for_status()
        except requests.RequestException as e:
            self.stderr.write(self.style.ERROR(f'Failed to fetch DOHA page: {e}'))
            self.stderr.write('You can enter rounds manually via the Django admin.')
            return

        soup = BeautifulSoup(response.text, 'html.parser')
        tables = soup.find_all('table')

        if not tables:
            self.stderr.write(self.style.ERROR(
                'No tables found on the DOHA page. The page structure may have changed.'
            ))
            return

        rounds_found = []
        for table in tables:
            rows = table.find_all('tr')
            if len(rows) < 2:
                continue

            headers = [th.get_text(strip=True).lower() for th in rows[0].find_all(['th', 'td'])]

            # Identify relevant columns by partial header match
            col_month = col_visa = col_score = col_invitations = col_tie = None
            for i, h in enumerate(headers):
                if 'month' in h or 'round' in h or 'date' in h:
                    col_month = i
                elif 'subclass' in h or 'visa' in h or 'type' in h:
                    col_visa = i
                elif 'lowest' in h or 'point' in h or 'score' in h:
                    col_score = i
                elif 'invitation' in h or 'number' in h or 'issued' in h:
                    col_invitations = i
                elif 'tie' in h:
                    col_tie = i

            if col_month is None or col_score is None:
                continue

            for row in rows[1:]:
                cells = row.find_all(['td', 'th'])
                if len(cells) < 3:
                    continue

                def cell(idx):
                    if idx is None or idx >= len(cells):
                        return ''
                    return cells[idx].get_text(strip=True)

                round_date = parse_month_year(cell(col_month))
                if not round_date:
                    continue

                # Visa type — look for 189/190/491
                visa_raw = cell(col_visa).lower() if col_visa is not None else ''
                visa_type = None
                for key, val in VISA_ALIASES.items():
                    if key in visa_raw:
                        visa_type = val
                        break
                if visa_type is None:
                    # Try extracting a 3-digit number
                    m = re.search(r'\b(189|190|491)\b', visa_raw)
                    visa_type = m.group(1) if m else None

                if not visa_type:
                    continue

                lowest_score = parse_int(cell(col_score))
                invitations = parse_int(cell(col_invitations)) if col_invitations is not None else 0
                tiebreaker = parse_date(cell(col_tie)) if col_tie is not None else None

                if lowest_score is None:
                    continue

                rounds_found.append({
                    'round_date': round_date,
                    'visa_type': visa_type,
                    'lowest_score': lowest_score,
                    'invitations_issued': invitations or 0,
                    'tiebreaker_date': tiebreaker,
                })

        if not rounds_found:
            self.stderr.write(self.style.WARNING(
                'Could not parse any invitation rounds. '
                'The DOHA page structure may have changed — enter data manually via admin.'
            ))
            return

        created = updated = 0
        for r in rounds_found:
            self.stdout.write(
                f"  {r['round_date']} | {r['visa_type']} | "
                f"{r['lowest_score']} pts | {r['invitations_issued']} invitations"
            )
            if not dry_run:
                _, was_created = InvitationRound.objects.update_or_create(
                    round_date=r['round_date'],
                    visa_type=r['visa_type'],
                    defaults={
                        'lowest_score': r['lowest_score'],
                        'invitations_issued': r['invitations_issued'],
                        'tiebreaker_date': r['tiebreaker_date'],
                    },
                )
                if was_created:
                    created += 1
                else:
                    updated += 1

        if dry_run:
            self.stdout.write(self.style.WARNING(
                f'Dry run — {len(rounds_found)} rounds found, nothing written.'
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'Done — {created} new, {updated} updated from {len(rounds_found)} rounds found.'
            ))
