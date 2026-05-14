"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className:
              "!bg-card !text-foreground !border !border-border !shadow-lg !rounded-lg",
            duration: 3000,
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
