import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import LearningCenter from "./pages/LearningCenter";
import AdminDashboard from "./pages/AdminDashboardBulk";
import AdminPlayerDetails from "./pages/AdminPlayerDetails";
import AdminQuizRecords from "./pages/AdminQuizRecords";
import AdminMessagesEnhanced from "./pages/AdminMessagesEnhanced";
import PasswordReset from "./pages/PasswordReset";
import QuizDebug from "./pages/QuizDebug";
import Team from "./pages/Team";
import MonthlyWinners from "./pages/MonthlyWinners";
import PlayerHistory from "./pages/PlayerHistory";
import AdminPlayerHistories from "./pages/AdminPlayerHistories";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import PlayerProtectedRoute from "./components/PlayerProtectedRoute";
import PlayerMessagesPanel from "./components/PlayerMessagesPanel";
import MessagesPanel from "./components/MessagesPanel";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
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
    <div className="flex flex-col min-h-screen">
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Index />
              <Footer />
            </>
          }
        />
        <Route
          path="/register"
          element={
            <>
              <Navbar />
              <Register />
              <Footer />
            </>
          }
        />
        <Route
          path="/login"
          element={
            <>
              <Navbar />
              <Login />
              <Footer />
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
                <Footer />
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
              <Footer />
            </>
          }
        />
        <Route
          path="/learning"
          element={
            <>
              <Navbar />
              <LearningCenter />
              <Footer />
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
                <Footer />
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
                <Footer />
              </>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/quiz-records"
          element={
            <AdminProtectedRoute>
              <>
                <Navbar />
                <AdminQuizRecords />
                <Footer />
              </>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/messages"
          element={
            <AdminProtectedRoute>
              <AdminMessagesEnhanced />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/player-histories"
          element={
            <AdminProtectedRoute>
              <>
                <Navbar />
                <AdminPlayerHistories />
                <Footer />
              </>
            </AdminProtectedRoute>
          }
        />

        {/* Other routes */}
        <Route
          path="/quiz-debug"
          element={
            <>
              <Navbar />
              <QuizDebug />
              <Footer />
            </>
          }
        />
        <Route
          path="/team"
          element={
            <>
              <Team />
              <Footer />
            </>
          }
        />
        <Route
          path="/winners"
          element={
            <>
              <Navbar />
              <MonthlyWinners />
              <Footer />
            </>
          }
        />
        <Route
          path="/history"
          element={
            <PlayerProtectedRoute>
              <>
                <Navbar />
                <PlayerHistory />
                <Footer />
              </>
            </PlayerProtectedRoute>
          }
        />
        <Route
          path="/history/:playerId"
          element={
            <AdminProtectedRoute>
              <>
                <Navbar />
                <PlayerHistory />
                <Footer />
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
    </div>
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
