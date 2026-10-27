/**
 * MedInsight AI — App Layout + Router
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import './index.css';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const Landing          = lazy(() => import('./pages/Landing'));
const Login            = lazy(() => import('./pages/Login'));
const Register         = lazy(() => import('./pages/Register'));
const ForgotPassword   = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword    = lazy(() => import('./pages/ResetPassword'));
const Dashboard        = lazy(() => import('./pages/Dashboard'));
const Profile          = lazy(() => import('./pages/Profile'));
const Datasets         = lazy(() => import('./pages/Datasets'));
const DataQuality      = lazy(() => import('./pages/DataQuality'));
const Preprocessing    = lazy(() => import('./pages/Preprocessing'));
const EDA              = lazy(() => import('./pages/EDA'));
const BiomedAnalytics  = lazy(() => import('./pages/BiomedAnalytics'));
const MLWorkbench      = lazy(() => import('./pages/MLWorkbench'));
const ModelEvaluation  = lazy(() => import('./pages/ModelEvaluation'));
const PredictionWS     = lazy(() => import('./pages/PredictionWorkspace'));
const XAIWorkspace     = lazy(() => import('./pages/XAIWorkspace'));
const AnomalyDetection = lazy(() => import('./pages/AnomalyDetection'));
const SignalAnalysis   = lazy(() => import('./pages/SignalAnalysis'));
const ResearchAssistant = lazy(() => import('./pages/ResearchAssistant'));
const DocumentLibrary  = lazy(() => import('./pages/DocumentLibrary'));
const Reports          = lazy(() => import('./pages/Reports'));
const Experiments      = lazy(() => import('./pages/Experiments'));
const AdminUsers       = lazy(() => import('./pages/AdminUsers'));
const ActivityLogs     = lazy(() => import('./pages/ActivityLogs'));
const Help             = lazy(() => import('./pages/Help'));

// ── Guards ────────────────────────────────────────────────────────────────────
function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-surface-900">
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

function RequireGuest() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-slate-400 text-sm">Loading MedInsight AI…</div>
        <div className="text-slate-600 text-xs">BioIntelliX</div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            {/* Public / Guest routes */}
            <Route element={<RequireGuest />}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Protected app routes */}
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/datasets" element={<Datasets />} />
              <Route path="/quality" element={<DataQuality />} />
              <Route path="/preprocessing" element={<Preprocessing />} />
              <Route path="/eda" element={<EDA />} />
              <Route path="/biomedical-analytics" element={<BiomedAnalytics />} />
              <Route path="/ml-workbench" element={<MLWorkbench />} />
              <Route path="/model-evaluation" element={<ModelEvaluation />} />
              <Route path="/predictions" element={<PredictionWS />} />
              <Route path="/xai" element={<XAIWorkspace />} />
              <Route path="/anomaly" element={<AnomalyDetection />} />
              <Route path="/signals" element={<SignalAnalysis />} />
              <Route path="/research-assistant" element={<ResearchAssistant />} />
              <Route path="/documents" element={<DocumentLibrary />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/experiments" element={<Experiments />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/activity" element={<ActivityLogs />} />
              <Route path="/help" element={<Help />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
