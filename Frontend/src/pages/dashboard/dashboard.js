import React from "react";
import { createRoot } from "react-dom/client";
import Dashboard from "./Dashboard.jsx";
import { ClerkProvider } from "@clerk/chrome-extension";

// ensure root exists
const rootEl = document.getElementById("root");

if (!rootEl) {
  console.error("Dashboard root element root missing");
} else {
  const root = createRoot(rootEl);

  root.render(
    <ClerkProvider
      publishableKey={process.env.CLERK_PUBLISHABLE_KEY}
      navigate={(to) => {
        // chrome extensions use runtime URL navigation not normal SPA routing
        window.location.href = chrome.runtime.getURL(to);
      }}
    >
      <Dashboard />
    </ClerkProvider>
  );
}
