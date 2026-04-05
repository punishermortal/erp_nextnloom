# Generated migration for phone number authentication

from django.db import migrations, models
import django.utils.timezone


def set_phone_numbers(apps, schema_editor):
    """Set phone numbers for existing users"""
    User = apps.get_model('accounts', 'User')
    for user in User.objects.filter(phone_number__isnull=True):
        # Generate a temporary phone number for existing users
        user.phone_number = f"+91{user.id}0000000"[:15]
        user.save()


def reverse_set_phone_numbers(apps, schema_editor):
    """Reverse migration - set phone numbers to null"""
    User = apps.get_model('accounts', 'User')
    User.objects.all().update(phone_number=None)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        # Add is_phone_verified field
        migrations.AddField(
            model_name='user',
            name='is_phone_verified',
            field=models.BooleanField(default=False),
        ),
        # Make email optional
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(blank=True, max_length=254, null=True, unique=True),
        ),
        # Set phone numbers for existing users
        migrations.RunPython(set_phone_numbers, reverse_set_phone_numbers),
        # Make phone_number unique but keep it nullable for now
        migrations.AlterField(
            model_name='user',
            name='phone_number',
            field=models.CharField(blank=True, max_length=15, null=True, unique=True),
        ),
        # Create PasswordResetOTP model
        migrations.CreateModel(
            name='PasswordResetOTP',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('phone_number', models.CharField(max_length=15)),
                ('otp', models.CharField(max_length=6)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('is_used', models.BooleanField(default=False)),
                ('expires_at', models.DateTimeField()),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='passwordresetotp',
            index=models.Index(fields=['phone_number', 'otp'], name='accounts_pa_phone_n_123456_idx'),
        ),
    ]

