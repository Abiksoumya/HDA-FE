import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import AdminPanel from '@/components/layout/AdminPanel';
import ToastContainer from '@/components/panels/ToastContainer';
import PageLoader from '@/components/shared/PageLoader';

const Login = lazy(() => import('@/components/pages/Login'));
const Dashboard = lazy(() => import('@/components/pages/Dashboard'));
const CompanyManager = lazy(() => import('@/components/pages/master/company/CompanyManager'));
const DepartmentManager = lazy(() => import('@/components/pages/master/department/DepartmentManager'));
const CompanyDepartmentManager = lazy(() => import('@/components/pages/master/company-department/CompanyDepartmentManager'));
const AdminGroupManager = lazy(() => import('@/components/pages/master/admin-group/AdminGroupManager'));
const FileUpload = lazy(() => import('@/components/pages/FileUpload'));
const NotFound = lazy(() => import('@/components/pages/NotFound'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <>
      <ToastContainer />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

          {/* Protected shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="company" element={<CompanyManager />} />
            <Route path="department" element={<DepartmentManager />} />
            <Route path="company-wise-department" element={<CompanyDepartmentManager />} />
            <Route path="user-group" element={<AdminGroupManager />} />
            <Route path="fileupload" element={<FileUpload />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
