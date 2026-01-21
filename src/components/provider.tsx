"use client";

import { ThemeProvider } from "next-themes";

import { useIframeSync } from "../hooks/use-iframe-sync";
import ThemeToggle from "./theme-toggle";

const Provider = ({ children }: { children: React.ReactNode }) => {
  useIframeSync();

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <ThemeToggle />
      {children}
    </ThemeProvider>
  );
};

export default Provider;
