/**
 * AuthContext — explicit-logout guard integration tests
 *
 * Verifies that a user who clicked "Logout" is NOT silently re-authenticated
 * on subsequent page loads, even when a valid refreshToken HttpOnly cookie is
 * still present in the browser (e.g. because the backend was unreachable
 * during logout, or because the 7-day cookie TTL outlived the logout event).
 *
 * Strategy
 * --------
 * - Mock axios (API) so we can spy on HTTP calls without a real server.
 * - Seed localStorage with explicit_logout=1 to simulate post-logout state.
 * - Render <AuthProvider> and assert that silentRefresh() (POST /api/auth/refresh)
 *   is never called.
 * - Separately verify that login() clears the flag so future silent-refreshes
 *   resume normally.
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('../services/api', () => {
  const postMock = jest.fn();
  const API = { post: postMock, defaults: { headers: { common: {} } } };
  return {
    __esModule: true,
    default: API,
    logout: jest.fn().mockResolvedValue({}),
  };
});

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(() => ({
    sub: 'testuser',
    exp: Math.floor(Date.now() / 1000) + 3600,
    role: 'OWNER',
    shopId: 1,
  })),
}));

jest.mock('../utils/authStorage', () => ({
  getValidToken: jest.fn(),
  clearAuthStorage: jest.fn(),
}));

jest.mock('../hooks/usePermissions', () => ({
  clearPermissionsCache: jest.fn(),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { AuthProvider, useAuthContext } from './AuthContext';
import API from '../services/api';
import { logout as apiLogout } from '../services/api';
import { getValidToken } from '../utils/authStorage';

// ── Helpers ───────────────────────────────────────────────────────────────────

function TestConsumer() {
  const { user, loading } = useAuthContext();
  if (loading) return <div>loading</div>;
  return <div data-testid="user">{user ? user.sub : 'no-user'}</div>;
}

function ContextCapture({ onContext }) {
  const ctx = useAuthContext();
  onContext(ctx);
  return null;
}

function renderWithCapture() {
  let ctx = null;
  render(
    <MemoryRouter>
      <AuthProvider>
        <TestConsumer />
        <ContextCapture onContext={(c) => { ctx = c; }} />
      </AuthProvider>
    </MemoryRouter>
  );
  return () => ctx;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthContext — explicit-logout guard', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    getValidToken.mockReturnValue(null);
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ── 1. Guard prevents silentRefresh ──────────────────────────────────────

  test('silentRefresh() is NOT called when explicit_logout flag is set', async () => {
    localStorage.setItem('explicit_logout', '1');

    await act(async () => {
      renderWithCapture();
    });

    expect(API.post).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/refresh'),
      expect.anything()
    );
  });

  test('user remains null after init() when explicit_logout flag is set', async () => {
    localStorage.setItem('explicit_logout', '1');

    await act(async () => {
      renderWithCapture();
    });

    await waitFor(() =>
      expect(screen.queryByText('loading')).not.toBeInTheDocument()
    );

    expect(screen.getByTestId('user').textContent).toBe('no-user');
  });

  // ── 2. Flag persistence: init() must NOT remove it ────────────────────────

  test('explicit_logout flag persists after init() — not cleared by init()', async () => {
    localStorage.setItem('explicit_logout', '1');

    await act(async () => {
      renderWithCapture();
    });

    await waitFor(() =>
      expect(screen.queryByText('loading')).not.toBeInTheDocument()
    );

    expect(localStorage.getItem('explicit_logout')).toBe('1');
  });

  // ── 3. Guard set BEFORE apiLogout() is called ────────────────────────────

  test('logout() sets explicit_logout before calling apiLogout()', async () => {
    let flagAtLogoutTime = null;
    apiLogout.mockImplementation(() => {
      flagAtLogoutTime = localStorage.getItem('explicit_logout');
      return Promise.resolve({});
    });

    getValidToken.mockReturnValue('valid.jwt.token');

    const getCtx = renderWithCapture();

    await waitFor(() =>
      expect(screen.queryByText('loading')).not.toBeInTheDocument()
    );

    await act(async () => {
      await getCtx().logout('Logging out');
    });

    expect(flagAtLogoutTime).toBe('1');
  });

  // ── 4. login() clears the guard ──────────────────────────────────────────

  test('login() removes explicit_logout flag so future silentRefresh works', async () => {
    localStorage.setItem('explicit_logout', '1');

    const getCtx = renderWithCapture();

    await waitFor(() =>
      expect(screen.queryByText('loading')).not.toBeInTheDocument()
    );

    await act(async () => {
      getCtx().login('fresh.jwt.token');
    });

    expect(localStorage.getItem('explicit_logout')).toBeNull();
  });

  // ── 5. Happy path: silentRefresh DOES run when no flag ───────────────────

  test('silentRefresh() IS called when explicit_logout is NOT set', async () => {
    API.post.mockResolvedValue({ data: { accessToken: null } });

    await act(async () => {
      renderWithCapture();
    });

    await waitFor(() =>
      expect(screen.queryByText('loading')).not.toBeInTheDocument()
    );

    expect(API.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/refresh'),
      expect.anything()
    );
  });

  // ── 6. Broadcast logout does NOT set the flag ────────────────────────────

  test('explicit_logout flag is NOT set for broadcast-triggered logout', async () => {
    getValidToken.mockReturnValue('valid.jwt.token');

    const getCtx = renderWithCapture();

    await waitFor(() =>
      expect(screen.queryByText('loading')).not.toBeInTheDocument()
    );

    await act(async () => {
      await getCtx().logout(null, false, { fromBroadcast: true });
    });

    // fromBroadcast=true means the other tab already owns the explicit intent;
    // this tab just mirrors the auth state without recording its own flag.
    expect(localStorage.getItem('explicit_logout')).toBeNull();
  });
});
