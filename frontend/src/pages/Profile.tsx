import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="page profile-page">
      <div className="profile-card">
        <div className="profile-avatar-section">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="profile-avatar" />
          ) : (
            <div className="profile-avatar profile-avatar-placeholder">{initials}</div>
          )}
          <h1>{user.name}</h1>
          <p className="profile-email">{user.email}</p>
        </div>
        <div className="profile-details">
          <div className="profile-detail-row">
            <span className="profile-label">Full Name</span>
            <span className="profile-value">{user.name}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-label">Email Address</span>
            <span className="profile-value">{user.email}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-label">Member Since</span>
            <span className="profile-value">{memberSince}</span>
          </div>
        </div>
        <div className="profile-actions">
          <button className="btn btn-danger" onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
