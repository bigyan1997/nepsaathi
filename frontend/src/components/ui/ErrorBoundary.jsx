import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            fontFamily: "Inter, sans-serif",
            color: "#26215C",
          }}
        >
          <p style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
            Something went wrong.
          </p>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "24px" }}>
            Try refreshing the page, or{" "}
            <a href="/" style={{ color: "#534AB7" }}>
              go back home
            </a>
            .
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              background: "#534AB7",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 24px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
