import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { CreateWallet } from './pages/CreateWallet';
import { ImportWallet } from './pages/ImportWallet';
import { Send } from './pages/Send';
import { Receive } from './pages/Receive';
import { Assets } from './pages/Assets';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-cyan-600/30 border-t-cyan-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/wallet/create" element={<ProtectedRoute><CreateWallet /></ProtectedRoute>} />
        <Route path="/wallet/import" element={<ProtectedRoute><ImportWallet /></ProtectedRoute>} />
        <Route path="/send" element={<ProtectedRoute><Send /></ProtectedRoute>} />
        <Route path="/receive" element={<ProtectedRoute><Receive /></ProtectedRoute>} />
        <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
