export type AppRoute = '/' | '/library' | '/initiation' | '/login' | '/register';

export interface RouteItem {
  path: AppRoute;
  title: string;
}

export const ROUTES: Record<string, RouteItem> = {
  HOME: { path: '/', title: 'Workout Tracker' },
  LIBRARY: { path: '/library', title: 'Exercise Library' },
  INITIATION: { path: '/initiation', title: 'Duo Partner Setup' },
  LOGIN: { path: '/login', title: 'Sign In' },
  REGISTER: { path: '/register', title: 'Register Duo' },
};
