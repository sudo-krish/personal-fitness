import { createContext, use, useState, useEffect, type ReactNode } from 'react';
import { AppRoute } from './routes';

interface RouterContextType {
  currentRoute: AppRoute;
  navigate: (route: AppRoute) => void;
}

const RouterContext = createContext<RouterContextType>({
  currentRoute: '/',
  navigate: () => {},
});

function normalizeRoute(path: string): AppRoute {
  if (path === '/library' || path.startsWith('/library')) {
    return '/library';
  }
  if (path === '/initiation' || path.startsWith('/initiation')) {
    return '/initiation';
  }
  if (path === '/login' || path.startsWith('/login')) {
    return '/login';
  }
  if (path === '/register' || path.startsWith('/register')) {
    return '/register';
  }
  return '/';
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    return normalizeRoute(window.location.pathname);
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(normalizeRoute(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route: AppRoute) => {
    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route);
      setCurrentRoute(route);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <RouterContext.Provider value={{ currentRoute, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter(): RouterContextType {
  return use(RouterContext);
}
