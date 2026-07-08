import type { Task, DesignerStats } from '../types';
import { statusFromRating, computeWeightedScore } from './ratings';

/** Minimum tasks to be eligible for Designer of the Month */
const MIN_TASKS_FOR_DOTM = 5;

/** Minimum average rating to be eligible for Designer of the Month */
const MIN_RATING_FOR_DOTM = 3.0;

export function getDesignerOfMonth(tasks: Task[]): DesignerStats | null {
  if (!tasks || tasks.length === 0) return null;

  // ── 1. Group tasks by designerName ──────────────────────────────────────
  const designerMap = new Map<string, {
    tasks: Task[];
    leaderCounts: Map<string, number>;
  }>();

  tasks.forEach((task) => {
    if (!task.designerName) return;
    const existing = designerMap.get(task.designerName) ?? {
      tasks: [],
      leaderCounts: new Map<string, number>(),
    };
    existing.tasks.push(task);
    if (task.teamLeader) {
      existing.leaderCounts.set(
        task.teamLeader,
        (existing.leaderCounts.get(task.teamLeader) ?? 0) + 1,
      );
    }
    designerMap.set(task.designerName, existing);
  });

  // ── 2. Total tasks across all designers (denominator for weighted score) ─
  const totalTasksAll = tasks.filter((t) => t.designerName).length;

  // ── 3. Build eligible list (MIN_TASKS_FOR_DOTM+, rated, MIN_RATING+) ────
  const eligible: DesignerStats[] = [];

  designerMap.forEach((data, name) => {
    // Must have minimum number of tasks
    if (data.tasks.length < MIN_TASKS_FOR_DOTM) return;

    const ratedTasks = data.tasks.filter(
      (t) => t.averageRating !== null && t.averageRating !== undefined,
    );
    if (ratedTasks.length === 0) return;

    const avgRating =
      ratedTasks.reduce((sum, t) => sum + (t.averageRating ?? 0), 0) / ratedTasks.length;
    const roundedAvg = Math.round(avgRating * 100) / 100;

    // Must meet minimum rating threshold
    if (roundedAvg < MIN_RATING_FOR_DOTM) return;

    const weightedScore = Math.round(
      computeWeightedScore(roundedAvg, data.tasks.length, totalTasksAll) * 100,
    ) / 100;

    // Most frequent team leader
    let primaryLeader = '';
    let maxCount = 0;
    data.leaderCounts.forEach((count, leader) => {
      if (count > maxCount) { maxCount = count; primaryLeader = leader; }
    });

    eligible.push({
      name,
      teamLeader: primaryLeader,
      totalTasks: data.tasks.length,
      averageRating: roundedAvg,
      weightedScore,
      eligible: true,
      status: statusFromRating(roundedAvg),
    });
  });

  if (eligible.length === 0) return null;

  // ── 4. Winner = highest weightedScore; tiebreaker = fewer tasks ──────────
  eligible.sort((a, b) => {
    const diff = (b.weightedScore ?? 0) - (a.weightedScore ?? 0);
    if (diff !== 0) return diff;
    return a.totalTasks - b.totalTasks;
  });

  return eligible[0];
}
