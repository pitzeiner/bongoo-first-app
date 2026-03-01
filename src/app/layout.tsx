import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "BonGoo",
  description: "Cloudbasierte Bonierungslösung für Vereinsfeste",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
