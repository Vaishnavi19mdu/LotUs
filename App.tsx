import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/Landing';
import { LoginPage, SignupPage } from './pages/Auth';
import { DashboardLayout } from './components/Layout';
import { DashboardOverview } from './pages/DashboardOverview';
import { LotUsMatchPage } from './pages/LotUsMatch';
import { CreateEventPage } from './pages/CreateEvent';
import { BrowseEventsPage } from './pages/BrowseEvents';
import { ManageEventsPage } from './pages/ManageEvents';
import { AnalyticsPage } from './pages/Analytics';
import { AnnouncementsPage } from './pages/Announcements';
import { SettingsPage } from './pages/Settings';
import { MyEventsPage } from './pages/MyEvents';
import { ConnectionsPage } from './pages/Connections';
import { MessagesPage } from './pages/Messages';
import { HiddenGemsPage } from './pages/HiddenGems';
import { EventParticipantsPage } from './pages/EventParticipants';
import { ProfilePage } from './pages/Profile';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser } = useAuth();
  return firebaseUser ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/browse" element={<BrowseEventsPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardOverview />} />
            <Route path="create-event" element={<CreateEventPage />} />
            <Route path="manage-events" element={<ManageEventsPage />} />
            <Route path="event-participants/:eventId" element={<EventParticipantsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="hidden-gems" element={<HiddenGemsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="browse" element={<BrowseEventsPage />} />
            <Route path="my-events" element={<MyEventsPage />} />
            <Route path="lotus-match" element={<LotUsMatchPage />} />
            <Route path="connections" element={<ConnectionsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

const Placeholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
    <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center">
      <h2 className="text-2xl font-serif text-gray-500">{title[0]}</h2>
    </div>
    <h2 className="text-3xl font-serif">{title}</h2>
    <p className="text-gray-500 max-w-sm">This module is currently being optimized.</p>
  </div>
);

export default App;