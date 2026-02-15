import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fleet",
  description: "Ephemeral. Private. Gone in 30 minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${playfair.variable} font-sans antialiased`}>
        <TooltipProvider>
          {children}
          <Toaster position="bottom-center" />
        </TooltipProvider>
      </body>
    </html>
  );
}
