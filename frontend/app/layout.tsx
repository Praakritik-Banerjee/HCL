import "./globals.css";
import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { LearnerProvider } from "@/context/LearnerContext";

export const metadata: Metadata = {
  title: "PadhaiMate — Personalized Adaptive Learning Platform",
  description: "An adaptive learning platform with knowledge graphs, study kits, mastery tracking, and deadline-driven exam roadmaps.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-warm-100 flex min-h-screen">
        <LearnerProvider>
          <Navigation />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </LearnerProvider>
      </body>
    </html>
  );
}
