interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '16px', borderRadius = '4px', className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="task-card skeleton-card">
      <div className="task-card-header">
        <Skeleton width="60px" height="18px" />
        <Skeleton width="50px" height="18px" />
      </div>
      <Skeleton width="80%" height="14px" />
      <Skeleton width="100%" height="12px" className="skeleton-mt" />
      <Skeleton width="60%" height="12px" className="skeleton-mt" />
      <div className="task-card-footer" style={{ marginTop: '12px' }}>
        <Skeleton width="80px" height="12px" />
        <Skeleton width="60px" height="12px" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <div>
          <Skeleton width="140px" height="22px" />
          <Skeleton width="220px" height="14px" className="skeleton-mt" />
        </div>
      </div>
      <div className="summary-cards">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="summary-card">
            <Skeleton width="80px" height="12px" />
            <Skeleton width="50px" height="28px" className="skeleton-mt" />
          </div>
        ))}
      </div>
      <div className="dashboard-charts">
        <div className="chart-card">
          <Skeleton width="120px" height="12px" />
          <Skeleton width="100%" height="200px" className="skeleton-mt" borderRadius="4px" />
        </div>
        <div className="chart-card">
          <Skeleton width="120px" height="12px" />
          <Skeleton width="100%" height="200px" className="skeleton-mt" borderRadius="4px" />
        </div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="page task-detail-page">
      <div className="task-detail-header">
        <Skeleton width="120px" height="26px" />
      </div>
      <div className="task-detail-content">
        <div className="task-detail-main">
          <Skeleton width="70%" height="22px" />
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
            <Skeleton width="70px" height="20px" />
            <Skeleton width="90px" height="20px" />
          </div>
          <Skeleton width="100%" height="14px" className="skeleton-mt" />
          <Skeleton width="100%" height="14px" className="skeleton-mt" />
          <Skeleton width="60%" height="14px" className="skeleton-mt" />
        </div>
        <div className="detail-card">
          <Skeleton width="60px" height="12px" />
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <Skeleton width="70px" height="12px" />
              <Skeleton width="90px" height="12px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
