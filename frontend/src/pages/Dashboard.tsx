import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { analyticsService, type OverviewData, type TrendData } from '../services/analytics.service';

const STATUS_COLORS: Record<string, string> = {
  TODO: '#999',
  IN_PROGRESS: '#666',
  DONE: '#333',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#bbb',
  MEDIUM: '#888',
  HIGH: '#444',
};

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
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewData, trendsData] = await Promise.all([
          analyticsService.getOverview(),
          analyticsService.getTrends(),
        ]);
        setOverview(overviewData);
        setTrends(trendsData);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="page">
        <div className="empty-state">
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

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Overview of your tasks and activity</p>
        </div>
        <Link to="/analytics" className="btn btn-secondary">
          View Full Analytics
        </Link>
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
                <Tooltip
                  contentStyle={{ fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', boxShadow: 'none' }}
                />
                <Legend
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px' }}
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
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', boxShadow: 'none' }}
              />
              <Bar dataKey="value" name="Tasks" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card chart-card-wide">
          <h3>Activity Trend (Last 14 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={recentTrends}>
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
              <Line type="monotone" dataKey="created" name="Created" stroke="#888" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="completed" name="Completed" stroke="#333" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
