import { API_URL } from '../config/env';
import type { Task, PortfolioItem, FilterState, ApiResponse } from '../types';

function buildParams(filters: Partial<FilterState>): URLSearchParams {
  const params = new URLSearchParams({ action: 'getData' });
  if (filters.month) params.set('month', filters.month);
  if (filters.leader) params.set('leader', filters.leader);
  if (filters.designer) params.set('designer', filters.designer);
  if (filters.deliverable) params.set('deliverable', filters.deliverable);
  return params;
}

export async function fetchTasks(
  filters: Partial<FilterState> = {}
): Promise<Task[]> {
  const params = buildParams(filters);
  const url = `${API_URL}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = (await res.json()) as ApiResponse<Record<string, unknown>>;
  if (!json.success) throw new Error('API returned success: false');
  return (json.data ?? []).map((raw): Task => ({
    srNo: Number(raw['srNo']) || 0,
    date: String(raw['date'] ?? ''),
    clientName: String(raw['clientName'] ?? ''),
    platform: String(raw['platform'] ?? ''),
    teamLeader: String(raw['teamLeader'] ?? ''),
    designerName: String(raw['designerName'] ?? ''),
    deliverable: String(raw['deliverable'] ?? ''),
    description: String(raw['description'] ?? ''),
    workLink: String(raw['workLink'] ?? ''),
    portfolio: String(raw['portfolio'] ?? ''),
    rating1: raw['rating1'] != null ? Number(raw['rating1']) : null,
    rating2: raw['rating2'] != null ? Number(raw['rating2']) : null,
    rating3: raw['rating3'] != null ? Number(raw['rating3']) : null,
    averageRating: raw['averageRating'] != null ? Number(raw['averageRating']) : null,
  }));
}

export async function fetchPortfolio(): Promise<PortfolioItem[]> {
  const url = `${API_URL}?action=getPortfolio`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = (await res.json()) as ApiResponse<PortfolioItem>;
  if (!json.success) throw new Error('API returned success: false');
  return json.data ?? [];
}

export async function triggerSync(): Promise<void> {
  const url = `${API_URL}?action=sync`;
  await fetch(url);
}