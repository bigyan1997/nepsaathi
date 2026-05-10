import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import useAuthStore from "./store/authStore";
import { usePushNotifications } from "./hooks/usePushNotifications";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import GuestRoute from "./components/auth/GuestRoute";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import PageWrapper from "./components/layout/PageWrapper";
import ScrollToTop from "./components/layout/ScrollToTop";

import { ToastProvider } from "./components/ui/Toast";
import { ProgressProvider } from "./components/ui/ProgressBar";
import PWAInstallPrompt from "./components/ui/PWAInstallPrompt";
import FeedbackModal from "./components/ui/FeedbackModal";
import useExitIntent from "./hooks/useExitIntent";

import HomePage              from "./pages/HomePage";
import JobsPage              from "./pages/listings/JobsPage";
import RoomsPage             from "./pages/listings/RoomsPage";
import EventsPage            from "./pages/listings/EventsPage";
import FeaturedPage          from "./pages/FeaturedPage";
import JobDetailPage         from "./pages/listings/JobDetailPage";
import RoomDetailPage        from "./pages/listings/RoomDetailPage";
import NoticesPage           from "./pages/listings/NoticesPage";
import NoticeDetailPage      from "./pages/listings/NoticeDetailPage";
import EventDetailPage       from "./pages/listings/EventDetailPage";
import BusinessesPage        from "./pages/listings/BusinessesPage";
import BusinessDetailPage    from "./pages/listings/BusinessDetailPage";
import RegisterBusinessPage  from "./pages/listings/RegisterBusinessPage";
import EditListingPage       from "./pages/listings/EditListingPage";
import SearchPage            from "./pages/SearchPage";
import PrivacyPage           from "./pages/PrivacyPage";
import TermsPage             from "./pages/TermsPage";
import ContactPage           from "./pages/ContactPage";
import NotFoundPage          from "./pages/NotFoundPage";
import PostAdPage            from "./pages/listings/PostAdPage";
import MyListingsPage        from "./pages/listings/MyListingsPage";
import ProfilePage           from "./pages/ProfilePage";
import InboxPage             from "./pages/InboxPage";
import ConversationPage      from "./pages/ConversationPage";
import SavedSearchesPage     from "./pages/SavedSearchesPage";
import PaymentSuccessPage    from "./pages/payment/PaymentSuccessPage";
import PaymentCancelPage     from "./pages/payment/PaymentCancelPage";
import LoginPage             from "./pages/auth/LoginPage";
import RegisterPage          from "./pages/auth/RegisterPage";
import VerifyEmailPage       from "./pages/auth/VerifyEmailPage";
import ForgotPasswordPage    from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage     from "./pages/auth/ResetPasswordPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});


function PushInit() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  usePushNotifications(isAuthenticated);
  return null;
}

const FEEDBACK_PATHS = ["/jobs", "/rooms", "/events", "/notices", "/businesses", "/search", "/featured"];

function FeedbackTrigger() {
  const location = useLocation();
  const [showFeedback, setShowFeedback] = useState(false);
  const shouldTrack = FEEDBACK_PATHS.some((p) => location.pathname.startsWith(p));
  useExitIntent(shouldTrack ? () => setShowFeedback(true) : () => {});
  if (!showFeedback) return null;
  return <FeedbackModal onClose={() => setShowFeedback(false)} />;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ScrollToTop />
          <ProgressProvider>
            <ToastProvider>
              <div
                style={{
                  backgroundColor: "#F5F4F0",
                  minHeight: "100vh",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Navbar />
                <div style={{ flex: 1 }}>
                  <PageWrapper>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/featured" element={<FeaturedPage />} />
                        {/* Jobs */}
                        <Route path="/jobs" element={<JobsPage />} />
                        <Route path="/jobs/:slug" element={<JobDetailPage />} />
                        {/* Rooms */}
                        <Route path="/rooms" element={<RoomsPage />} />
                        <Route path="/rooms/:slug" element={<RoomDetailPage />} />
                        {/* Announcements */}
                        <Route path="/notices" element={<NoticesPage />} />
                        <Route path="/notices/:slug" element={<NoticeDetailPage />} />
                        {/* Events */}
                        <Route path="/events" element={<EventsPage />} />
                        <Route path="/events/:slug" element={<EventDetailPage />} />
                        {/* Businesses */}
                        <Route path="/businesses" element={<BusinessesPage />} />
                        <Route path="/businesses/:slug" element={<BusinessDetailPage />} />
                        {/* Other public */}
                        <Route path="/edit-listing/:slug" element={<ProtectedRoute><EditListingPage /></ProtectedRoute>} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        {/* Guest only */}
                        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
                        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
                        <Route path="/verify-email" element={<VerifyEmailPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
                        {/* Protected */}
                        <Route path="/post-ad" element={<ProtectedRoute><PostAdPage /></ProtectedRoute>} />
                        <Route path="/register-business" element={<ProtectedRoute><RegisterBusinessPage /></ProtectedRoute>} />
                        <Route path="/my-listings" element={<ProtectedRoute><MyListingsPage /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                        <Route path="/messages" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
                        <Route path="/messages/:id" element={<ProtectedRoute><ConversationPage /></ProtectedRoute>} />
                        <Route path="/saved-searches" element={<ProtectedRoute><SavedSearchesPage /></ProtectedRoute>} />
                        <Route path="/payment/success" element={<PaymentSuccessPage />} />
                        <Route path="/payment/cancel" element={<PaymentCancelPage />} />
                        {/* 404 — must be last */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </PageWrapper>
                </div>
                <Footer />
              </div>
              <PushInit />
              <PWAInstallPrompt />
              <FeedbackTrigger />
            </ToastProvider>
          </ProgressProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
