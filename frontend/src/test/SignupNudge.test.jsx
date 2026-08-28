import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import SignupNudge from "../components/ui/SignupNudge";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../store/authStore", () => ({
  default: vi.fn(),
}));

vi.mock("@react-oauth/google", () => ({
  useGoogleLogin: () => vi.fn(),
}));

vi.mock("../api/auth", () => ({
  googleLogin: vi.fn(),
}));

vi.mock("../hooks/useIsMobile", () => ({
  default: () => false,
}));

import useAuthStore from "../store/authStore";

function renderNudge(path = "/jobs") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SignupNudge />
    </MemoryRouter>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("SignupNudge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    // Cookie consent already given so nudge is allowed to trigger
    localStorage.setItem("nepsaathi_cookie_consent", "accepted");
    useAuthStore.mockReturnValue({ isAuthenticated: false, setAuth: vi.fn() });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not render immediately", () => {
    renderNudge();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("appears after 4 seconds for unauthenticated users", () => {
    renderNudge();
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Join NepSaathi — it's free")).toBeInTheDocument();
  });

  it("does not appear for authenticated users", () => {
    useAuthStore.mockReturnValue({ isAuthenticated: true, setAuth: vi.fn() });
    renderNudge();
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not appear on /login", () => {
    renderNudge("/login");
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not appear on /register", () => {
    renderNudge("/register");
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not appear when cookie consent has not been given", () => {
    localStorage.removeItem("nepsaathi_cookie_consent");
    renderNudge();
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not appear within 7-day dismiss cooldown", () => {
    const recentDismiss = Date.now() - 1000 * 60 * 60; // 1 hour ago
    localStorage.setItem(
      "nepsaathi_signup_nudge",
      JSON.stringify({ dismissedAt: recentDismiss })
    );
    renderNudge();
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("appears again after 7-day cooldown has expired", () => {
    const oldDismiss = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
    localStorage.setItem(
      "nepsaathi_signup_nudge",
      JSON.stringify({ dismissedAt: oldDismiss })
    );
    renderNudge();
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("dismisses when × is clicked and sets localStorage", () => {
    renderNudge();
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    act(() => fireEvent.click(screen.getByLabelText("Dismiss sign up prompt")));

    expect(screen.queryByRole("dialog")).toBeNull();
    const stored = JSON.parse(localStorage.getItem("nepsaathi_signup_nudge"));
    expect(stored.dismissedAt).toBeDefined();
  });

  it("shows Google and email signup options", () => {
    renderNudge();
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    expect(screen.getByText("Sign up with email")).toBeInTheDocument();
  });
});
