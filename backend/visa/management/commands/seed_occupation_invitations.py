"""
Seed per-occupation invitation data for SkillSelect rounds.

Source: DOHA SkillSelect invitation rounds page (https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds)
Last verified: August 2026

Context (2025-26 program year):
- From 2025-26 DOHA issues invitations per-occupation with individual ceilings.
- ICT occupations hit their ceiling in the August 2025 round and were NOT invited again in June 2026.
- Healthcare, engineering, and other occupations continued to be invited in later rounds.
"""
from django.core.management.base import BaseCommand
from visa.models import Occupation, OccupationInvitation

# (anzsco_code, round_date, visa_type, score_or_None, was_invited, notes)
INVITATION_DATA = [
    # ── June 2026 round (189) — ICT not invited (per-occupation ceiling reached) ──
    # Source: DOHA SkillSelect June 2026 invitation round per-occupation table
    ('261111', '2026-06', '189', None, False, 'Ceiling reached in Aug 2025 round'),
    ('261112', '2026-06', '189', None, False, 'Ceiling reached in Aug 2025 round'),
    ('261113', '2026-06', '189', None, False, 'Ceiling reached in Aug 2025 round'),
    ('261311', '2026-06', '189', None, False, 'Ceiling reached in Aug 2025 round'),
    ('261312', '2026-06', '189', None, False, 'Ceiling reached in Aug 2025 round'),
    ('261313', '2026-06', '189', None, False, 'Ceiling reached in Aug 2025 round'),
    ('261314', '2026-06', '189', None, False, 'Ceiling reached in Aug 2025 round'),
    ('262111', '2026-06', '189', None, False, 'Ceiling reached in Aug 2025 round'),
    ('262112', '2026-06', '189', None, False, 'Ceiling reached in Aug 2025 round'),
    ('262113', '2026-06', '189', None, False, 'Ceiling reached in Aug 2025 round'),
    ('263111', '2026-06', '189', None, False, 'Ceiling reached in Aug 2025 round'),
    ('263112', '2026-06', '189', None, False, 'Ceiling reached in Aug 2025 round'),
    ('263113', '2026-06', '189', None, False, 'Ceiling reached in Aug 2025 round'),
    ('263211', '2026-06', '189', None, False, 'Ceiling reached in Aug 2025 round'),
    ('263311', '2026-06', '189', None, False, 'Ceiling reached in Aug 2025 round'),
    ('263312', '2026-06', '189', None, False, 'Ceiling reached in Aug 2025 round'),
]


class Command(BaseCommand):
    help = 'Seed per-occupation invitation data (SkillSelect rounds)'

    def handle(self, *args, **options):
        created = updated = skipped = 0

        for anzsco_code, round_date, visa_type, score, was_invited, notes in INVITATION_DATA:
            try:
                occupation = Occupation.objects.get(anzsco_code=anzsco_code)
            except Occupation.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  ⚠ Occupation {anzsco_code} not found — skipping'))
                skipped += 1
                continue

            _, was_created = OccupationInvitation.objects.update_or_create(
                occupation=occupation,
                round_date=round_date,
                visa_type=visa_type,
                defaults={
                    'score': score,
                    'was_invited': was_invited,
                    'notes': notes,
                },
            )
            label = 'created' if was_created else 'updated'
            status = f'{score} pts' if score is not None else ('NOT invited' if not was_invited else 'score N/A')
            self.stdout.write(f'  {anzsco_code} | {round_date} | {visa_type} | {status} — {label}')
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nDone — {created} created, {updated} updated, {skipped} skipped.'
        ))
        self.stdout.write(
            'Add more per-occupation data via Django admin: /nepsaathi-biggy/visa/occupationinvitation/\n'
            'Source: https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds'
        )
