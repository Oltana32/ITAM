import json
import sys
from urllib.request import Request, urlopen

url = 'http://127.0.0.1:8000/api/auth/token/'
data = json.dumps({'email': 'admin@test.com', 'password': 'TestPass123'}).encode('utf-8')
req = Request(url, data=data, headers={'Content-Type': 'application/json'})
res = urlopen(req)
print(res.read().decode('utf-8'))
