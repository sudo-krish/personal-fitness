import { useState } from 'react';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useExerciseCatalog } from '../hooks/useExerciseCatalog';
import { ExerciseSearchBar } from '../features/library/ExerciseSearchBar';
import { ExerciseFilterBar } from '../features/library/ExerciseFilterBar';
import { ExerciseCard } from '../features/library/ExerciseCard';
import { VideoModal } from '../features/library/VideoModal';
import { Button } from '../components/ui/Button';
import { Exercise } from '../types/workout';
import { ArrowLeft, Sun, Moon, Sparkles, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface ExerciseLibraryPageProps {
  onOpenVideo?: (url: string, title: string) => void;
}

export function ExerciseLibraryPage({ onOpenVideo: onGlobalOpenVideo }: ExerciseLibraryPageProps) {
  const { navigate } = useRouter();
  const { user, partner } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const isUserPrimary = user?.isPrimary ?? true;
  const partner1 = isUserPrimary ? user : partner;
  const partner2 = isUserPrimary ? partner : user;
  const p1Name = partner1?.name || 'Partner 1';
  const p2Name = partner2?.name || 'Partner 2';

  const {
    search,
    setSearch,
    selectedMuscle,
    setSelectedMuscle,
    selectedEquipment,
    setSelectedEquipment,
    selectedProfileTab,
    setSelectedProfileTab,
    videoFilter,
    setVideoFilter,
    page,
    setPage,
    totalPages,
    totalCount,
    exercises,
    isLoading,
    resolvingVideoId,
    actionNotice,
    assignProfile,
    resolveVideo,
    updateVideoUrl,
  } = useExerciseCatalog(36);

  // Active Video Modal
  const [activeVideoEx, setActiveVideoEx] = useState<Exercise | null>(null);

  const handleOpenVideo = (url: string, title: string, exercise?: Exercise) => {
    if (onGlobalOpenVideo) {
      onGlobalOpenVideo(url, title);
    } else if (exercise) {
      setActiveVideoEx(exercise);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 pb-32 flex flex-col gap-6">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-slate-800/95 border border-sky-500/40 text-sky-200 px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/')}
            leftIcon={<ArrowLeft size={16} />}
          >
            Workout
          </Button>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Exercise Library
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Browse, filter, and assign exercises to duo partners.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <ExerciseSearchBar
        value={search}
        onChange={setSearch}
        totalCount={totalCount}
      />

      {/* Filter Bar */}
      <ExerciseFilterBar
        p1Name={p1Name}
        p2Name={p2Name}
        selectedProfileTab={selectedProfileTab}
        onProfileTabChange={setSelectedProfileTab}
        selectedMuscle={selectedMuscle}
        onMuscleChange={setSelectedMuscle}
        selectedEquipment={selectedEquipment}
        onEquipmentChange={setSelectedEquipment}
        videoFilter={videoFilter}
        onVideoFilterChange={setVideoFilter}
      />

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 text-slate-400">
          <Loader2 size={32} className="animate-spin text-sky-500 mb-3" />
          <span className="text-sm font-medium">Loading exercises...</span>
        </div>
      ) : exercises.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-slate-100/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">
            No exercises match your criteria
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search query, muscle category, or equipment filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              p1Name={p1Name}
              p2Name={p2Name}
              isResolvingVideo={resolvingVideoId === ex.id}
              onAssignProfile={(profileId) =>
                assignProfile(
                  ex.id,
                  profileId,
                  profileId === 'person_1' ? p1Name : profileId === 'person_2' ? p2Name : undefined
                )
              }
              onOpenVideo={(url, title) => handleOpenVideo(url, title, ex)}
              onResolveVideo={() => resolveVideo(ex)}
              onEditManualUrl={() => setActiveVideoEx(ex)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            leftIcon={<ChevronLeft size={16} />}
          >
            Prev
          </Button>

          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">
            Page {page + 1} of {totalPages}
          </span>

          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
            rightIcon={<ChevronRight size={16} />}
          >
            Next
          </Button>
        </div>
      )}

      {/* Video Modal */}
      {activeVideoEx && (
        <VideoModal
          isOpen={Boolean(activeVideoEx)}
          onClose={() => setActiveVideoEx(null)}
          title={activeVideoEx.name}
          videoUrl={activeVideoEx.videoUrl}
          onSaveManualUrl={async (newUrl) => {
            await updateVideoUrl(activeVideoEx.id, newUrl);
            setActiveVideoEx((prev) => (prev ? { ...prev, videoUrl: newUrl } : null));
          }}
        />
      )}
    </div>
  );
}
