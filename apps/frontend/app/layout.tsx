import { ourFileRouter } from "@/app/api/uploadthing/core";
import { AuthProvider } from "@/contexts/AuthContext";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { extractRouterConfig } from "uploadthing/server";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Mentra",
    description: "Mentra monorepo app",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
