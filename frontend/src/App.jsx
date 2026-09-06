import { useState, useCallback, useEffect, lazy, Suspense } from "react";
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
import SignupNudge from "./components/ui/SignupNudge";
import IdleTimeoutModal from "./components/ui/IdleTimeoutModal";
import useIdleTimeout from "./hooks/useIdleTimeout";
import useExitIntent from "./hooks/useExitIntent";
import NotFoundPage from "./pages/NotFoundPage";
// HomePage is eager — it's the landing page and must render immediately without
// a Suspense delay, which would cause CLS and a blank-flash on initial load.
import HomePage from "./pages/HomePage";

// All other pages are lazy-loaded — each is a separate JS chunk fetched on demand
const JobsPage             = lazy(() => import("./pages/listings/JobsPage"));
const RoomsPage            = lazy(() => import("./pages/listings/RoomsPage"));
const EventsPage           = lazy(() => import("./pages/listings/EventsPage"));
const FeaturedPage         = lazy(() => import("./pages/FeaturedPage"));
const JobDetailPage        = lazy(() => import("./pages/listings/JobDetailPage"));
const RoomDetailPage       = lazy(() => import("./pages/listings/RoomDetailPage"));
const NoticesPage          = lazy(() => import("./pages/listings/NoticesPage"));
const NoticeDetailPage     = lazy(() => import("./pages/listings/NoticeDetailPage"));
const EventDetailPage      = lazy(() => import("./pages/listings/EventDetailPage"));
const BusinessesPage       = lazy(() => import("./pages/listings/BusinessesPage"));
const BusinessDetailPage   = lazy(() => import("./pages/listings/BusinessDetailPage"));
const RegisterBusinessPage = lazy(() => import("./pages/listings/RegisterBusinessPage"));
const EditListingPage      = lazy(() => import("./pages/listings/EditListingPage"));
const SearchPage           = lazy(() => import("./pages/SearchPage"));
const PrivacyPage          = lazy(() => import("./pages/PrivacyPage"));
const TermsPage            = lazy(() => import("./pages/TermsPage"));
const ContactPage          = lazy(() => import("./pages/ContactPage"));
const PostAdPage           = lazy(() => import("./pages/listings/PostAdPage"));
const MyListingsPage       = lazy(() => import("./pages/listings/MyListingsPage"));
const ProfilePage          = lazy(() => import("./pages/ProfilePage"));
const UserProfilePage      = lazy(() => import("./pages/UserProfilePage"));
const InboxPage            = lazy(() => import("./pages/InboxPage"));
const ConversationPage     = lazy(() => import("./pages/ConversationPage"));
const SavedSearchesPage    = lazy(() => import("./pages/SavedSearchesPage"));
const PaymentSuccessPage   = lazy(() => import("./pages/payment/PaymentSuccessPage"));
const PaymentCancelPage    = lazy(() => import("./pages/payment/PaymentCancelPage"));
const AdminPanelPage       = lazy(() => import("./pages/AdminPanelPage"));
const ForumPage            = lazy(() => import("./pages/forum/ForumPage"));
const ForumPostPage        = lazy(() => import("./pages/forum/ForumPostPage"));
const CreatePostPage       = lazy(() => import("./pages/forum/CreatePostPage"));
const RemittancePage       = lazy(() => import("./pages/RemittancePage"));
const NewListingsPage      = lazy(() => import("./pages/NewListingsPage"));
const NewToAustraliaPage   = lazy(() => import("./pages/NewToAustraliaPage"));
const LocationPage         = lazy(() => import("./pages/listings/LocationPage"));
const ServicesPage         = lazy(() => import("./pages/ServicesPage"));
const VisaHubPage          = lazy(() => import("./pages/VisaHubPage"));
const WhatsAppGroupsPage   = lazy(() => import("./pages/WhatsAppGroupsPage"));
const GuidesPage           = lazy(() => import("./pages/GuidesPage"));
const LoginPage            = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage         = lazy(() => import("./pages/auth/RegisterPage"));
const VerifyEmailPage      = lazy(() => import("./pages/auth/VerifyEmailPage"));
const ForgotPasswordPage   = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage    = lazy(() => import("./pages/auth/ResetPasswordPage"));

function RedirectAnnouncementSlug() {
  const { slug } = useParams ? useParams() : {};
  return <Navigate to={`/notices/${slug}`} replace />;
}

// Resets ErrorBoundary on every route change so a lazy-load failure on one
// page doesn't persist to the next page.
function RouteErrorBoundary({ children }) {
  const { pathname } = useLocation();
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
}

function SuperUserRoute({ children }) {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <NotFoundPage />;
  // is_admin is undefined while user profile is still loading
  if (user?.is_admin === undefined) return null;
  if (!user.is_admin) return <NotFoundPage />;
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

  // Prefetch top pages after user interaction — not on load, to avoid blocking
  // the main thread during Lighthouse's measurement window.
  useEffect(() => {
    const prefetch = () => {
      import("./pages/listings/JobsPage");
      import("./pages/listings/RoomsPage");
      import("./pages/listings/EventsPage");
      import("./pages/listings/NoticesPage");
      import("./pages/listings/BusinessesPage");
      import("./pages/forum/ForumPage");
    };
    // Only trigger on first user interaction (click/touch/key), not on page load.
    // This keeps TBT clean during the initial load measurement window.
    const onInteraction = () => {
      window.removeEventListener("click", onInteraction);
      window.removeEventListener("touchstart", onInteraction);
      window.removeEventListener("keydown", onInteraction);
      if ("requestIdleCallback" in window) {
        requestIdleCallback(prefetch);
      } else {
        setTimeout(prefetch, 200);
      }
    };
    window.addEventListener("click", onInteraction, { passive: true });
    window.addEventListener("touchstart", onInteraction, { passive: true });
    window.addEventListener("keydown", onInteraction, { passive: true });
    return () => {
      window.removeEventListener("click", onInteraction);
      window.removeEventListener("touchstart", onInteraction);
      window.removeEventListener("keydown", onInteraction);
    };
  }, []);

  // On mount: ensure a valid access token exists, then re-fetch the full user
  // object to restore is_staff / is_superuser (stripped from localStorage persistence).
  useEffect(() => {
    const { isAuthenticated, logout, updateUser } = useAuthStore.getState();
    if (!isAuthenticated) return;

    const fetchUser = () =>
      api.get("/api/auth/user/").then((res) => updateUser(res.data)).catch(() => {});

    const storedToken =
      sessionStorage.getItem("nepsaathi_access_token") ||
      localStorage.getItem("nepsaathi_access_token");
    if (storedToken) {
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
                  <RouteErrorBoundary>
                  <PageWrapper>
                    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
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
                        <Route path="/looking-for" element={<Navigate to="/forum?category=looking_for" replace />} />
                        <Route path="/services" element={<ServicesPage />} />
                        <Route path="/visa" element={<VisaHubPage />} />
                        <Route path="/whatsapp-groups" element={<WhatsAppGroupsPage />} />
                        {/* Settlement guides — consolidated */}
                        <Route path="/guides" element={<Navigate to="/guides/banking" replace />} />
                        <Route path="/guides/:topic" element={<GuidesPage />} />
                        {/* Old individual guide URLs → redirect */}
                        <Route path="/banking" element={<Navigate to="/guides/banking" replace />} />
                        <Route path="/health" element={<Navigate to="/guides/health" replace />} />
                        <Route path="/tax" element={<Navigate to="/guides/tax" replace />} />
                        <Route path="/work-rights" element={<Navigate to="/guides/work-rights" replace />} />
                        <Route path="/childcare" element={<Navigate to="/guides/childcare" replace />} />
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
                        <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
                        <Route path="/payment/cancel" element={<PaymentCancelPage />} />
                        {/* Internal panel — superuser only, renders 404 for everyone else */}
                        <Route path="/panel" element={<SuperUserRoute><AdminPanelPage /></SuperUserRoute>} />
                        {/* 404 — must be last */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                    </Suspense>
                  </PageWrapper>
                  </RouteErrorBoundary>
                </div>
                <Footer />
              </div>
              <PushInit />
              <PWAInstallPrompt />
              <FeedbackTrigger />
              <IdleGuard />
              <CookieConsent />
              <BottomNav />
              <SignupNudge />
            </ToastProvider>
          </ProgressProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
