import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/toast";
import NavBar from "@/components/nav-bar";

export const metadata: Metadata = {
  title: "Book Store — Demo",
  description: "Demo frontend for Book Store API",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AuthProvider>
            <NavBar />
            <main>{children}</main>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}