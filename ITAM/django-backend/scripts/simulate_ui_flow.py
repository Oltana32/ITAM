import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE = 'http://127.0.0.1:8000'

def post(path, data, token=None):
    url = BASE + path
    body = json.dumps(data).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = Request(url, data=body, headers=headers)
    try:
        res = urlopen(req)
        return json.loads(res.read().decode('utf-8'))
    except HTTPError as e:
        body = e.read().decode('utf-8')
        print('HTTPError', e.code, body)
        raise

def get_token():
    res = post('/api/auth/token/', {'email': 'admin@test.com', 'password': 'TestPass123'})
    return res['access']

def main():
    token = get_token()
    print('Got token')

    # Create audit session
    sess = post('/api/audit-sessions/', {
        'title': 'UI Flow Test Audit',
        'planned_date': '2026-08-14',
        'status': 'planned'
    }, token=token)
    print('Created session:', sess['id'], sess.get('audit_id'))

    sid = sess['id']
    # Start session
    started = post(f'/api/audit-sessions/{sid}/start/', {}, token=token)
    print('Started session, status:', started['status'])

    # Perform scan for TEST-001
    scan_payload = {
        'asset_tag': 'TEST-001',
        'tag_match': True,
        'serial_match': True,
        'assigned_user_correct': False,
        'location_correct': True,
        'current_condition': 'good',
        'notes': 'Simulated via UI flow script'
    }
    finding = post(f'/api/audit-sessions/{sid}/scan/', scan_payload, token=token)
    print('Scan created finding id:', finding.get('id'))

if __name__ == '__main__':
    main()
