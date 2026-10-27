/**
 * MedInsight AI — Sidebar Navigation
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Database, ShieldCheck, Sliders, BarChart3,
  HeartPulse, Brain, LineChart, Crosshair, Zap, Activity,
  BookOpen, Library, FileText, FlaskConical, Users,
  ClipboardList, HelpCircle, LogOut, ChevronLeft, ChevronRight,
  Dna, Bot, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navGroups = [
  {
    group: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    ] as NavItem[],
  },
  {
    group: 'Data',
    items: [
      { to: '/datasets', label: 'Dataset Management', icon: <Database size={18} /> },
      { to: '/quality', label: 'Data Quality', icon: <ShieldCheck size={18} /> },
      { to: '/preprocessing', label: 'Preprocessing', icon: <Sliders size={18} /> },
      { to: '/eda', label: 'Exploratory Analysis', icon: <BarChart3 size={18} /> },
      { to: '/biomedical-analytics', label: 'Biomedical Analytics', icon: <HeartPulse size={18} /> },
    ] as NavItem[],
  },
  {
    group: 'AI / ML',
    items: [
      { to: '/ml-workbench', label: 'ML Workbench', icon: <Brain size={18} /> },
      { to: '/model-evaluation', label: 'Model Evaluation', icon: <LineChart size={18} /> },
      { to: '/predictions', label: 'Prediction Workspace', icon: <Crosshair size={18} /> },
      { to: '/xai', label: 'Explainable AI', icon: <Zap size={18} /> },
      { to: '/anomaly', label: 'Anomaly Detection', icon: <Activity size={18} /> },
    ] as NavItem[],
  },
  {
    group: 'Biomedical',
    items: [
      { to: '/signals', label: 'Signal Analysis', icon: <Dna size={18} /> },
      { to: '/research-assistant', label: 'Research Assistant', icon: <Bot size={18} /> },
      { to: '/documents', label: 'Document Library', icon: <Library size={18} /> },
    ] as NavItem[],
  },
  {
    group: 'Reports',
    items: [
      { to: '/reports', label: 'Reports', icon: <FileText size={18} /> },
      { to: '/experiments', label: 'Experiment Registry', icon: <FlaskConical size={18} /> },
    ] as NavItem[],
  },
  {
    group: 'Admin',
    items: [
      { to: '/admin/users', label: 'User Administration', icon: <Users size={18} />, adminOnly: true },
      { to: '/activity', label: 'Audit Logs', icon: <ClipboardList size={18} />, adminOnly: true },
    ] as NavItem[],
  },
  {
    group: 'Help',
    items: [
      { to: '/help', label: 'Help & Disclaimer', icon: <HelpCircle size={18} /> },
    ] as NavItem[],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`relative flex flex-col bg-surface-900 border-r border-white/8 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} min-h-screen`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center glow-blue">
          <HeartPulse size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">MedInsight AI</div>
            <div className="text-[10px] text-slate-500 truncate">BioIntelliX</div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-surface-800 border border-white/15 flex items-center justify-center text-slate-400 hover:text-white hover:bg-brand-700 transition-all"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navGroups.map(({ group, items }) => {
          const visibleItems = items.filter(item => !item.adminOnly || user?.role === 'ADMIN' || user?.role === 'CEO');
          if (visibleItems.length === 0) return null;
          return (
            <div key={group}>
              {!collapsed && (
                <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  {group}
                </div>
              )}
              {visibleItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${isActive ? 'nav-link-active' : 'nav-link'} ${collapsed ? 'justify-center px-2' : ''} mb-0.5`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/8 p-3">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                user?.role === 'CEO' 
                  ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-black shadow-sm ring-1 ring-amber-400/50' 
                  : 'bg-brand-700 text-white'
              }`}>
                {user?.role === 'CEO' ? '★' : (user?.username?.[0]?.toUpperCase() ?? 'U')}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate flex items-center gap-1">
                  {user?.full_name || user?.username}
                </div>
                <div className="text-[10px] truncate">
                  {user?.role === 'CEO' ? (
                    <span className="text-amber-300 font-semibold flex items-center gap-1">
                      👑 CEO / Super Admin
                    </span>
                  ) : (
                    <span className="text-slate-500">{user?.role}</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
            <div className="pt-2 border-t border-white/5 px-2 text-[10.5px] text-slate-400 leading-tight">
              <div className="text-slate-500 text-[10px]">Project Leadership</div>
              <div className="text-slate-300">BioIntelliX · Led by</div>
              <a
                href="https://www.linkedin.com/in/s-k-shrivastav/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-medium underline underline-offset-2 my-0.5"
                title="View LinkedIn Profile of Mr. S. K. Shrivastav"
              >
                Mr. S. K. Shrivastav
                <ExternalLink size={10} />
              </a>
              <div className="text-[9.5px] text-slate-500 mt-1">© 2026, all right reserved</div>
            </div>
          </div>
        ) : (
          <button onClick={handleLogout} className="nav-link justify-center text-red-400 hover:text-red-300 w-full" title="Sign Out">
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
