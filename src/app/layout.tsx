import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
	title: "PMM Connect",
	description: "Komunitas PMM Connect: berbagi cerita dan terhubung dengan teman-teman Anda.",
	icons: { icon: "/logo-pmm.png" },
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
			<body className="antialiased">{children}</body>
		</html>
	);
}
