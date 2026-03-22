import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CODE-SWITCH®↗KUZI",
  description: "MAKING INTER-SYSTEM MOVEMENT LEGIBLE",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
