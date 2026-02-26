import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { analyticsService, type OverviewData, type TrendData, type AnalyticsQuery } from '../services/analytics.service';
import { DashboardSkeleton } from '../components/common/Skeleton';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

function useChartColors() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return {
    grid: dark ? '#333' : '#eee',
    tooltipBg: dark ? '#1e1e1e' : '#fff',
    tooltipBorder: dark ? '#444' : '#ddd',
    tooltipText: dark ? '#e0e0e0' : '#222',
    tooltipLabel: dark ? '#aaa' : '#666',
    axisText: dark ? '#999' : undefined,
    legendText: dark ? '#aaa' : undefined,
    pieTodo: dark ? '#777' : '#999',
    pieInProgress: dark ? '#aaa' : '#666',
    pieDone: dark ? '#ddd' : '#333',
    prioLow: dark ? '#666' : '#bbb',
    prioMed: dark ? '#999' : '#888',
    prioHigh: dark ? '#ccc' : '#444',
    lineA: dark ? '#999' : '#888',
    lineB: dark ? '#ddd' : '#333',
    cursorFill: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
  };
}

const STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export default function Dashboard() {
  const c = useChartColors();
  const { user } = useAuth();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  const STATUS_COLORS: Record<string, string> = {
    TODO: c.pieTodo,
    IN_PROGRESS: c.pieInProgress,
    DONE: c.pieDone,
  };

  const PRIORITY_COLORS: Record<string, string> = {
    LOW: c.prioLow,
    MEDIUM: c.prioMed,
    HIGH: c.prioHigh,
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    const query: AnalyticsQuery = myTasksOnly && user ? { assigned_to: user.id } : {};
    try {
      const [overviewData, trendsData] = await Promise.all([
        analyticsService.getOverview(query),
        analyticsService.getTrends(undefined, query),
      ]);
      setOverview(overviewData);
      setTrends(trendsData);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [myTasksOnly, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !overview) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>{error || 'Unable to load data'}</h3>
          <p>Please try again later.</p>
        </div>
      </div>
    );
  }

  const statusData = Object.entries(overview.by_status)
    .filter(([, count]) => count > 0)
    .map(([key, value]) => ({
      name: STATUS_LABELS[key] || key,
      value,
      color: STATUS_COLORS[key] || '#999',
    }));

  const priorityData = Object.entries(overview.by_priority).map(([key, value]) => ({
    name: PRIORITY_LABELS[key] || key,
    value,
    fill: PRIORITY_COLORS[key] || '#999',
  }));

  const recentTrends = trends.slice(-14);

  const tooltipStyle = {
    fontSize: '12px',
    background: c.tooltipBg,
    border: `1px solid ${c.tooltipBorder}`,
    borderRadius: '4px',
    boxShadow: 'none',
    color: c.tooltipText,
  };
  const tooltipLabelStyle = { color: c.tooltipLabel };
  const tooltipItemStyle = { color: c.tooltipText };

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Overview of your tasks and activity</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className={`btn btn-sm ${myTasksOnly ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMyTasksOnly((v) => !v)}
          >
            My Tasks
          </button>
          <Link to="/analytics" className="btn btn-secondary">
            View Full Analytics
          </Link>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">Total Tasks</span>
          <span className="summary-value">{overview.total}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Completed</span>
          <span className="summary-value">{overview.by_status.DONE || 0}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">In Progress</span>
          <span className="summary-value">{overview.by_status.IN_PROGRESS || 0}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Overdue</span>
          <span className="summary-value summary-value-overdue">{overview.overdue}</span>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <h3>Tasks by Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                <Legend
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', color: c.legendText }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No tasks yet</div>
          )}
        </div>

        <div className="chart-card">
          <h3>Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: c.axisText }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: c.axisText }} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} cursor={{ fill: c.cursorFill }} />
              <Bar dataKey="value" name="Tasks" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card chart-card-wide">
          <h3>Activity Trend (Last 14 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={recentTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: c.axisText }}
                tickFormatter={(v: string) => {
                  const d = new Date(v + 'T00:00:00');
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: c.axisText }} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                labelFormatter={(v) => {
                  const d = new Date(String(v) + 'T00:00:00');
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', color: c.legendText }} />
              <Line type="monotone" dataKey="created" name="Created" stroke={c.lineA} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="completed" name="Completed" stroke={c.lineB} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
