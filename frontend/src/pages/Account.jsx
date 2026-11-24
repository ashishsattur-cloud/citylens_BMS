import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, MapPin, UserRound } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { IssueCard } from '../components/IssueBits';
export default function Account() {
  const { user } = useAuth(); const [reports, setReports] = useState([]); const [error, setError] = useState('');
  useEffect(() => { api.get('/reports/mine').then(({ data }) => setReports(data.reports)).catch((e) => setError(e.message)); }, []);
  return <div className="page-wrap account-page"><div className="page-title-block"><p className="eyebrow">Citizen account</p><h1>Hello, {user?.name?.split(' ')[0] || 'there'}.</h1><p>Your CityLens activity and submitted reports.</p></div><div className="account-summary"><div><UserRound size={18}/><span>{user?.name}</span></div><div><ClipboardList size={18}/><span>{reports.length} submitted reports</span></div><div><MapPin size={18}/><span>Community contributor</span></div></div><div className="section-heading"><div><p className="eyebrow">Your contributions</p><h2>My reports</h2></div><Link to="/report" className="button button-dark button-small">New report +</Link></div>{error && <div className="notice notice-error">{error}</div>}{reports.length ? <div className="issue-grid">{reports.map((r) => <IssueCard key={r._id} issue={r}/>)}</div> : <div className="empty-state"><ClipboardList size={28}/><p>You have not submitted a report yet.</p><Link to="/report" className="text-link">Report your first issue →</Link></div>}</div>;
}
