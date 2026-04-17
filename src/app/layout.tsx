import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "በዚህ ጋር - Easy Pickup Directions",
  description: "Share your exact location and landmarks with drivers in Addis Ababa.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="grid-overlay"></div>
        <div className="content-wrapper">
          {children}
        </div>
      </body>
    </html>
  );
}
