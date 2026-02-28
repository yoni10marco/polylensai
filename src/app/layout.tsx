import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "PolyLens AI | Polymarket Analytics",
    description: "Trade with AI-Powered Alpha. Contextual Chat, Signal Detection, and Real-Time Sentiment.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${inter.className} antialiased bg-background text-foreground min-h-screen selection:bg-primary/30`}
            >
                {children}
            </body>
        </html>
    );
}
