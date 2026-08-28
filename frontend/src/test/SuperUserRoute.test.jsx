import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";

// ── Inline SuperUserRoute (same logic as App.jsx) ───────────────────────────
vi.mock("../store/authStore", () => ({ default: vi.fn() }));
import useAuthStore from "../store/authStore";

function NotFoundPage() { return <div>Not Found</div>; }
function AdminPanel()   { return <div>Admin Panel</div>; }

function SuperUserRoute({ children }) {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <NotFoundPage />;
  if (user?.is_staff === undefined) return null;
  if (!user.is_staff || !user.is_superuser) return <NotFoundPage />;
  return children;
}

function renderRoute(authState) {
  useAuthStore.mockReturnValue(authState);
  render(
    <MemoryRouter initialEntries={["/panel"]}>
      <Routes>
        <Route path="/panel" element={<SuperUserRoute><AdminPanel /></SuperUserRoute>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("SuperUserRoute", () => {
  it("renders NotFoundPage for unauthenticated users", () => {
    renderRoute({ isAuthenticated: false, user: null });
    expect(screen.getByText("Not Found")).toBeInTheDocument();
    expect(screen.queryByText("Admin Panel")).toBeNull();
  });

  it("renders null (blank) while is_staff is still loading (undefined)", () => {
    renderRoute({ isAuthenticated: true, user: { is_staff: undefined, is_superuser: undefined } });
    expect(screen.queryByText("Not Found")).toBeNull();
    expect(screen.queryByText("Admin Panel")).toBeNull();
  });

  it("renders NotFoundPage for a regular authenticated user", () => {
    renderRoute({ isAuthenticated: true, user: { is_staff: false, is_superuser: false } });
    expect(screen.getByText("Not Found")).toBeInTheDocument();
  });

  it("renders NotFoundPage for staff who is not superuser", () => {
    renderRoute({ isAuthenticated: true, user: { is_staff: true, is_superuser: false } });
    expect(screen.getByText("Not Found")).toBeInTheDocument();
  });

  it("renders AdminPanel for a real superuser", () => {
    renderRoute({ isAuthenticated: true, user: { is_staff: true, is_superuser: true } });
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
    expect(screen.queryByText("Not Found")).toBeNull();
  });
});
