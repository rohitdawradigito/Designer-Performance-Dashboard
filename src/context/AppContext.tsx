import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import type { Task, FilterState } from '../types';
import { fetchTasks, triggerSync } from '../lib/api';
import { applyClientFilters } from '../lib/filters';

interface AppContextValue {
  /** Filtered dataset — used by all display components (charts, KPIs, leaderboard) */
  tasks: Task[];
  /** Complete unfiltered dataset — used ONLY for building dropdown option lists */
  allTasks: Task[];
  loading: boolean;
  error: string | null;
  filters: FilterState;
  setFilters: (f: Partial<FilterState>) => void;
  resetFilters: () => void;
  refetch: () => void;
  sync: () => Promise<void>;
  syncing: boolean;
  lastUpdated: Date | null;
}

const defaultFilters: FilterState = {
  month: '',
  leader: '',
  designer: '',
  deliverable: '',
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // Full unfiltered dataset — fetched once and only refreshed on sync/refetch
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<FilterState>(defaultFilters);
  const [syncing, setSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Always fetch the COMPLETE dataset with no filter params.
   * Filtering happens client-side via applyClientFilters below.
   * This ensures dropdown options are never built from a subset.
   */
  const loadAllTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasks({}); // no filter params — always fetch all
      setAllTasks(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount only (filter changes no longer trigger API calls)
  useEffect(() => {
    loadAllTasks();
  }, [loadAllTasks]);

  // Auto-refresh every 5 minutes — re-fetches the complete dataset
  useEffect(() => {
    intervalRef.current = setInterval(loadAllTasks, 5 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadAllTasks]);

  /**
   * Derived filtered view — recomputed instantly when filters change,
   * with zero additional API calls.
   */
  const tasks = useMemo(
    () => applyClientFilters(allTasks, filters),
    [allTasks, filters],
  );

  const setFilters = useCallback(
    (partial: Partial<FilterState>) =>
      setFiltersState((prev) => ({ ...prev, ...partial })),
    [],
  );

  const resetFilters = useCallback(
    () => setFiltersState(defaultFilters),
    [],
  );

  // refetch re-loads the full dataset, not just the filtered slice
  const refetch = useCallback(() => loadAllTasks(), [loadAllTasks]);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      await triggerSync();
      await loadAllTasks(); // refresh full dataset after sync
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }, [loadAllTasks]);

  return (
    <AppContext.Provider
      value={{
        tasks,
        allTasks,
        loading,
        error,
        filters,
        setFilters,
        resetFilters,
        refetch,
        sync,
        syncing,
        lastUpdated,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
