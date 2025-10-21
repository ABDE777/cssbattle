import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import LearningCenter from "./pages/LearningCenter";
import Resources from "./pages/Resources";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPlayerDetails from "./pages/AdminPlayerDetails";
import AdminLearningManagement from "./pages/AdminLearningManagement";
import PasswordReset from "./pages/PasswordReset";
import DatabaseTest from "./pages/DatabaseTest";
import DatabasePermissionsTest from "./pages/DatabasePermissionsTest";
import TestPlayerFetch from "./pages/TestPlayerFetch";
import TestStorage from "./pages/TestStorage";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import PlayerProtectedRoute from "./components/PlayerProtectedRoute";
import PlayerMessagesPanel from "./components/PlayerMessagesPanel";
import MessagesPanel from "./components/MessagesPanel";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useAuth } from "./contexts/AuthContext";
import { useAdmin } from "./contexts/AdminContext";
import { useMessagePanel } from "./hooks/useMessagePanel";

// Wrapper component that includes global message panels
const AppContent = () => {
  const { user } = useAuth();
  const { admin, isAdmin } = useAdmin();
  const {
    isPlayerMessagesOpen,
    isAdminMessagesOpen,
    closePlayerMessages,
    closeAdminMessages,
  } = useMessagePanel();

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Index />
            </>
          }
        />
        <Route
          path="/register"
          element={
            <>
              <Navbar />
              <Register />
            </>
          }
        />
        <Route
          path="/login"
          element={
            <>
              <Navbar />
              <Login />
            </>
          }
        />
        <Route path="/reset-password" element={<PasswordReset />} />

        {/* Player-only routes */}
        <Route
          path="/profile"
          element={
            <PlayerProtectedRoute>
              <>
                <Navbar />
                <Profile />
              </>
            </PlayerProtectedRoute>
          }
        />

        {/* Routes accessible to both players and admins */}
        <Route
          path="/leaderboard"
          element={
            <>
              <Navbar />
              <Leaderboard />
            </>
          }
        />
        <Route
          path="/learning"
          element={
            <PlayerProtectedRoute>
              <>
                <Navbar />
                <LearningCenter />
              </>
            </PlayerProtectedRoute>
          }
        />
        <Route
          path="/resources"
          element={
            <>
              <Navbar />
              <Resources />
            </>
          }
        />

        {/* Admin-only routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <>
                <Navbar />
                <AdminDashboard />
              </>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/player/:playerId"
          element={
            <AdminProtectedRoute>
              <>
                <Navbar />
                <AdminPlayerDetails />
              </>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/learning"
          element={
            <AdminProtectedRoute>
              <>
                <Navbar />
                <AdminLearningManagement />
              </>
            </AdminProtectedRoute>
          }
        />

        {/* Test routes - should probably be removed in production */}
        <Route
          path="/database-test"
          element={
            <>
              <Navbar />
              <DatabaseTest />
            </>
          }
        />
        <Route
          path="/database-permissions-test"
          element={
            <>
              <Navbar />
              <DatabasePermissionsTest />
            </>
          }
        />
        <Route
          path="/test-player-fetch"
          element={
            <>
              <Navbar />
              <TestPlayerFetch />
            </>
          }
        />
        <Route
          path="/test-storage"
          element={
            <AdminProtectedRoute>
              <>
                <Navbar />
                <TestStorage />
              </>
            </AdminProtectedRoute>
          }
        />
      </Routes>

      {/* Global Player Messages Panel */}
      {user && (
        <PlayerMessagesPanel
          playerEmail={user?.email || ""}
          isOpen={isPlayerMessagesOpen}
          onClose={closePlayerMessages}
        />
      )}

      {/* Global Admin Messages Panel */}
      {isAdmin && (
        <MessagesPanel
          isOpen={isAdminMessagesOpen}
          onClose={closeAdminMessages}
        />
      )}
    </>
  );
};

const App = () => (
  <AuthProvider>
    <AdminProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </LanguageProvider>
    </AdminProvider>
  </AuthProvider>
);

export default App;
