/**
 * Persisted state using React Query for local storage synchronization
 * Provides offline-first patterns and sync capabilities
 */

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface PersistedData<T> {
  data: T;
  timestamp: number;
  version: number;
}

// Generic hook for persisted state with React Query
export function usePersistedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    defaultValue: T;
    maxAge?: number; // Max age in milliseconds
    syncInterval?: number; // Background sync interval
    version?: number; // Data version for cache invalidation
  }
) {
  const {
    defaultValue,
    maxAge = 24 * 60 * 60 * 1000,
    syncInterval,
    version = 1,
  } = options;
  const queryClient = useQueryClient();

  // Get data from localStorage
  const getPersistedData = (): T => {
    try {
      const stored = localStorage.getItem(`persisted-${key}`);
      if (stored) {
        const parsed: PersistedData<T> = JSON.parse(stored);

        // Check version compatibility
        if (parsed.version !== version) {
          localStorage.removeItem(`persisted-${key}`);
          return defaultValue;
        }

        // Check if data is still fresh
        if (maxAge && Date.now() - parsed.timestamp > maxAge) {
          localStorage.removeItem(`persisted-${key}`);
          return defaultValue;
        }

        return parsed.data;
      }
    } catch (error) {
      console.error(`Failed to parse persisted data for ${key}:`, error);
      localStorage.removeItem(`persisted-${key}`);
    }
    return defaultValue;
  };

  // Save data to localStorage
  const setPersistedData = (data: T) => {
    try {
      const persistedData: PersistedData<T> = {
        data,
        timestamp: Date.now(),
        version,
      };
      localStorage.setItem(`persisted-${key}`, JSON.stringify(persistedData));
    } catch (error) {
      console.error(`Failed to persist data for ${key}:`, error);
    }
  };

  // Main query with local storage as initial data
  const query = useQuery({
    queryKey: [key],
    queryFn: fetcher,
    initialData: getPersistedData,
    staleTime: maxAge / 2, // Consider stale at half the max age
    gcTime: maxAge,
    refetchInterval: syncInterval,
    onSuccess: (data) => {
      setPersistedData(data);
    },
  });

  // Mutation to update local data
  const updateMutation = useMutation({
    mutationFn: async (newData: T) => newData,
    onSuccess: (data) => {
      queryClient.setQueryData([key], data);
      setPersistedData(data);
    },
  });

  return {
    data: query.data || defaultValue,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}

// User preferences with local storage
export function useUserPreferences() {
  interface UserPreferences {
    theme: "light" | "dark" | "system";
    emailNotifications: boolean;
    autoSave: boolean;
    defaultCheckInDays: number;
    language: string;
    dashboardLayout: "grid" | "list";
  }

  const defaultPreferences: UserPreferences = {
    theme: "system",
    emailNotifications: true,
    autoSave: true,
    defaultCheckInDays: 30,
    language: "en",
    dashboardLayout: "grid",
  };

  return usePersistedQuery(
    "user-preferences",
    async () => {
      // Could sync with server in the future
      return defaultPreferences;
    },
    {
      defaultValue: defaultPreferences,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      version: 1,
    }
  );
}

// Draft email storage
export function useDraftEmail() {
  interface DraftEmail {
    title: string;
    subject: string;
    content: string;
    recipients: Array<{ email: string; name?: string }>;
    scheduledFor?: Date;
    intervalDays?: number;
    lastSaved: Date;
  }

  const defaultDraft: DraftEmail = {
    title: "",
    subject: "",
    content: "",
    recipients: [{ email: "", name: "" }],
    lastSaved: new Date(),
  };

  return usePersistedQuery("draft-email", async () => defaultDraft, {
    defaultValue: defaultDraft,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    version: 1,
  });
}

// Recent activity tracking
export function useRecentActivity() {
  interface ActivityItem {
    id: string;
    type: "email_created" | "email_updated" | "email_sent" | "check_in";
    title: string;
    timestamp: Date;
    details?: any;
  }

  const defaultActivity: ActivityItem[] = [];

  const activity = usePersistedQuery(
    "recent-activity",
    async () => defaultActivity,
    {
      defaultValue: defaultActivity,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      version: 1,
    }
  );

  // Add activity helper
  const addActivity = (item: Omit<ActivityItem, "timestamp">) => {
    const currentActivity = activity.data || [];
    const newActivity = [
      { ...item, timestamp: new Date() },
      ...currentActivity.slice(0, 49), // Keep only latest 50 items
    ];
    activity.update(newActivity);
  };

  return {
    ...activity,
    addActivity,
  };
}

// Offline queue for mutations
export function useOfflineQueue() {
  interface QueuedMutation {
    id: string;
    type: string;
    data: any;
    timestamp: Date;
    retryCount: number;
  }

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const queue = usePersistedQuery(
    "offline-queue",
    async () => [] as QueuedMutation[],
    {
      defaultValue: [] as QueuedMutation[],
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      version: 1,
    }
  );

  // Add to queue when offline
  const queueMutation = (type: string, data: any) => {
    const currentQueue = queue.data || [];
    const newMutation: QueuedMutation = {
      id: `${type}-${Date.now()}`,
      type,
      data,
      timestamp: new Date(),
      retryCount: 0,
    };
    queue.update([...currentQueue, newMutation]);
  };

  // Process queue when online
  const processQueue = async () => {
    if (!isOnline || !queue.data?.length) return;

    const currentQueue = [...queue.data];

    for (const mutation of currentQueue) {
      try {
        // Process the mutation (this would call your actual API)
        console.log("Processing queued mutation:", mutation);

        // Remove from queue on success
        const updatedQueue =
          queue.data?.filter((m) => m.id !== mutation.id) || [];
        queue.update(updatedQueue);
      } catch (error) {
        console.error("Failed to process queued mutation:", error);

        // Increment retry count
        const updatedQueue =
          queue.data?.map((m) =>
            m.id === mutation.id ? { ...m, retryCount: m.retryCount + 1 } : m
          ) || [];

        // Remove if too many retries
        const finalQueue = updatedQueue.filter((m) => m.retryCount < 3);
        queue.update(finalQueue);
      }
    }
  };

  // Auto-process queue when coming online
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline]);

  return {
    isOnline,
    queue: queue.data || [],
    queueSize: queue.data?.length || 0,
    queueMutation,
    processQueue,
  };
}
