import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { LangProvider } from "./contexts/LangContext.tsx";

createRoot(document.getElementById("root")!).render(
  <LangProvider>
    <AppWrapper>
      <App />
    </AppWrapper>
  </LangProvider>
);
