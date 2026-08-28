import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import { ToastProvider, useToast } from "../components/ui/Toast";

// Helper component that triggers toasts via addToast
function ToastTrigger({ message, type }) {
  const { addToast } = useToast();
  return (
    <button onClick={() => addToast(message, type)}>
      Show toast
    </button>
  );
}

function setup(message = "Hello", type = "success") {
  return render(
    <ToastProvider>
      <ToastTrigger message={message} type={type} />
    </ToastProvider>
  );
}

describe("Toast / useToast", () => {
  it("renders a success toast when addToast is called", async () => {
    setup("Listing saved!", "success");
    await userEvent.click(screen.getByText("Show toast"));
    expect(screen.getByText("Listing saved!")).toBeInTheDocument();
  });

  it("renders an error toast", async () => {
    setup("Something went wrong", "error");
    await userEvent.click(screen.getByText("Show toast"));
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders multiple toasts", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger message="First" type="success" />
      </ToastProvider>
    );
    await user.click(screen.getByText("Show toast"));
    await user.click(screen.getByText("Show toast"));
    expect(screen.getAllByText("First")).toHaveLength(2);
  });

  it("exposes addToast — NOT showToast — from useToast()", () => {
    function Checker() {
      const ctx = useToast();
      return (
        <div>
          <span data-testid="has-add">{typeof ctx.addToast}</span>
          <span data-testid="has-show">{typeof ctx.showToast}</span>
        </div>
      );
    }
    render(
      <ToastProvider>
        <Checker />
      </ToastProvider>
    );
    expect(screen.getByTestId("has-add").textContent).toBe("function");
    expect(screen.getByTestId("has-show").textContent).toBe("undefined");
  });
});
