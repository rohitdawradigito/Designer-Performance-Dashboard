import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { DesignerStats } from '../types';
import { statusFromRating, computeWeightedScore } from '../lib/ratings';

/** Must match designerOfMonth.ts thresholds */
const ELIGIBLE_MIN_TASKS = 5;
const ELIGIBLE_MIN_RATING = 3.0;

export function useLeaderboard(): DesignerStats[] {
  const { tasks } = useAppContext();

  return useMemo(() => {
    // ── 1. Aggregate per designer ─────────────────────────────────────────
    const designerMap = new Map<string, {
      totalTasks: number;
      ratingSum: number;
      ratingCount: number;
      teamLeaderCounts: Map<string, number>;
    }>();

    tasks.forEach((task) => {
      const designer = task.designerName;
      if (!designer) return;

      const existing = designerMap.get(designer) ?? {
        totalTasks: 0,
        ratingSum: 0,
        ratingCount: 0,
        teamLeaderCounts: new Map<string, number>(),
      };

      existing.totalTasks += 1;

      if (task.averageRating !== null && task.averageRating !== undefined) {
        existing.ratingSum += Number(task.averageRating);
        existing.ratingCount += 1;
      }

      // Track primary team leader (most frequent)
      if (task.teamLeader) {
        const prev = existing.teamLeaderCounts.get(task.teamLeader) ?? 0;
        existing.teamLeaderCounts.set(task.teamLeader, prev + 1);
      }

      designerMap.set(designer, existing);
    });

    // ── 2. Total tasks across ALL designers (for weighted score) ──────────
    const totalTasksAll = tasks.filter((t) => t.designerName).length;

    // ── 3. Build DesignerStats array ──────────────────────────────────────
    const stats: DesignerStats[] = [];

    designerMap.forEach((data, name) => {
      const avgRating =
        data.ratingCount > 0
          ? Math.round((data.ratingSum / data.ratingCount) * 100) / 100
          : null;

      // Most frequent team leader for this designer
      let primaryLeader = '';
      let maxCount = 0;
      data.teamLeaderCounts.forEach((count, leader) => {
        if (count > maxCount) { maxCount = count; primaryLeader = leader; }
      });

      // Eligible = 5+ tasks AND avgRating >= 3.0 (same thresholds as DOTM)
      const eligible =
        data.totalTasks >= ELIGIBLE_MIN_TASKS &&
        avgRating !== null &&
        avgRating >= ELIGIBLE_MIN_RATING;

      // Weighted score only for eligible designers with a rating
      const weightedScore =
        eligible && avgRating !== null
          ? Math.round(
              computeWeightedScore(avgRating, data.totalTasks, totalTasksAll) * 100,
            ) / 100
          : null;

      stats.push({
        name,
        teamLeader: primaryLeader,
        totalTasks: data.totalTasks,
        averageRating: avgRating,
        weightedScore,
        eligible,
        status: statusFromRating(avgRating),
      });
    });

    // ── 4. Sort: eligible by weightedScore → ineligible-with-rating → null-rating ─
    return stats.sort((a, b) => {
      // Eligible always first
      if (a.eligible && !b.eligible) return -1;
      if (!a.eligible && b.eligible) return 1;

      // Both eligible: sort by weightedScore desc
      if (a.eligible && b.eligible) {
        if (a.weightedScore !== null && b.weightedScore !== null) {
          const diff = b.weightedScore - a.weightedScore;
          if (diff !== 0) return diff;
        }
        if (a.weightedScore !== null && b.weightedScore === null) return -1;
        if (a.weightedScore === null && b.weightedScore !== null) return 1;
        return b.totalTasks - a.totalTasks;
      }

      // Both ineligible: sort by avgRating desc; null-rating designers go last
      if (a.averageRating !== null && b.averageRating === null) return -1;
      if (a.averageRating === null && b.averageRating !== null) return 1;
      if (a.averageRating !== null && b.averageRating !== null) {
        return b.averageRating - a.averageRating;
      }
      return b.totalTasks - a.totalTasks;
    });
  }, [tasks]);
}
