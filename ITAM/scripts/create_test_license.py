import json
import urllib.request

body = {
    "software_name": "Playwright Test License",
    "vendor": "microsoft",
    "seats": 5,
    "notes": "test",
    "annual_cost": 1234.56,
    "cost_currency": "USD",
}

data = json.dumps(body).encode('utf-8')
req = urllib.request.Request('http://localhost:8000/api/licenses/', data=data, headers={
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzg3MTMxMDU4LCJpYXQiOjE3ODcxMjc0NTgsImp0aSI6IjZmMmY5MWJlMzRhMjQ3ZmE4YjNlZTI3ZDVjNTAxNjI1IiwidXNlcl9pZCI6IjMifQ.ph7xSMVX-EcauCSaqYGG55pGRtcGxlvk8z5aV88r_3w'
})

try:
    with urllib.request.urlopen(req) as resp:
        print('STATUS', resp.status)
        print(resp.read().decode())
except urllib.error.HTTPError as e:
    print('HTTPError', e.code)
    print(e.read().decode())
except Exception as e:
    import traceback
    traceback.print_exc()
