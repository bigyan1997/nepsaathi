import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import api from "./utils/axios";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import useAuthStore from "./store/authStore";
import { usePushNotifications } from "./hooks/usePushNotifications";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import GuestRoute from "./components/auth/GuestRoute";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import BottomNav from "./components/layout/BottomNav";
import PageWrapper from "./components/layout/PageWrapper";
import ScrollToTop from "./components/layout/ScrollToTop";

import { ToastProvider } from "./components/ui/Toast";
import { ProgressProvider } from "./components/ui/ProgressBar";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import PWAInstallPrompt from "./components/ui/PWAInstallPrompt";
import FeedbackModal from "./components/ui/FeedbackModal";
import CookieConsent from "./components/ui/CookieConsent";
import IdleTimeoutModal from "./components/ui/IdleTimeoutModal";
import useIdleTimeout from "./hooks/useIdleTimeout";
import UserProfilePage from "./pages/UserProfilePage";
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
import AdminPanelPage        from "./pages/AdminPanelPage";
import ForumPage             from "./pages/forum/ForumPage";
import ForumPostPage         from "./pages/forum/ForumPostPage";
import CreatePostPage        from "./pages/forum/CreatePostPage";
import RemittancePage        from "./pages/RemittancePage";
import NewListingsPage       from "./pages/NewListingsPage";
import NewToAustraliaPage   from "./pages/NewToAustraliaPage";
import LocationPage          from "./pages/listings/LocationPage";
import LookingForPage        from "./pages/LookingForPage";
import ServicesPage          from "./pages/ServicesPage";
import PointsPage            from "./pages/PointsPage";
import VisaHubPage           from "./pages/VisaHubPage";
import WhatsAppGroupsPage    from "./pages/WhatsAppGroupsPage";
import BankingPage           from "./pages/BankingPage";
import HealthPage            from "./pages/HealthPage";
import TaxPage               from "./pages/TaxPage";
import WorkRightsPage        from "./pages/WorkRightsPage";
import ChildcarePage         from "./pages/ChildcarePage";
import LoginPage             from "./pages/auth/LoginPage";
import RegisterPage          from "./pages/auth/RegisterPage";
import VerifyEmailPage       from "./pages/auth/VerifyEmailPage";
import ForgotPasswordPage    from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage     from "./pages/auth/ResetPasswordPage";

function RedirectAnnouncementSlug() {
  const { slug } = useParams ? useParams() : {};
  return <Navigate to={`/notices/${slug}`} replace />;
}

function SuperUserRoute({ children }) {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated || !user?.is_staff || !user?.is_superuser) {
    return <NotFoundPage />;
  }
  return children;
}

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

const IDLE_WARNING_MS = 30 * 60 * 1000;  // 30 min idle → show modal
const IDLE_LOGOUT_MS  =  3 * 60 * 1000;  //  3 min to respond → auto-logout

function IdleGuard() {
  const { isAuthenticated, logout } = useAuthStore();
  const [show, setShow] = useState(false);

  const handleLogout = useCallback(() => {
    setShow(false);
    logout();
  }, [logout]);

  const { stay } = useIdleTimeout({
    warningAfter: IDLE_WARNING_MS,
    logoutAfter:  IDLE_LOGOUT_MS,
    onWarning: useCallback(() => setShow(true), []),
    onTimeout: handleLogout,
  });

  if (!isAuthenticated || !show) return null;
  return (
    <IdleTimeoutModal
      secondsTotal={IDLE_LOGOUT_MS / 1000}
      onStay={() => { setShow(false); stay(); }}
      onLogout={handleLogout}
    />
  );
}

const FEEDBACK_PATHS = ["/jobs", "/rooms", "/events", "/notices", "/businesses", "/search", "/featured"];

const noop = () => {};

function FeedbackTrigger() {
  const location = useLocation();
  const [showFeedback, setShowFeedback] = useState(false);
  const shouldTrack = FEEDBACK_PATHS.some((p) => location.pathname.startsWith(p));
  const trigger = useCallback(() => setShowFeedback(true), []);
  useExitIntent(shouldTrack ? trigger : noop);
  if (!showFeedback) return null;
  return <FeedbackModal onClose={() => setShowFeedback(false)} />;
}

function App() {
  useEffect(() => {
    const el = document.getElementById("splash");
    if (!el) return;
    el.style.opacity = "0";
    const t = setTimeout(() => el.remove(), 400);
    return () => clearTimeout(t);
  }, []);

  // On mount: ensure a valid access token exists, then re-fetch the full user
  // object to restore is_staff / is_superuser (stripped from localStorage persistence).
  useEffect(() => {
    const { isAuthenticated, logout, updateUser } = useAuthStore.getState();
    if (!isAuthenticated) return;

    const fetchUser = () =>
      api.get("/api/auth/user/").then((res) => updateUser(res.data)).catch(() => {});

    if (sessionStorage.getItem("nepsaathi_access_token")) {
      fetchUser();
      return;
    }

    // New tab: no sessionStorage token — refresh first, then fetch user
    axios
      .post(
        `${import.meta.env.VITE_API_URL}/api/auth/token/refresh/`,
        {},
        { withCredentials: true },
      )
      .then((res) => {
        sessionStorage.setItem("nepsaathi_access_token", res.data.access);
        fetchUser();
      })
      .catch(() => logout());
  }, []);

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
                  <ErrorBoundary>
                  <PageWrapper>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/featured" element={<FeaturedPage />} />
                        {/* Jobs */}
                        <Route path="/jobs" element={<JobsPage />} />
                        <Route path="/jobs/in/:location" element={<LocationPage listingType="job" />} />
                        <Route path="/jobs/:slug" element={<JobDetailPage />} />
                        {/* Rooms */}
                        <Route path="/rooms" element={<RoomsPage />} />
                        <Route path="/rooms/in/:location" element={<LocationPage listingType="room" />} />
                        <Route path="/rooms/:slug" element={<RoomDetailPage />} />
                        {/* Announcements — old /announcements path redirects to /notices */}
                        <Route path="/announcements" element={<Navigate to="/notices" replace />} />
                        <Route path="/announcements/:slug" element={<RedirectAnnouncementSlug />} />
                        <Route path="/notices" element={<NoticesPage />} />
                        <Route path="/notices/in/:location" element={<LocationPage listingType="notice" />} />
                        <Route path="/notices/:slug" element={<NoticeDetailPage />} />
                        {/* Events */}
                        <Route path="/events" element={<EventsPage />} />
                        <Route path="/events/in/:location" element={<LocationPage listingType="event" />} />
                        <Route path="/events/:slug" element={<EventDetailPage />} />
                        {/* Businesses */}
                        <Route path="/businesses" element={<BusinessesPage />} />
                        <Route path="/businesses/in/:location" element={<LocationPage listingType="business" />} />
                        <Route path="/businesses/:slug" element={<BusinessDetailPage />} />
                        {/* Community (forum) — /community redirects to /forum */}
                        <Route path="/community" element={<Navigate to="/forum" replace />} />
                        <Route path="/forum" element={<ForumPage />} />
                        <Route path="/forum/new" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
                        <Route path="/forum/:slug" element={<ForumPostPage />} />
                        {/* New listings */}
                        <Route path="/new-listings" element={<NewListingsPage />} />
                        {/* Send Money */}
                        <Route path="/send-money" element={<RemittancePage />} />
                        <Route path="/new-to-australia" element={<NewToAustraliaPage />} />
                        <Route path="/looking-for" element={<LookingForPage />} />
                        <Route path="/services" element={<ServicesPage />} />
                        <Route path="/points" element={<PointsPage />} />
                        <Route path="/visa" element={<VisaHubPage />} />
                        <Route path="/whatsapp-groups" element={<WhatsAppGroupsPage />} />
                        {/* Info pages */}
                        <Route path="/banking" element={<BankingPage />} />
                        <Route path="/health" element={<HealthPage />} />
                        <Route path="/tax" element={<TaxPage />} />
                        <Route path="/work-rights" element={<WorkRightsPage />} />
                        <Route path="/childcare" element={<ChildcarePage />} />
                        {/* Other public */}
                        <Route path="/edit-listing/:slug" element={<ProtectedRoute><EditListingPage /></ProtectedRoute>} />
                        <Route path="/users/:id" element={<UserProfilePage />} />
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
                        {/* Internal panel — superuser only, renders 404 for everyone else */}
                        <Route path="/panel" element={<SuperUserRoute><AdminPanelPage /></SuperUserRoute>} />
                        {/* 404 — must be last */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </PageWrapper>
                  </ErrorBoundary>
                </div>
                <Footer />
              </div>
              <PushInit />
              <PWAInstallPrompt />
              <FeedbackTrigger />
              <IdleGuard />
              <CookieConsent />
              <BottomNav />
            </ToastProvider>
          </ProgressProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
