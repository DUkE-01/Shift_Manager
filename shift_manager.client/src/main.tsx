import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import NotificationProvider from "@/components/NotificationProvider";
import "./App.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </React.StrictMode>
);