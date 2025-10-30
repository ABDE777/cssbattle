import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";

// Initialize theme with auto-detection
const getTimeBasedTheme = (): 'light' | 'dark' => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? 'light' : 'dark';
};

const themePreference = (localStorage.getItem('theme-preference') || 'auto') as 'light' | 'dark' | 'auto';
const initialTheme = themePreference === 'auto' ? getTimeBasedTheme() : themePreference;

if (initialTheme === 'light') {
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.add('light');
} else {
  document.documentElement.classList.add('dark');
  document.documentElement.classList.remove('light');
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
);