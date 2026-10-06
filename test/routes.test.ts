import { describe, it, expect } from 'vitest';
import { APP_ROUTES, ROUTE_TITLES } from '../src/router/routes';

describe('router/routes', () => {
  it('exports all valid application routes', () => {
    expect(APP_ROUTES).toContain('/');
    expect(APP_ROUTES).toContain('/train');
    expect(APP_ROUTES).toContain('/library');
    expect(APP_ROUTES).toContain('/settings');
    expect(APP_ROUTES).toContain('/initiation');
    expect(APP_ROUTES).toContain('/login');
    expect(APP_ROUTES).toContain('/register');
    expect(APP_ROUTES.length).toBe(7);
  });

  it('contains titles for every route', () => {
    APP_ROUTES.forEach(route => {
      expect(ROUTE_TITLES[route]).toBeDefined();
      expect(typeof ROUTE_TITLES[route]).toBe('string');
    });
  });
});
