import { useState, useEffect } from 'react';
import { Exercise } from '../types/workout';
import { PlanService } from '../services/planService';

export function useExerciseCatalog(pageSize: number = 36) {
  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('All');
  const [selectedProfileTab, setSelectedProfileTab] = useState<'all' | 'null' | 'person_1' | 'person_2'>('all');
  const [videoFilter, setVideoFilter] = useState<'all' | 'has' | 'missing'>('all');

  // Data & Pagination
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);

  // Notice & Active Resolution State
  const [resolvingVideoId, setResolvingVideoId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => {
      setActionNotice((current) => (current === msg ? null : current));
    }, 3200);
  };

  // Load exercises when query parameters change
  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);

    PlanService.getLibraryExercises({
      profileId: selectedProfileTab === 'all' ? undefined : selectedProfileTab,
      search: search.trim() || undefined,
      muscle: selectedMuscle !== 'All' ? selectedMuscle : undefined,
      equipment: selectedEquipment !== 'All' ? selectedEquipment : undefined,
      hasVideo: videoFilter === 'has' ? 'true' : videoFilter === 'missing' ? 'false' : undefined,
      limit: pageSize,
      offset: page * pageSize,
    })
      .then(({ exercises: fetchedList, total }) => {
        if (isCurrent) {
          setExercises(fetchedList);
          setTotalCount(total);
        }
      })
      .catch((err) => {
        console.error('Failed to load exercises:', err);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [search, selectedMuscle, selectedEquipment, selectedProfileTab, videoFilter, page, pageSize]);

  // Profile assignment handler
  const assignProfile = async (
    exerciseId: string,
    newProfileId: 'person_1' | 'person_2' | null,
    partnerName?: string
  ) => {
    setExercises((prev) =>
      prev.map((e) => (e.id === exerciseId ? { ...e, profileId: newProfileId } : e))
    );

    const targetLabel = partnerName || (newProfileId ? 'Partner' : 'Unassigned');
    showNotice(`✓ Updated assignment to ${targetLabel}`);

    await PlanService.updateExerciseProfile(exerciseId, newProfileId);
  };

  // Video resolution handler
  const resolveVideo = async (exercise: Exercise): Promise<string | null> => {
    setResolvingVideoId(exercise.id);
    showNotice(`Searching YouTube technique guide for "${exercise.name}"...`);

    const videoUrl = await PlanService.resolveYouTubeVideo(exercise.id, exercise.name);

    if (videoUrl) {
      setExercises((prev) =>
        prev.map((e) => (e.id === exercise.id ? { ...e, videoUrl } : e))
      );
      showNotice(`✓ Found video for "${exercise.name}"!`);
    } else {
      showNotice(`Could not auto-find video. You can link one manually.`);
    }

    setResolvingVideoId(null);
    return videoUrl;
  };

  // Manual video update handler
  const updateVideoUrl = async (exerciseId: string, url: string): Promise<boolean> => {
    const success = await PlanService.updateExerciseVideo(exerciseId, url.trim());
    if (success) {
      setExercises((prev) =>
        prev.map((e) => (e.id === exerciseId ? { ...e, videoUrl: url.trim() } : e))
      );
      showNotice('✓ Video link updated');
    }
    return success;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    search,
    setSearch: (val: string) => {
      setSearch(val);
      setPage(0);
    },
    selectedMuscle,
    setSelectedMuscle: (val: string) => {
      setSelectedMuscle(val);
      setPage(0);
    },
    selectedEquipment,
    setSelectedEquipment: (val: string) => {
      setSelectedEquipment(val);
      setPage(0);
    },
    selectedProfileTab,
    setSelectedProfileTab: (val: 'all' | 'null' | 'person_1' | 'person_2') => {
      setSelectedProfileTab(val);
      setPage(0);
    },
    videoFilter,
    setVideoFilter: (val: 'all' | 'has' | 'missing') => {
      setVideoFilter(val);
      setPage(0);
    },
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
  };
}
