import { createContext, use, useState, useEffect, type ReactNode } from 'react';
import { APP_ROUTES, ROUTE_TITLES, type AppRoute } from './routes';

interface RouterContextType {
  currentRoute: AppRoute;
  navigate: (route: AppRoute) => void;
}

const RouterContext = createContext<RouterContextType>({
  currentRoute: '/',
  navigate: () => {},
});

function normalizeRoute(path: string): AppRoute {
  const match = APP_ROUTES.find((r) => r !== '/' && (path === r || path.startsWith(`${r}/`)));
  return match ?? '/';
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

  useEffect(() => {
    document.title = `${ROUTE_TITLES[currentRoute]} · Duo Fitness`;
  }, [currentRoute]);

  const navigate = (route: AppRoute) => {
    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route);
      setCurrentRoute(route);
      window.scrollTo({ top: 0 });
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
