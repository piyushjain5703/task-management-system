import { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { analyticsService, type PerformanceData, type TrendData } from '../services/analytics.service';
import { useToast } from '../hooks/useToast';

const RANGE_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

export default function Analytics() {
  const { addToast } = useToast();
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [perfData, trendsData] = await Promise.all([
        analyticsService.getPerformance(),
        analyticsService.getTrends(days),
      ]);
      setPerformance(perfData);
      setTrends(trendsData);
    } catch {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await analyticsService.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tasks_export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      addToast('CSV exported successfully', 'success');
    } catch {
      addToast('Failed to export CSV', 'error');
    } finally {
      setExporting(false);
    }
  };

  const formatDuration = (hours: number): string => {
    if (hours < 1) return '< 1h';
    if (hours < 24) return `${hours}h`;
    const d = Math.floor(hours / 24);
    const h = Math.round(hours % 24);
    return h > 0 ? `${d}d ${h}h` : `${d}d`;
  };

  const weeklyTrends = trends.reduce<TrendData[]>((acc, item, i) => {
    if (i % 7 === 0) {
      acc.push({ date: item.date, created: 0, completed: 0 });
    }
    const week = acc[acc.length - 1];
    week.created += item.created;
    week.completed += item.completed;
    return acc;
  }, []);

  const showWeekly = days > 30;
  const chartData = showWeekly ? weeklyTrends : trends;

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page analytics-page">
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p className="page-subtitle">Performance metrics and task trends</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="analytics-section">
        <div className="section-header">
          <h2>Task Trends</h2>
          <div className="range-selector">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`range-btn ${days === opt.value ? 'range-btn-active' : ''}`}
                onClick={() => setDays(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v: string) => {
                  const d = new Date(v + 'T00:00:00');
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', boxShadow: 'none' }}
                labelFormatter={(v: string) => {
                  const d = new Date(v + 'T00:00:00');
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="created" name="Created" stroke="#888" strokeWidth={2} dot={chartData.length <= 31} />
              <Line type="monotone" dataKey="completed" name="Completed" stroke="#333" strokeWidth={2} dot={chartData.length <= 31} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card" style={{ marginTop: '12px' }}>
          <h3>Daily Volume</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={showWeekly ? 16 : 8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v: string) => {
                  const d = new Date(v + 'T00:00:00');
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', boxShadow: 'none' }}
                labelFormatter={(v: string) => {
                  const d = new Date(v + 'T00:00:00');
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="created" name="Created" fill="#bbb" radius={[2, 2, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#555" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="analytics-section">
        <h2>User Performance</h2>
        {performance.length > 0 ? (
          <div className="performance-table-wrapper">
            <table className="performance-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Completed Tasks</th>
                  <th>Avg. Completion Time</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((p) => (
                  <tr key={p.user_id}>
                    <td>
                      <div className="perf-user">
                        <div className="mini-avatar">{p.user_name.charAt(0).toUpperCase()}</div>
                        {p.user_name}
                      </div>
                    </td>
                    <td>
                      <span className="perf-count">{p.completed_tasks}</span>
                    </td>
                    <td>
                      <span className="perf-time">{formatDuration(p.avg_completion_time)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📈</div>
            <h3>No performance data yet</h3>
            <p>Complete some assigned tasks to see performance metrics.</p>
          </div>
        )}
      </section>
    </div>
  );
}
