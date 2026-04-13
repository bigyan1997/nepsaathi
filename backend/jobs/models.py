from django.db import models

# Create your models here.
from django.db import models
from listings.models import Listing


class Job(models.Model):
    """
    Job-specific details for a NepSaathi listing.
    Links back to the base Listing model via OneToOneField.

    Example:
        listing = Listing(type='job', title='Kitchen Hand')
        job = Job(listing=listing, salary=23.50, job_type='casual')
    """

    class JobType(models.TextChoices):
        FULL_TIME = 'full_time', 'Full Time'
        PART_TIME = 'part_time', 'Part Time'
        CASUAL = 'casual', 'Casual'
        CONTRACT = 'contract', 'Contract'
        INTERNSHIP = 'internship', 'Internship'
        VOLUNTEER = 'volunteer', 'Volunteer'

    class SalaryType(models.TextChoices):
        HOURLY = 'hourly', 'Per Hour'
        WEEKLY = 'weekly', 'Per Week'
        MONTHLY = 'monthly', 'Per Month'
        YEARLY = 'yearly', 'Per Year'
        NEGOTIABLE = 'negotiable', 'Negotiable'

    # Link to base listing
    listing = models.OneToOneField(
        Listing,
        on_delete=models.CASCADE,
        related_name='job_detail'
    )

    # Job specific fields
    company_name = models.CharField(max_length=200, blank=True)
    job_type = models.CharField(
        max_length=20,
        choices=JobType.choices,
        default=JobType.CASUAL
    )
    salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Salary amount in AUD'
    )
    salary_type = models.CharField(
        max_length=20,
        choices=SalaryType.choices,
        default=SalaryType.HOURLY
    )
    experience_required = models.CharField(max_length=100, blank=True)
    qualifications = models.TextField(blank=True)
    is_urgent = models.BooleanField(
        default=False,
        help_text='Mark as urgent to highlight the listing'
    )

    class Meta:
        db_table = 'jobs'
        verbose_name = 'Job'
        verbose_name_plural = 'Jobs'

    def __str__(self):
        return f'{self.listing.title} at {self.company_name}'

    @property
    def salary_display(self):
        """Returns formatted salary string e.g. $23.50/hr"""
        if not self.salary:
            return 'Negotiable'
        suffix = {
            'hourly': '/hr',
            'weekly': '/wk',
            'monthly': '/mo',
            'yearly': '/yr',
        }.get(self.salary_type, '')
        return f'${self.salary}{suffix}'