import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICTrecht Academy – Webinar",
  description: "Webinar community platform van ICTrecht Academy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
