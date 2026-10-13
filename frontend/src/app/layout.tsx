import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veris — Evidence over claims",
  description: "Analyze public GitHub repository evidence and build a trustworthy proof-of-skill profile.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
