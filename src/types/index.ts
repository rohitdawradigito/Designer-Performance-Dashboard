export interface Task {
  srNo: number;
  date: string;
  clientName: string;
  platform: string;
  teamLeader: string;
  designerName: string;
  deliverable: string;
  description: string;
  workLink: string;
  portfolio: string;
  rating1: number | null;
  rating2: number | null;
  rating3: number | null;
  averageRating: number | null;
}

export interface PortfolioItem {
  srNo: number;
  platform: string;
  workLink: string;
}

export interface DesignerStats {
  name: string;
  teamLeader: string;
  totalTasks: number;
  averageRating: number | null;
  weightedScore: number | null;
  eligible: boolean;
  status: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement' | 'No Rating';
}

export interface FilterState {
  month: string;
  leader: string;
  designer: string;
  deliverable: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T[];
  total?: number;
}