import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "በዚህ ጋር - Easy Pickup Directions",
  description: "Share your exact location and landmarks with drivers in Addis Ababa.",
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
        <Analytics />
      </body>
    </html>
  );
}

    </html>
  );
}
