import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Route guards — kept eager (tiny, needed immediately)
import ProtectedRoute from "./components/auth/ProtectedRoute";
import GuestRoute from "./components/auth/GuestRoute";

// Layout — kept eager (visible on every page)
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import PageWrapper from "./components/layout/PageWrapper";
import ScrollToTop from "./components/layout/ScrollToTop";

// UI providers — kept eager
import { ToastProvider } from "./components/ui/Toast";
import { ProgressProvider } from "./components/ui/ProgressBar";

// High-traffic pages — kept eager (no waterfall on first load)
import HomePage    from "./pages/HomePage";
import JobsPage    from "./pages/listings/JobsPage";
import RoomsPage   from "./pages/listings/RoomsPage";
import EventsPage  from "./pages/listings/EventsPage";

// Everything else — lazy loaded
const FeaturedPage           = lazy(() => import("./pages/FeaturedPage"));
const JobDetailPage          = lazy(() => import("./pages/listings/JobDetailPage"));
const RoomDetailPage         = lazy(() => import("./pages/listings/RoomDetailPage"));
const AnnouncementsPage      = lazy(() => import("./pages/listings/AnnouncementsPage"));
const AnnouncementDetailPage = lazy(() => import("./pages/listings/AnnouncementDetailPage"));
const EventDetailPage        = lazy(() => import("./pages/listings/EventDetailPage"));
const BusinessesPage         = lazy(() => import("./pages/listings/BusinessesPage"));
const BusinessDetailPage     = lazy(() => import("./pages/listings/BusinessDetailPage"));
const RegisterBusinessPage   = lazy(() => import("./pages/listings/RegisterBusinessPage"));
const EditListingPage        = lazy(() => import("./pages/listings/EditListingPage"));
const SearchPage             = lazy(() => import("./pages/SearchPage"));
const PrivacyPage            = lazy(() => import("./pages/PrivacyPage"));
const TermsPage              = lazy(() => import("./pages/TermsPage"));
const ContactPage            = lazy(() => import("./pages/ContactPage"));
const NotFoundPage           = lazy(() => import("./pages/NotFoundPage"));
const PostAdPage             = lazy(() => import("./pages/listings/PostAdPage"));
const MyListingsPage         = lazy(() => import("./pages/listings/MyListingsPage"));
const ProfilePage            = lazy(() => import("./pages/ProfilePage"));
const InboxPage              = lazy(() => import("./pages/InboxPage"));
const ConversationPage       = lazy(() => import("./pages/ConversationPage"));
const SavedSearchesPage      = lazy(() => import("./pages/SavedSearchesPage"));
const PaymentSuccessPage     = lazy(() => import("./pages/payment/PaymentSuccessPage"));
const PaymentCancelPage      = lazy(() => import("./pages/payment/PaymentCancelPage"));
const LoginPage              = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage           = lazy(() => import("./pages/auth/RegisterPage"));
const VerifyEmailPage        = lazy(() => import("./pages/auth/VerifyEmailPage"));
const ForgotPasswordPage     = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage      = lazy(() => import("./pages/auth/ResetPasswordPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function PageFallback() {
  return (
    <div style={{ minHeight: "60vh", background: "#F5F4F0" }} />
  );
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
                    <Suspense fallback={<PageFallback />}>
                      <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/featured" element={<FeaturedPage />} />
                        {/* Jobs */}
                        <Route path="/jobs" element={<JobsPage />} />
                        <Route path="/jobs/listing/:id" element={<JobDetailPage />} />
                        <Route path="/jobs/:id" element={<JobDetailPage />} />
                        {/* Rooms */}
                        <Route path="/rooms" element={<RoomsPage />} />
                        <Route path="/rooms/listing/:id" element={<RoomDetailPage />} />
                        <Route path="/rooms/:id" element={<RoomDetailPage />} />
                        {/* Announcements */}
                        <Route path="/announcements" element={<AnnouncementsPage />} />
                        <Route path="/announcements/listing/:id" element={<AnnouncementDetailPage />} />
                        <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
                        {/* Events */}
                        <Route path="/events" element={<EventsPage />} />
                        <Route path="/events/listing/:id" element={<EventDetailPage />} />
                        <Route path="/events/:id" element={<EventDetailPage />} />
                        {/* Businesses */}
                        <Route path="/businesses" element={<BusinessesPage />} />
                        <Route path="/businesses/:id" element={<BusinessDetailPage />} />
                        {/* Other public */}
                        <Route path="/edit-listing/:id" element={<ProtectedRoute><EditListingPage /></ProtectedRoute>} />
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
                    </Suspense>
                  </PageWrapper>
                </div>
                <Footer />
              </div>
            </ToastProvider>
          </ProgressProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
