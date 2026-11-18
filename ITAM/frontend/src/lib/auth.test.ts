import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authFetch } from './auth';

describe('authFetch', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('refreshes an expired access token and retries the request once', async () => {
    localStorage.setItem('assetBuddy.auth.accessToken', 'expired-access-token');
    localStorage.setItem('assetBuddy.auth.refreshToken', 'valid-refresh-token');
    localStorage.setItem(
      'assetBuddy.auth.user',
      JSON.stringify({
        id: '4',
        email: 'admin@test.com',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
      })
    );

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access: 'new-access-token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    const response = await authFetch('/api/assets/');

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('/api/auth/token/refresh/');
    const retryHeaders = new Headers(fetchMock.mock.calls[2][1]?.headers as HeadersInit);
    expect(retryHeaders.get('Authorization')).toBe('Bearer new-access-token');
  });
});
