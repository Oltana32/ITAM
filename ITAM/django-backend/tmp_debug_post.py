from django.test import Client
from django.contrib.auth import get_user_model
from apps.manufacturers.models import Manufacturer
from apps.locations.models import Location
import openpyxl, io

User = get_user_model()
user = User.objects.create_user(email='debug@bulk.com', password='pass123', role='admin')
manufacturer, _ = Manufacturer.objects.get_or_create(name='MfgCo')
location = Location.objects.create(name='Main Office')

wb = openpyxl.Workbook()
ws = wb.active
headers = ['Name','Category','Manufacturer','Location','Serial Number','Condition','Model','Purchase Date','Purchase Cost','Warranty Expiry','Department','Notes']
ws.append(headers)
ws.append(['Laptop A','laptop','MfgCo','Main Office','SN-001','good','X','2026-01-01',1000,'2028-01-01','IT','notes'])
wbio = io.BytesIO(); wb.save(wbio); wbio.seek(0)

c = Client()
# log in
c.force_login(user)
resp = c.post('/api/assets/bulk-import/', {'file': ('import.xlsx', wbio, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')})
print('STATUS', resp.status_code)
print(resp.content)
