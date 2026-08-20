from django.db import migrations, models


def generate_audit_ids(apps, schema_editor):
    AuditSession = apps.get_model('audits', 'AuditSession')
    db_alias = schema_editor.connection.alias
    sessions = AuditSession.objects.using(db_alias).all().order_by('created_at', 'id')
    seq_by_year = {}
    for s in sessions:
        if s.audit_id:
            continue
        year = (s.created_at.year if s.created_at else None) or s.planned_date.year
        seq = seq_by_year.get(year, 0) + 1
        seq_by_year[year] = seq
        s.audit_id = f"AUD-{year}-{seq:04d}"
        s.save(update_fields=['audit_id'])


class Migration(migrations.Migration):

    dependencies = [
        ('audits', '0011_auditfinding_verification_auditsession_audit_id_and_more'),
    ]

    operations = [
        migrations.RunPython(code=generate_audit_ids, reverse_code=migrations.RunPython.noop),
        migrations.AlterField(
            model_name='auditsession',
            name='audit_id',
            field=models.CharField(max_length=32, unique=True, db_index=True, editable=False, null=False),
        ),
    ]
