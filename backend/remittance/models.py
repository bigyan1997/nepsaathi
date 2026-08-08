from django.db import models


class RemittanceRate(models.Model):
    PROVIDER_CHOICES = [
        ('wise',       'Wise'),
        ('remitly',    'Remitly'),
        ('worldremit', 'WorldRemit'),
        ('wu',         'Western Union'),
    ]

    provider   = models.CharField(max_length=20, choices=PROVIDER_CHOICES, unique=True)
    rate       = models.DecimalField(max_digits=10, decimal_places=4)   # 1 AUD → X NPR
    fee_aud    = models.DecimalField(max_digits=8,  decimal_places=2, default=0)
    send_url   = models.URLField()
    fetched_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_provider_display()}: {self.rate} NPR/AUD"
