export type AppRoute =
  '/' | '/train' | '/library' | '/settings' | '/initiation' | '/login' | '/register';

export const APP_ROUTES: AppRoute[] = [
  '/',
  '/train',
  '/library',
  '/settings',
  '/initiation',
  '/login',
  '/register',
];

export const ROUTE_TITLES: Record<AppRoute, string> = {
  '/': 'Today',
  '/train': 'Train',
  '/library': 'Library',
  '/settings': 'Settings',
  '/initiation': 'Set up your duo',
  '/login': 'Sign in',
  '/register': 'Create a duo',
};
