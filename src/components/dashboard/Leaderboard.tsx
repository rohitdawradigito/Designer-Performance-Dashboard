import { useAppContext } from '../../context/AppContext';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { Card } from '../ui/Card';
import { RatingBadge } from '../ui/RatingBadge';
import { Table, Thead, Tbody, Th, Td } from '../ui/Table';
import { Trophy, Medal } from 'lucide-react';

/**
 * Rank icon + number for the top 3 ELIGIBLE designers.
 * Ineligible designers (< 3 tasks) receive "—" instead.
 */
function RankCell({ rank, eligible }: { rank: number; eligible: boolean }) {
  if (!eligible) {
    return <span className="text-[#8B8B9E] text-sm">—</span>;
  }
  if (rank === 1)
    return (
      <div className="flex items-center gap-1">
        <Trophy size={15} className="text-yellow-400" />
        <span className="text-yellow-400 font-bold text-sm">1</span>
      </div>
    );
  if (rank === 2)
    return (
      <div className="flex items-center gap-1">
        <Medal size={15} className="text-slate-300" />
        <span className="text-slate-300 font-bold text-sm">2</span>
      </div>
    );
  if (rank === 3)
    return (
      <div className="flex items-center gap-1">
        <Medal size={15} className="text-amber-600" />
        <span className="text-amber-600 font-bold text-sm">3</span>
      </div>
    );
  return (
    <span className="text-[#8B8B9E] text-sm font-medium tabular-nums">
      #{rank}
    </span>
  );
}

/** Subtle row tint for top 3 eligible designers */
function rowBg(rank: number, eligible: boolean): string {
  if (!eligible) return '';
  if (rank === 1) return 'bg-yellow-400/5';
  if (rank === 2) return 'bg-slate-300/5';
  if (rank === 3) return 'bg-amber-600/5';
  return '';
}

export function Leaderboard() {
  const { loading } = useAppContext();
  const leaderboard = useLeaderboard();

  // Assign display ranks only to eligible designers; ineligible get rank = 0
  let eligibleRank = 0;
  const ranked = leaderboard.map((d) => {
    if (d.eligible) eligibleRank += 1;
    return { ...d, displayRank: d.eligible ? eligibleRank : 0 };
  });

  return (
    <Card className="fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#F0F0F5]">
          Designer Leaderboard
        </h2>
        {/* FIX: hide count during loading to avoid "0 designers" flash */}
        <span className="text-xs text-[#8B8B9E]">
          {loading
            ? '…'
            : `${leaderboard.length} designer${leaderboard.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-10 rounded" />
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <p className="text-[#8B8B9E] text-sm py-6 text-center">
          No data available
        </p>
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Rank</Th>
              <Th>Designer</Th>
              <Th>Team Leader</Th>
              <Th>Tasks</Th>
              <Th>Avg Rating</Th>
              <Th>Score</Th>
              <Th>Status</Th>
            </tr>
          </Thead>
          <Tbody>
            {ranked.map((d) => (
              <tr
                key={d.name}
                className={`hover:bg-[#1E1E2E]/50 transition-colors duration-100 ${rowBg(d.displayRank, d.eligible)}`}
              >
                {/* Rank */}
                <Td>
                  <div className="flex items-center justify-center w-10">
                    <RankCell rank={d.displayRank} eligible={d.eligible} />
                  </div>
                </Td>

                {/* Designer name */}
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {d.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-[#F0F0F5]">{d.name}</span>
                  </div>
                </Td>

                {/* Team leader */}
                <Td>
                  <span className="text-[#8B8B9E] text-xs">{d.teamLeader || '—'}</span>
                </Td>

                {/* Tasks */}
                <Td>
                  <span className="text-[#8B8B9E]">{d.totalTasks}</span>
                </Td>

                {/* Avg rating */}
                <Td>
                  <span className="font-semibold text-[#F0F0F5]">
                    {d.averageRating !== null ? d.averageRating.toFixed(2) : '—'}
                  </span>
                </Td>

                {/* Weighted score — "—" for ineligible */}
                <Td>
                  <span
                    className={
                      d.weightedScore !== null
                        ? 'font-semibold text-indigo-400 tabular-nums'
                        : 'text-[#8B8B9E]'
                    }
                  >
                    {d.weightedScore !== null ? d.weightedScore.toFixed(2) : '—'}
                  </span>
                </Td>

                {/* Status badge */}
                <Td>
                  <RatingBadge status={d.status} showRating={false} />
                </Td>
              </tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Card>
  );
}
