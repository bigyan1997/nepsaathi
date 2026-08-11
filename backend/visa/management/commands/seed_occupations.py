"""
Seed the Occupation table with common occupations for Nepali Australians.
Data sourced from the DOHA Skilled Occupation List (August 2025).
Always verify at: https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list
"""
import datetime
from django.core.management.base import BaseCommand
from visa.models import Occupation

LAST_UPDATED = datetime.date(2025, 8, 11)

# (anzsco_code, title, list_type, eligible_visas, alternative_titles, notes)
OCCUPATIONS = [
    # ── ICT / Software ──────────────────────────────────────────────────────
    ('261111', 'ICT Business Analyst',                  'MLTSSL', '189,190,491', 'Business Analyst, BA', ''),
    ('261112', 'Systems Analyst',                        'MLTSSL', '189,190,491', '', ''),
    ('261113', 'Systems Architect',                      'MLTSSL', '189,190,491', 'IT Architect, Solution Architect', ''),
    ('261311', 'Analyst Programmer',                     'MLTSSL', '189,190,491', '', ''),
    ('261312', 'Developer Programmer',                   'MLTSSL', '189,190,491', 'Software Developer', ''),
    ('261313', 'Software Engineer',                      'MLTSSL', '189,190,491', '', 'ACS assessment required for most applicants'),
    ('261314', 'Software Tester',                        'MLTSSL', '189,190,491', 'QA Engineer, Test Analyst', ''),
    ('262111', 'Database Administrator',                 'MLTSSL', '189,190,491', 'DBA', ''),
    ('262112', 'ICT Security Specialist',                'MLTSSL', '189,190,491', 'Cyber Security Analyst, InfoSec', ''),
    ('262113', 'Systems Administrator',                  'MLTSSL', '189,190,491', 'System Admin, SysAdmin', ''),
    ('263111', 'Computer Network and Systems Engineer',  'MLTSSL', '189,190,491', 'Network Engineer', ''),
    ('263112', 'Network Administrator',                  'MLTSSL', '189,190,491', '', ''),
    ('263113', 'Network Analyst',                        'MLTSSL', '189,190,491', '', ''),
    ('263211', 'ICT Quality Assurance Engineer',         'MLTSSL', '189,190,491', 'QA Engineer', ''),
    ('263311', 'Telecommunications Engineer',            'MLTSSL', '189,190,491', 'Telecom Engineer', ''),
    ('263312', 'Telecommunications Network Engineer',    'MLTSSL', '189,190,491', '', ''),

    # ── Engineering ──────────────────────────────────────────────────────────
    ('233211', 'Civil Engineer',                         'MLTSSL', '189,190,491', '', 'Engineers Australia assessment'),
    ('233212', 'Geotechnical Engineer',                  'MLTSSL', '189,190,491', '', 'Engineers Australia assessment'),
    ('233214', 'Structural Engineer',                    'MLTSSL', '189,190,491', '', 'Engineers Australia assessment'),
    ('233215', 'Transport Engineer',                     'MLTSSL', '189,190,491', '', 'Engineers Australia assessment'),
    ('233311', 'Electrical Engineer',                    'MLTSSL', '189,190,491', '', 'Engineers Australia assessment'),
    ('233411', 'Electronics Engineer',                   'MLTSSL', '189,190,491', '', ''),
    ('233511', 'Industrial Engineer',                    'MLTSSL', '189,190,491', '', ''),
    ('233512', 'Mechanical Engineer',                    'MLTSSL', '189,190,491', '', 'Engineers Australia assessment'),
    ('233513', 'Production or Plant Engineer',           'MLTSSL', '189,190,491', '', ''),
    ('233911', 'Aeronautical Engineer',                  'MLTSSL', '189,190,491', '', ''),
    ('233912', 'Agricultural Engineer',                  'MLTSSL', '189,190,491', '', ''),

    # ── Accounting / Finance ─────────────────────────────────────────────────
    ('221111', 'Accountant (General)',                   'MLTSSL', '189,190,491', 'General Accountant', 'CPA Australia or CAANZ assessment'),
    ('221112', 'Management Accountant',                  'MLTSSL', '189,190,491', '', 'CPA Australia or CAANZ assessment'),
    ('221113', 'Taxation Accountant',                    'MLTSSL', '189,190,491', 'Tax Accountant', 'CPA Australia or CAANZ assessment'),
    ('221213', 'External Auditor',                       'MLTSSL', '189,190,491', 'Auditor', ''),
    ('221214', 'Internal Auditor',                       'MLTSSL', '189,190,491', '', ''),

    # ── Nursing / Healthcare ─────────────────────────────────────────────────
    ('254111', 'Nurse Practitioner',                     'MLTSSL', '189,190,491', '', 'AHPRA registration required'),
    ('254411', 'Registered Nurse (Aged Care)',            'MLTSSL', '189,190,491', 'Aged Care Nurse', 'AHPRA registration required'),
    ('254416', 'Registered Nurse (Medical)',              'MLTSSL', '189,190,491', 'Medical Nurse', 'AHPRA registration required'),
    ('254418', 'Registered Nurse (Mental Health)',        'MLTSSL', '189,190,491', 'Mental Health Nurse', 'AHPRA registration required'),
    ('254421', 'Registered Nurse (Perioperative)',        'MLTSSL', '189,190,491', 'Theatre Nurse', 'AHPRA registration required'),
    ('254499', 'Registered Nurses NEC',                  'MLTSSL', '189,190,491', 'Registered Nurse', 'AHPRA registration required'),

    # ── Medical ──────────────────────────────────────────────────────────────
    ('253111', 'General Medical Practitioner',           'MLTSSL', '189,190,491', 'GP, Doctor', 'AMC assessment + AHPRA registration required'),
    ('253211', 'Anaesthetist',                           'MLTSSL', '189,190,491', '', 'AHPRA registration required'),
    ('253311', 'Specialist Physician (General Medicine)','MLTSSL', '189,190,491', 'Specialist Doctor', 'AHPRA registration required'),
    ('253999', 'Medical Practitioners NEC',              'MLTSSL', '189,190,491', '', 'Verify specific specialty on DOHA list'),

    # ── Allied Health ─────────────────────────────────────────────────────────
    ('251211', 'Medical Diagnostic Radiographer',        'MLTSSL', '189,190,491', 'Radiographer', 'AHPRA registration required'),
    ('251212', 'Medical Radiation Therapist',            'MLTSSL', '189,190,491', 'Radiation Therapist', 'AHPRA registration required'),
    ('252111', 'Pharmacist',                             'MLTSSL', '189,190,491', '', 'AHPRA registration required'),
    ('252411', 'Physiotherapist',                        'MLTSSL', '189,190,491', 'Physio', 'AHPRA registration required'),
    ('252511', 'Occupational Therapist',                 'MLTSSL', '189,190,491', 'OT', 'OTBA assessment required'),

    # ── Teaching ─────────────────────────────────────────────────────────────
    ('241111', 'Early Childhood (Pre-primary School) Teacher', 'MLTSSL', '189,190,491', 'Preschool Teacher, Kindy Teacher', 'AITSL assessment required'),
    ('241411', 'Secondary School Teacher',               'MLTSSL', '189,190,491', 'High School Teacher', 'AITSL assessment required'),

    # ── Architecture / Design ────────────────────────────────────────────────
    ('232111', 'Architect',                              'MLTSSL', '189,190,491', '', 'AACA assessment required'),
    ('232611', 'Land Economist',                         'STSOL',  '190,491',     '', ''),
    ('232613', 'Surveyor',                               'MLTSSL', '189,190,491', 'Land Surveyor', ''),

    # ── Social Work ───────────────────────────────────────────────────────────
    ('272511', 'Social Worker',                          'MLTSSL', '189,190,491', '', 'AASW assessment required'),

    # ── Management / Business ─────────────────────────────────────────────────
    ('133111', 'Construction Project Manager',           'MLTSSL', '189,190,491', 'Project Manager (Construction)', ''),
    ('224111', 'Management Consultant',                  'MLTSSL', '189,190,491', 'Business Consultant', 'VETASSESS assessment'),

    # ── Trades (STSOL) ───────────────────────────────────────────────────────
    ('341111', 'Electrician (General)',                  'STSOL',  '190,491',     'Licensed Electrician', 'State/territory electrical licence required'),
    ('334111', 'Plumber (General)',                      'STSOL',  '190,491',     'Licensed Plumber', 'State/territory plumbing licence required'),
    ('351311', 'Chef',                                   'STSOL',  '190,491',     'Head Chef', 'Also eligible for 482 employer-sponsored visa'),
]


class Command(BaseCommand):
    help = 'Seed the Occupation table with common occupations for Nepali Australians'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing occupations before seeding')

    def handle(self, *args, **options):
        if options['clear']:
            Occupation.objects.all().delete()
            self.stdout.write(self.style.WARNING('Cleared all existing occupations.'))

        created = 0
        updated = 0
        for code, title, list_type, eligible_visas, alt_titles, notes in OCCUPATIONS:
            obj, was_created = Occupation.objects.update_or_create(
                anzsco_code=code,
                defaults={
                    'title': title,
                    'list_type': list_type,
                    'eligible_visas': eligible_visas,
                    'alternative_titles': alt_titles,
                    'notes': notes,
                    'last_updated': LAST_UPDATED,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(
            f'Done — {created} created, {updated} updated ({len(OCCUPATIONS)} total occupations).'
        ))
        self.stdout.write(
            'Source: DOHA Skilled Occupation List, August 2025. '
            'Always verify at https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list'
        )
