"use client"
import { useIframeSync } from "../hooks/use-iframe-sync";

const Provider = ({ children }: { children: React.ReactNode }) => {
  useIframeSync();

  return children;
};

export default Provider;
