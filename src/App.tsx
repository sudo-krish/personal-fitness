import { useState } from 'react';
import { RouterProvider, useRouter } from './router/Router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { TrainPage } from './pages/TrainPage';
import { ExerciseLibraryPage } from './pages/ExerciseLibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { InitiationPage } from './pages/InitiationPage';
import { BottomDock } from './components/shell/BottomDock';
import { VideoDrawer } from './components/mobile/VideoDrawer';

function AppContent() {
  const { currentRoute, navigate } = useRouter();
  const { user, partner, isAuthenticated, isLoading } = useAuth();

  const [videoDrawerOpen, setVideoDrawerOpen] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string }>({
    url: '',
    title: '',
  });

  const handleOpenVideo = (url: string, title: string) => {
    setSelectedVideo({ url, title });
    setVideoDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-canvas text-ink">
        <div className="size-10 rounded-full border-2 border-sage-500 border-t-transparent animate-spin mb-3" />
        <span className="text-xs font-semibold tracking-wider uppercase text-ink-muted">
          Loading Duo Fitness...
        </span>
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
    <div className="min-h-screen w-full bg-canvas text-ink transition-colors relative">
      <main className="w-full">
        {currentRoute === '/train' ? (
          <TrainPage onOpenVideo={handleOpenVideo} />
        ) : currentRoute === '/library' ? (
          <ExerciseLibraryPage onOpenVideo={handleOpenVideo} />
        ) : currentRoute === '/settings' ? (
          <SettingsPage />
        ) : currentRoute === '/initiation' ? (
          <InitiationPage
            initialProfiles={user && partner ? [user, partner] : undefined}
            onComplete={() => navigate('/')}
            onNavigate={navigate}
          />
        ) : (
          <HomePage onOpenVideo={handleOpenVideo} />
        )}
      </main>

      {/* Primary 4-item frosted bottom dock */}
      <BottomDock
        activeRoute={currentRoute}
        onNavigate={navigate}
        trainInProgress={true}
      />

      {/* Video Demonstration Sheet */}
      <VideoDrawer
        isOpen={videoDrawerOpen}
        onOpenChange={setVideoDrawerOpen}
        videoUrl={selectedVideo.url}
        exerciseName={selectedVideo.title}
      />
    </div>
  );
}

export function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </RouterProvider>
  );
}

export default App;
