import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header, Footer } from './components/SiteChrome';
import Home from './pages/Home';
import Issues from './pages/Issues';
import Report from './pages/Report';
import IssueDetail from './pages/IssueDetail';
import About from './pages/About';
import Auth from './pages/Auth';
import Account from './pages/Account';
import Admin from './pages/Admin';

function Guard({ children, admin = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-state">Loading CityLens…</div>;
  if (!user) return <Navigate to="/login" replace/>;
  if (admin && user.role !== 'admin') return <Navigate to="/account" replace/>;
  return children;
}
function Shell() { return <><Header/><main className="main-content"><Routes><Route path="/" element={<Home/>}/><Route path="/issues" element={<Issues/>}/><Route path="/issues/:id" element={<IssueDetail/>}/><Route path="/report" element={<Report/>}/><Route path="/about" element={<About/>}/><Route path="/login" element={<Auth mode="login"/>}/><Route path="/register" element={<Auth mode="register"/>}/><Route path="/account" element={<Guard><Account/></Guard>}/><Route path="/admin" element={<Guard admin><Admin/></Guard>}/><Route path="*" element={<div className="page-wrap detail-empty"><h1>Page not found</h1><a href="/">Return home</a></div>}/></Routes></main><Footer/></>; }
export default function App() { return <BrowserRouter basename={import.meta.env.BASE_URL}><AuthProvider><Shell/></AuthProvider></BrowserRouter>; }
