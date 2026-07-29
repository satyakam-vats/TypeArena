import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRunHistory } from '../../hooks/useRunHistory';
import { TrendChart } from '../../components/charts/TrendChart';
import { useAuth } from '../../context/AuthContext';
import type { TestMode } from '../../types/typing';

type FilterOption = 'all' | 'time-15' | 'time-30' | 'time-60' | 'words-10' | 'words-25' | 'words-50';

export function AnalyticsDashboard() {
  const runs = useRunHistory();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterOption>('all');

  const filteredRuns = useMemo(() => {
    let result = [...runs].sort((a, b) => a.completedAt - b.completedAt);
    if (filter !== 'all') {
      const [fMode, fValue] = filter.split('-');
      result = result.filter(
        (r) => r.settings.mode === fMode && r.settings.value === parseInt(fValue, 10)
      );
    }
    return result;
  }, [runs, filter]);

  const { wpmData, accData, consData, averages } = useMemo(() => {
    const wpmData = filteredRuns.map((r) => ({
      label: new Date(r.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: Math.round(r.metrics.wpm)
    }));
    const accData = filteredRuns.map((r) => ({
      label: new Date(r.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: Math.round(r.metrics.accuracy)
    }));
    const consData = filteredRuns.map((r) => ({
      label: new Date(r.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: Math.round(r.metrics.consistency)
    }));

    const totalWpm = wpmData.reduce((acc, curr) => acc + curr.value, 0);
    const totalAcc = accData.reduce((acc, curr) => acc + curr.value, 0);
    const totalCons = consData.reduce((acc, curr) => acc + curr.value, 0);

    return {
      wpmData,
      accData,
      consData,
      averages: {
        wpm: wpmData.length ? Math.round(totalWpm / wpmData.length) : 0,
        accuracy: accData.length ? Math.round(totalAcc / accData.length) : 0,
        consistency: consData.length ? Math.round(totalCons / consData.length) : 0,
      }
    };
  }, [filteredRuns]);

  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <h1 className="text-2xl" style={{ fontFamily: '"DM Sans", sans-serif', color: 'var(--ink)' }}>
          analytics
        </h1>
        <p style={{ color: 'var(--muted)', fontFamily: '"DM Sans", sans-serif' }}>
          complete a typing test to see your analytics
        </p>
        <Link 
          to="/" 
          className="quiet-button px-4 py-2 rounded transition-colors"
          style={{ background: 'var(--surface)', color: 'var(--ink)', fontFamily: '"IBM Plex Mono", monospace' }}
        >
          back to home
        </Link>
      </div>
    );
  }

  const filters: { label: string; value: FilterOption }[] = [
    { label: 'all', value: 'all' },
    { label: 'time 15', value: 'time-15' },
    { label: 'time 30', value: 'time-30' },
    { label: 'time 60', value: 'time-60' },
    { label: 'words 10', value: 'words-10' },
    { label: 'words 25', value: 'words-25' },
    { label: 'words 50', value: 'words-50' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 w-full flex flex-col gap-6">
      <div className="analytics-header flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl mb-1" style={{ fontFamily: '"DM Sans", sans-serif', color: 'var(--ink)' }}>
            analytics
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: '"DM Sans", sans-serif' }}>
            {runs.length} total runs
          </p>
        </div>

        {!user && (
          <div className="text-xs px-3 py-1.5 rounded border" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
            sign in to sync your stats across devices
          </div>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-2 text-sm">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="px-3 py-1 rounded transition-colors"
            style={{ 
              fontFamily: '"IBM Plex Mono", monospace',
              color: filter === f.value ? 'var(--accent)' : 'var(--muted)',
              background: filter === f.value ? 'var(--accent-soft)' : 'transparent'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Charts List */}
      <div className="flex flex-col gap-6 mt-4">
        <ChartCard 
          title="wpm" 
          average={averages.wpm} 
          unit="" 
          data={wpmData} 
        />
        <ChartCard 
          title="accuracy" 
          average={averages.accuracy} 
          unit="%" 
          data={accData} 
        />
        <ChartCard 
          title="consistency" 
          average={averages.consistency} 
          unit="%" 
          data={consData} 
        />
      </div>
    </div>
  );
}

function ChartCard({ title, average, unit, data }: { title: string, average: number, unit: string, data: any[] }) {
  return (
    <div 
      className="trend-card rounded-lg p-6 border flex flex-col gap-4" 
      style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
    >
      <div className="flex items-baseline justify-between">
        <h2 
          className="text-lg tracking-wider" 
          style={{ fontFamily: '"IBM Plex Mono", monospace', color: 'var(--muted)' }}
        >
          {title}
        </h2>
        <div className="text-3xl" style={{ fontFamily: '"IBM Plex Mono", monospace', color: 'var(--ink)' }}>
          {average > 0 ? average : '-'}
          <span className="text-xl ml-1" style={{ color: 'var(--muted)' }}>{unit}</span>
        </div>
      </div>
      
      <div className="w-full">
        <TrendChart 
          data={data} 
          yLabel={unit} 
          color="var(--accent)"
        />
      </div>
    </div>
  );
}
