import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import DashboardLayout from "@/components/layout/DashboardLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "PolyLens AI",
    description: "Analytics platform for Polymarket traders",
};

export default function AuthDashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className={inter.className}>
            <ReactQueryProvider>
                <DashboardLayout>{children}</DashboardLayout>
            </ReactQueryProvider>
        </div>
    );
}
