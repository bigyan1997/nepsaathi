from django.apps import AppConfig


class ListingsConfig(AppConfig):
    name = 'listings'

    def ready(self):
        import listings.signals  # noqa: F401
