import { useState } from 'react';
import { RouterProvider, useRouter } from './router/Router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { HomePage } from './pages/HomePage';
import { ExerciseLibraryPage } from './pages/ExerciseLibraryPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { InitiationPage } from './pages/InitiationPage';
import { SidebarNavigation } from './components/mobile/SidebarNavigation';
import { VideoDrawer } from './components/mobile/VideoDrawer';
import { PlanService } from './services/planService';

function AppContent() {
  const { currentRoute, navigate } = useRouter();
  const { user, partner, isAuthenticated, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const [videoDrawerOpen, setVideoDrawerOpen] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string }>({
    url: '',
    title: '',
  });

  const handleOpenVideo = (url: string, title: string) => {
    setSelectedVideo({ url, title });
    setVideoDrawerOpen(true);
  };



  const handleSeedPlan = async () => {
    if (
      window.confirm(
        '⚠️ Warning: This will wipe all current set logs, reset streaks, and reload the curated 5-Day Duo Plan. Are you sure you want to proceed?'
      )
    ) {
      await PlanService.seedPreWorkoutPlan(true);
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-white">
        <div className="text-4xl mb-4 animate-pulse">⚡✨</div>
        <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Loading Duo Fitness...
        </div>
      </div>
    );
  }

  // Unauthenticated routes
  if (!isAuthenticated) {
    if (currentRoute === '/register') {
      return <RegisterPage onNavigate={navigate} />;
    }
    if (currentRoute === '/initiation') {
      return (
        <InitiationPage
          onComplete={() => navigate('/')}
          onNavigate={navigate}
        />
      );
    }
    return <LoginPage onNavigate={navigate} />;
  }

  // Authenticated routes
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-white transition-colors">
      {currentRoute === '/library' ? (
        <ExerciseLibraryPage onOpenVideo={handleOpenVideo} />
      ) : currentRoute === '/initiation' ? (
        <InitiationPage
          initialProfiles={user && partner ? [user, partner] : undefined}
          onComplete={() => navigate('/')}
          onNavigate={navigate}
        />
      ) : (
        <HomePage
          onOpenVideo={handleOpenVideo}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          isSidebarOpen={isSidebarOpen}
          onCloseSidebar={() => setIsSidebarOpen(false)}
        />
      )}

      <VideoDrawer
        isOpen={videoDrawerOpen}
        onOpenChange={setVideoDrawerOpen}
        videoUrl={selectedVideo.url}
        exerciseName={selectedVideo.title}
      />

      <SidebarNavigation
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePath={currentRoute}
        onNavigate={(path) => navigate(path)}
        profiles={user && partner ? [user, partner] : undefined}
        onSeedPlan={handleSeedPlan}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <RouterProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </RouterProvider>
    </ThemeProvider>
  );
}

export default App;
