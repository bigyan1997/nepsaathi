from rest_framework import serializers
from .models import Job


class JobSerializer(serializers.ModelSerializer):
    """
    Serializer for job-specific listing details.
    salary_display is a read-only formatted string e.g. $23.50/hr
    """
    salary_display = serializers.ReadOnlyField()

    class Meta:
        model = Job
        fields = (
            'id',
            'company_name',
            'job_type',
            'salary',
            'salary_type',
            'salary_display',
            'experience_required',
            'qualifications',
            'is_urgent',
        )
        read_only_fields = ('id', 'salary_display')