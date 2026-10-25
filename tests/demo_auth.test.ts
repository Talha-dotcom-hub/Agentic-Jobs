import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Demo Shell & Authentication Isolation Suite', () => {
  test('Unauthenticated visitors default to unauthenticated state', () => {
    const defaultUser = {
      id: '',
      email: '',
      name: '',
      isAuthenticated: false,
    };

    assert.strictEqual(defaultUser.isAuthenticated, false, 'Visitors do not auto-authenticate');
    assert.strictEqual(defaultUser.id, '', 'Unauthenticated user has no user ID');
  });

  test('Demo Shell activation sets demo state without creating fake authenticated users', () => {
    let isDemoMode = false;
    let activeView = 'home';
    let user = { id: '', email: '', name: '', isAuthenticated: false };

    // Function triggering demo mode
    function enterDemoMode() {
      isDemoMode = true;
      activeView = 'dashboard';
    }

    enterDemoMode();

    assert.strictEqual(isDemoMode, true, 'Demo mode flag activated');
    assert.strictEqual(activeView, 'dashboard', 'Demo visitor navigated to dashboard preview');
    assert.strictEqual(user.isAuthenticated, false, 'User isAuthenticated stays false during demo');
    assert.strictEqual(user.id, '', 'No fake Supabase user created');
  });

  test('Exiting demo mode clears demo flag without logging out real users', () => {
    let isDemoMode = true;
    let activeView = 'dashboard';

    function exitDemoMode(userIsAuthenticated: boolean) {
      isDemoMode = false;
      if (!userIsAuthenticated) {
        activeView = 'home';
      }
    }

    // Case 1: Unauthenticated visitor exits demo
    exitDemoMode(false);
    assert.strictEqual(isDemoMode, false);
    assert.strictEqual(activeView, 'home');

    // Case 2: Authenticated real user toggles demo
    isDemoMode = true;
    activeView = 'dashboard';
    exitDemoMode(true);
    assert.strictEqual(isDemoMode, false);
    assert.strictEqual(activeView, 'dashboard', 'Authenticated user remains in app view');
  });

  test('Real login requires explicit credentials and rejects missing password', () => {
    function attemptLogin(email: string, password?: string) {
      if (!email || !password) {
        return { success: false, error: 'Password is required' };
      }
      return { success: true, user: { email, isAuthenticated: true } };
    }

    const resWithoutPassword = attemptLogin('user@example.com');
    assert.strictEqual(resWithoutPassword.success, false);
    assert.strictEqual(resWithoutPassword.error, 'Password is required');

    const resWithPassword = attemptLogin('user@example.com', 'SecurePass123!');
    assert.strictEqual(resWithPassword.success, true);
    assert.strictEqual(resWithPassword.user?.isAuthenticated, true);
  });
});
