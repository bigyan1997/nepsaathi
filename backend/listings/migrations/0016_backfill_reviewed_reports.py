from django.db import migrations


def backfill_reviewed_reports(apps, schema_editor):
    """
    Mark all reports as reviewed for listings that are no longer under review.
    Cleans up stale unreviewed reports left by the old admin actions which only
    reviewed the selected report instead of all reports on the listing.
    """
    ListingReport = apps.get_model('listings', 'ListingReport')
    ListingReport.objects.filter(
        is_reviewed=False,
        listing__is_under_review=False,
    ).update(is_reviewed=True)


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0015_listingimage_image_hash'),
    ]

    operations = [
        migrations.RunPython(backfill_reviewed_reports, migrations.RunPython.noop),
    ]
