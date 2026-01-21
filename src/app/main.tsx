import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/assets/styles/index.css";
import App from "@/app/App.tsx";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";

// Global error handler for unhandled errors
window.addEventListener("error", (event) => {
  console.error("Unhandled error:", event.error);
  // Error will be caught by ErrorBoundary
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  // Prevent default browser behavior
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
