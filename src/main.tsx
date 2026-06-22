import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { LangProvider } from "./contexts/LangContext.tsx";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

posthog.init(import.meta.env.VITE_POSTHOG_TOKEN, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  person_profiles: "identified_only",
  capture_pageview: true,
  capture_pageleave: true,
});

createRoot(document.getElementById("root")!).render(
  <PostHogProvider client={posthog}>
    <LangProvider>
      <AppWrapper>
        <App />
      </AppWrapper>
    </LangProvider>
  </PostHogProvider>
);
