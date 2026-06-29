from django.db import models


class City(models.TextChoices):
    """Ethiopian cities for location selection."""
    ADDIS_ABABA = "addis_ababa", "Addis Ababa"
    ADAMA = "adama", "Adama"
    DIRE_DAWA = "dire_dawa", "Dire Dawa"
    HAWASSA = "hawassa", "Hawassa"
    BAHIR_DAR = "bahir_dar", "Bahir Dar"
    MEKELLE = "mekelle", "Mekelle"
    JIMMA = "jimma", "Jimma"
    DESSIE = "dessie", "Dessie"
    GONDAR = "gondar", "Gondar"
    BISHOFTU = "bishoftu", "Bishoftu"
    HARAR = "harar", "Harar"
    SHASHEMENE = "shashemene", "Shashemene"
    NEKEMTE = "nekemte", "Nekemte"
    DEBRE_BIRHAN = "debre_birhan", "Debre Birhan"
    ASSOSA = "assosa", "Assosa"
    SEMERA = "semera", "Semera"
    JIGJIGA = "jigjiga", "Jigjiga"
    ARBA_MINCH = "arba_minch", "Arba Minch"


class Location(models.Model):
    """Physical site for assets (building, room, datacenter row, etc.)."""

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=64, blank=True, db_index=True)
    building = models.CharField(max_length=255, blank=True)
    floor = models.CharField(max_length=64, blank=True)
    room = models.CharField(max_length=64, blank=True)
    city = models.CharField(
        max_length=32,
        choices=City.choices,
        blank=True,
    )
    address = models.TextField(blank=True)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="children",
        on_delete=models.SET_NULL,
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["code"],
                condition=models.Q(code__gt=""),
                name="uniq_location_code_when_set",
            ),
        ]

    def __str__(self) -> str:
        return self.name if not self.code else f"{self.name} ({self.code})"
