"""Generated migration with data-migration to convert department strings to core.Department rows.
"""
from django.conf import settings
from django.db import migrations, models


def _migrate_departments(apps, schema_editor):
    AuditSession = apps.get_model('audits', 'AuditSession')
    Department = apps.get_model('core', 'Department')
    db_alias = schema_editor.connection.alias
    for session in AuditSession.objects.using(db_alias).all():
        old = getattr(session, 'department', None)
        if old in (None, ''):
            # map empty/missing department strings to an UNKNOWN department record
            unk, _ = Department.objects.using(db_alias).get_or_create(code='UNKNOWN', defaults={'name': 'Unknown'})
            setattr(session, 'department', unk.pk)
            session.save(update_fields=['department'])
            continue
        dept, created = Department.objects.using(db_alias).get_or_create(code=str(old), defaults={'name': str(old)})
        setattr(session, 'department', dept.pk)
        session.save(update_fields=['department'])


class Migration(migrations.Migration):

    dependencies = [
        ('audits', '0010_auditsession_department'),
        ('core', '0007_department_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='auditfinding',
            name='verification',
            field=models.JSONField(blank=True, default=dict, help_text='Verification checklist (tag_match, serial_match, assigned_user_correct, location_correct)'),
        ),
        migrations.AddField(
            model_name='auditsession',
            name='audit_id',
            field=models.CharField(blank=True, db_index=True, editable=False, max_length=32, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='auditsession',
            name='audit_type',
            field=models.CharField(choices=[('full', 'Full Inventory'), ('department', 'Department'), ('location', 'Location'), ('selected', 'Selected Assets')], default='full', help_text='Type of audit', max_length=32),
        ),
        migrations.AddField(
            model_name='auditsession',
            name='lead_auditor',
            field=models.ForeignKey(blank=True, help_text='Primary auditor/owner of this session', null=True, on_delete=models.deletion.SET_NULL, related_name='lead_audits', to=settings.AUTH_USER_MODEL),
        ),
        migrations.RunPython(
            code=_migrate_departments,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name='auditfinding',
            name='current_condition',
            field=models.CharField(blank=True, choices=[('excellent', 'Excellent'), ('excellent', 'Excellent'), ('good', 'Good'), ('fair', 'Fair'), ('poor', 'Poor'), ('damaged', 'Damaged'), ('missing_parts', 'Missing Parts'), ('not_functional', 'Not Functional')], help_text='Condition observed during audit', max_length=20),
        ),
        migrations.AlterField(
            model_name='auditsession',
            name='department',
            field=models.ForeignKey(blank=True, help_text='Limit audit to a specific department (optional)', null=True, on_delete=models.deletion.SET_NULL, to='core.department'),
        ),
    ]
