import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { LangProvider } from "./contexts/LangContext.tsx";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { Auth0Provider } from "@auth0/auth0-react";

posthog.init(import.meta.env.VITE_POSTHOG_TOKEN, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  person_profiles: "identified_only",
  capture_pageview: true,
  capture_pageleave: true,
});

createRoot(document.getElementById("root")!).render(
  <Auth0Provider
    domain={import.meta.env.VITE_AUTH0_DOMAIN}
    clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
    authorizationParams={{ redirect_uri: window.location.origin }}
  >
    <PostHogProvider client={posthog}>
      <LangProvider>
        <AppWrapper>
          <App />
        </AppWrapper>
      </LangProvider>
    </PostHogProvider>
  </Auth0Provider>
);
