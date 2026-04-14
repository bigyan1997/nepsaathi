import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Route guards
import ProtectedRoute from "./components/auth/ProtectedRoute";
import GuestRoute from "./components/auth/GuestRoute";

// Layout
import Navbar from "./components/layout/Navbar";

// Public pages
import HomePage from "./pages/HomePage";
import JobsPage from "./pages/listings/JobsPage";
import RoomsPage from "./pages/listings/RoomsPage";
import JobDetailPage from "./pages/listings/JobDetailPage";
import RoomDetailPage from "./pages/listings/RoomDetailPage";
import AnnouncementsPage from "./pages/listings/AnnouncementsPage";
import AnnouncementDetailPage from "./pages/listings/AnnouncementsPage";
import EventsPage from "./pages/listings/EventsPage";
import EventDetailPage from "./pages/listings/EventDetailPage";
import BusinessesPage from "./pages/listings/BusinessesPage";
import BusinessDetailPage from "./pages/listings/BusinessDetailPage";
import RegisterBusinessPage from "./pages/listings/RegisterBusinessPage";
import NotFoundPage from "./pages/NotFoundPage";

// Public Listing Pages
import PostAdPage from "./pages/listings/PostAdPage";
import MyListingsPage from "./pages/listings/MyListingsPage";
import ProfilePage from "./pages/ProfilePage";

// Auth pages (guest only)
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen" style={{ backgroundColor: "#F5F4F0" }}>
            <Navbar />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/rooms/:id" element={<RoomDetailPage />} />
              <Route path="/jobs/listing/:id" element={<JobDetailPage />} />
              <Route path="/rooms/listing/:id" element={<RoomDetailPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route
                path="/announcements/:id"
                element={<AnnouncementDetailPage />}
              />
              <Route
                path="/announcements/listing/:id"
                element={<AnnouncementDetailPage />}
              />

              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/events/listing/:id" element={<EventDetailPage />} />

              <Route path="/businesses" element={<BusinessesPage />} />
              <Route path="/businesses/:id" element={<BusinessDetailPage />} />

              {/* Guest only routes */}
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <GuestRoute>
                    <RegisterPage />
                  </GuestRoute>
                }
              />

              <Route
                path="/post-ad"
                element={
                  <ProtectedRoute>
                    <PostAdPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/register-business"
                element={
                  <ProtectedRoute>
                    <RegisterBusinessPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-listings"
                element={
                  <ProtectedRoute>
                    <MyListingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* 404 — catches everything else */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
