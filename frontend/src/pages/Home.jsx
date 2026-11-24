import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Activity, MapPin, ShieldCheck, Users } from 'lucide-react';
import api from '../lib/api';
import { IssueCard } from '../components/IssueBits';
import hero from '../assets/hero-street.jpg';

const steps = [
  { n: '01', title: 'Spot it', text: 'A broken slab, a blocked footpath, an unsafe crossing. If it makes your neighbourhood harder to navigate, it belongs here.' },
  { n: '02', title: 'Report it', text: 'Add a photo, describe the impact and pin the exact location. Your report becomes part of a shared public record.' },
  { n: '03', title: 'Track it', text: 'Follow the status and severity of the issue. Neighbours and civic teams can see what needs attention first.' }
];
export default function Home() {
  const [data, setData] = useState({ reports: [], stats: { total: 0, inProgress: 0, resolved: 0, highSeverity: 0 } });
  const [error, setError] = useState('');
  useEffect(() => { api.get('/reports', { params: { limit: 4 } }).then(({ data: d }) => setData((s) => ({ ...s, reports: d.reports }))).catch((e) => setError(e.message)); api.get('/reports/stats').then(({ data: d }) => setData((s) => ({ ...s, stats: d.stats }))).catch(() => {}); }, []);
  return <>
    <section className="hero-section page-wrap"><div className="hero-copy rise"><p className="eyebrow">Bengaluru · Civic issue intelligence</p><h1>See your city.<br/><em>Make it better.</em></h1><p className="hero-lede">CityLens turns everyday civic problems into a visible, location-aware record — so communities can report issues and understand what needs attention first.</p><div className="hero-actions"><Link to="/report" className="button button-dark">Report an issue <ArrowRight size={16}/></Link><Link to="/issues" className="button button-light">Explore the map <MapPin size={16}/></Link></div><div className="hero-proof"><span><i/> Public issue map</span><span><i/> Explainable severity score</span><span><i/> Community reports</span></div></div><figure className="hero-visual rise"><img src={hero} alt="Pedestrians walking along an uneven city footpath"/><figcaption><span>FIELD NOTE / BLR</span><span>Street-level issues, made visible.</span></figcaption></figure></section>
    <section className="stats-band"><div className="page-wrap stats-grid"><div><span className="eyebrow">Reports in the system</span><strong>{data.stats.total || data.reports.length}</strong><small>Community submissions</small></div><div><span className="eyebrow">In progress</span><strong>{data.stats.inProgress}</strong><small>Awaiting resolution</small></div><div><span className="eyebrow">Resolved</span><strong>{data.stats.resolved}</strong><small>Marked as fixed</small></div><div><span className="eyebrow">Needs attention</span><strong>{data.stats.highSeverity}</strong><small>Open issues scored 50+</small></div></div></section>
    <section className="page-wrap section-block"><div className="section-heading"><div><p className="eyebrow">Latest from the ground</p><h2>Recently reported</h2></div><Link to="/issues" className="text-link">View all reports <ArrowUpRight size={16}/></Link></div>{error && <div className="notice notice-warn">Could not load live reports: {error}. Start the API and seed the database to see sample issues.</div>}<div className="issue-grid">{data.reports.map((issue) => <IssueCard key={issue._id} issue={issue}/>)}</div>{!data.reports.length && <div className="empty-state"><MapPin size={28}/><p>No reports are available yet.</p><Link to="/report" className="text-link">Submit the first report <ArrowRight size={14}/></Link></div>}</section>
    <section className="how-section"><div className="page-wrap"><div className="section-heading"><div><p className="eyebrow">A better feedback loop</p><h2>From a street-level problem<br/>to a shared city record.</h2></div><p className="section-intro">One report can help a whole neighbourhood see a problem clearly, understand its urgency and follow progress.</p></div><ol className="steps-grid">{steps.map((step) => <li key={step.n}><span className="step-number">{step.n}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol></div></section>
    <section className="cta-section page-wrap"><div><p className="eyebrow">Start with what you see</p><h2>Make the invisible<br/>impossible to ignore.</h2></div><Link to="/report" className="button button-dark">Add a civic report <ArrowRight size={16}/></Link></section>
  </>;
}
