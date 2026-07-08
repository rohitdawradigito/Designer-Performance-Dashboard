import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { KPICard } from './KPICard';
import { Users, ClipboardList, Star, Trophy, TrendingDown } from 'lucide-react';

export function KPIGrid() {
  const { tasks, loading } = useAppContext();

  const stats = useMemo(() => {
    if (!tasks.length) return null;

    const totalTasks = tasks.length;

    // Count unique DESIGNERS (designerName), not leaders
    const uniqueDesigners = new Set(
      tasks.map((t) => t.designerName).filter(Boolean)
    ).size;

    // Average rating across all tasks that have a rating
    const ratedTasks = tasks.filter(
      (t) => t.averageRating !== null && t.averageRating !== undefined
    );
    const avgRating =
      ratedTasks.length > 0
        ? ratedTasks.reduce((s, t) => s + Number(t.averageRating), 0) / ratedTasks.length
        : null;

    // ── Best Performer & Needs Attention ────────────────────────────────────
    // Computed DIRECTLY from tasks grouped by task.designerName.
    // Never uses useLeaderboard to avoid any risk of teamLeader leaking in.
    const designerRatingMap = new Map<string, { sum: number; count: number }>();

    tasks.forEach((t) => {
      if (!t.designerName) return;
      if (t.averageRating === null || t.averageRating === undefined) return;
      const existing = designerRatingMap.get(t.designerName) ?? { sum: 0, count: 0 };
      existing.sum += Number(t.averageRating);
      existing.count += 1;
      designerRatingMap.set(t.designerName, existing);
    });

    // Build array: { designerName, avgRating }
    const designerAvgs: { designerName: string; avgRating: number }[] = [];
    designerRatingMap.forEach(({ sum, count }, designerName) => {
      designerAvgs.push({ designerName, avgRating: sum / count });
    });

    // Sort by avgRating descending
    designerAvgs.sort((a, b) => b.avgRating - a.avgRating);

    const best = designerAvgs[0] ?? null;
    const worst = designerAvgs[designerAvgs.length - 1] ?? null;

    return { totalTasks, uniqueDesigners, avgRating, best, worst };
  }, [tasks]);

  const isLoading = loading || !stats;

  return (
    // FIX 1: 1 col mobile → 2 col small → 3 col large. No overflow, no cut cards.
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 w-full">
      <KPICard
        title="Total Tasks"
        value={isLoading ? '—' : stats.totalTasks.toLocaleString()}
        icon={<ClipboardList size={18} />}
        iconColor="text-indigo-400"
        loading={isLoading}
      />
      <KPICard
        title="Total Designers"
        value={isLoading ? '—' : stats.uniqueDesigners}
        icon={<Users size={18} />}
        iconColor="text-emerald-400"
        loading={isLoading}
      />
      <KPICard
        title="Avg Rating"
        value={
          isLoading
            ? '—'
            : stats.avgRating !== null
            ? `${stats.avgRating.toFixed(2)} / 5`
            : 'N/A'
        }
        icon={<Star size={18} />}
        iconColor="text-amber-400"
        loading={isLoading}
      />
      <KPICard
        title="Best Performer"
        value={isLoading ? '—' : stats.best?.designerName ?? 'N/A'}
        subtitle={
          stats?.best != null
            ? `Avg Rating: ${stats.best.avgRating.toFixed(2)}`
            : undefined
        }
        icon={<Trophy size={18} />}
        iconColor="text-yellow-400"
        loading={isLoading}
      />
      <KPICard
        title="Needs Attention"
        value={isLoading ? '—' : stats.worst?.designerName ?? 'N/A'}
        subtitle={
          stats?.worst != null
            ? `Avg Rating: ${stats.worst.avgRating.toFixed(2)}`
            : undefined
        }
        icon={<TrendingDown size={18} />}
        iconColor="text-red-400"
        loading={isLoading}
      />
    </div>
  );
}
