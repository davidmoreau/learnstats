import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Stats Textbook",
  description: "No-login, interactive stats lessons with MDX and React demos."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <nav style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <Link href="/">Home</Link>
            <Link href="/modules">Modules</Link>
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}
