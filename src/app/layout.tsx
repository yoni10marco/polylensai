import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import DashboardLayout from "@/components/layout/DashboardLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "PolyLens AI",
    description: "Analytics platform for Polymarket traders",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={inter.className}>
                <ReactQueryProvider>
                    <DashboardLayout>{children}</DashboardLayout>
                </ReactQueryProvider>
            </body>
        </html>
    );
}
