export interface TeamLeader {
  name: string;
  ratingAccess: 'full' | 'rating3only';
}

export const TEAM_LEADERS: TeamLeader[] = [
  { name: 'Sameer Sain', ratingAccess: 'full' },
  { name: 'Stuti Sharma', ratingAccess: 'full' },
  { name: 'Akanksha', ratingAccess: 'full' },
  { name: 'Sagar Sharma', ratingAccess: 'rating3only' },
  { name: 'Tammana Sharma', ratingAccess: 'rating3only' },
  { name: 'Aniket', ratingAccess: 'rating3only' },
];

export const TEAM_LEADER_NAMES = TEAM_LEADERS.map((l) => l.name);
