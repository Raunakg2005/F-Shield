import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import TransactionDetail from './pages/TransactionDetail';
import Alerts from './pages/Alerts';
import NetworkGraph from './pages/NetworkGraph';
import Admin from './pages/Admin';
import AuthGuard from './components/AuthGuard';
import Loading from './components/Loading';
import Navbar from './components/Navbar';


export default function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) return <Loading />;

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-cyber-dark text-gray-100">
        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route element={
              <>
                <Navbar />
                <AuthGuard />
              </>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions/:id" element={<TransactionDetail />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/network" element={<NetworkGraph />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Redirects */}
            <Route path="*" element={
              user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } />
          </Routes>
        </main>

      </div>
    </Router>
  );
}