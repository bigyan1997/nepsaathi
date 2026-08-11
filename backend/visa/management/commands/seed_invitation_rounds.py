"""
Seed InvitationRound table with data from the DOHA SkillSelect invitation rounds page.
Source: https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds
Last updated on DOHA: 4 August 2026

Note: From 2025-26, DOHA issues invitations per-occupation with individual ceilings.
The 'lowest_score' field stores the minimum score across all occupations invited in that round.
190 (Skilled Nominated) rounds are state/territory managed and not listed here.
"""
import datetime
from django.core.management.base import BaseCommand
from visa.models import InvitationRound

# (round_date, visa_type, lowest_score, invitations_issued, tiebreaker_date or None)
# Source: DOHA SkillSelect invitation rounds page, August 2026
ROUNDS = [
    # ── 2025-26 program year — Skilled Independent (189) ────────────────────
    # June 2026 round: full per-occupation data available on DOHA
    # Scores ranged 65 (trades) to 100 (Urologist). Lowest = 65.
    ('2026-06', '189', 65, 10_000, datetime.date(2026, 4, 24)),

    # November 2025 round (totals from annual summary table; per-occupation scores not published)
    ('2025-11', '189', None, 10_000, None),

    # August 2025 round (totals from annual summary table)
    ('2025-08', '189', None,  6_887, None),

    # ── 491 Family Sponsored rounds (2025-26) ───────────────────────────────
    ('2025-11', '491', None,    300, None),
    ('2025-08', '491', None,    150, None),
]


class Command(BaseCommand):
    help = 'Seed InvitationRound table from DOHA SkillSelect data (2025-26 program year)'

    def handle(self, *args, **options):
        created = updated = 0
        for round_date, visa_type, lowest_score, invitations_issued, tiebreaker_date in ROUNDS:
            _, was_created = InvitationRound.objects.update_or_create(
                round_date=round_date,
                visa_type=visa_type,
                defaults={
                    'lowest_score': lowest_score,
                    'invitations_issued': invitations_issued,
                    'tiebreaker_date': tiebreaker_date,
                },
            )
            label = 'created' if was_created else 'updated'
            score_str = f'{lowest_score} pts' if lowest_score is not None else 'score N/A'
            self.stdout.write(f'  {round_date} | {visa_type} | {score_str} | {invitations_issued:,} invitations — {label}')
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nDone — {created} created, {updated} updated.'
        ))
        self.stdout.write(
            'Note: rounds with lowest_score=0 have invitations count only (per-occupation scores not available).\n'
            'Add historical data via admin: /nepsaathi-biggy/visa/invitationround/\n'
            'Previous rounds data: https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/previous-rounds'
        )
