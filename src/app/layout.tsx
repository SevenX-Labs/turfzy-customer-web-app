import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Turfzy | Book your game",
  description: "Discover and book premium sports turfs.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
