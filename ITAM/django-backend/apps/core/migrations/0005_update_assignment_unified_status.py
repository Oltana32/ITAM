# Generated migration - Update Assignment to unified status

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('assignments', '0004_rename_user_to_assigner'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Rename assigned_to to assigned_to_name
        migrations.RenameField(
            model_name='assignment',
            old_name='assigned_to',
            new_name='assigned_to_name',
        ),
        # Change assigned_date from DateField to DateTimeField
        migrations.AlterField(
            model_name='assignment',
            name='assigned_date',
            field=models.DateTimeField(auto_now_add=True),
        ),
        # Rename return_date to actual_return_date
        migrations.RenameField(
            model_name='assignment',
            old_name='return_date',
            new_name='actual_return_date',
        ),
        # Add assigned_to_user ForeignKey for system users
        migrations.AddField(
            model_name='assignment',
            name='assigned_to_user',
            field=models.ForeignKey(blank=True, help_text='System user receiving this asset', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='asset_assignments_received', to=settings.AUTH_USER_MODEL),
        ),
        # Add condition_on_return field
        migrations.AddField(
            model_name='assignment',
            name='condition_on_return',
            field=models.CharField(blank=True, choices=[('excellent', 'Excellent'), ('good', 'Good'), ('fair', 'Fair'), ('poor', 'Poor'), ('damaged', 'Damaged')], help_text='Condition of asset when returned', max_length=32, null=True),
        ),
        # Add audit trail fields
        migrations.AddField(
            model_name='assignment',
            name='created_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assignments_created', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='assignment',
            name='updated_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assignments_updated', to=settings.AUTH_USER_MODEL),
        ),
        # Update status choices to unified statuses
        migrations.AlterField(
            model_name='assignment',
            name='status',
            field=models.CharField(
                choices=[
                    ('ready', 'Ready (not yet assigned)'),
                    ('available', 'Available (not assigned)'),
                    ('assigned', 'Assigned to user'),
                    ('in_use', 'In use by assignee'),
                    ('maintenance', 'Under maintenance'),
                    ('overdue', 'Return overdue'),
                    ('returned', 'Returned (processing)'),
                    ('found', 'Found (was lost, now recovered)'),
                    ('retired', 'Retired from service'),
                    ('disposed', 'Disposed'),
                    ('lost', 'Lost/Missing'),
                    ('damaged', 'Damaged (non-repairable)'),
                ],
                db_index=True,
                default='assigned',
                help_text='Current status of this assignment',
                max_length=32
            ),
        ),
        # Add index for asset + status  
        migrations.AddIndex(
            model_name='assignment',
            index=models.Index(fields=['asset', 'status'], name='assignments_asset_status_idx'),
        ),
        # Add unique constraint for only one active assignment per asset
        migrations.AddConstraint(
            model_name='assignment',
            constraint=models.UniqueConstraint(
                condition=models.Q(('status__in', ['assigned', 'in_use'])),
                fields=['asset'],
                name='only_one_active_assignment_per_asset'
            ),
        ),
    ]