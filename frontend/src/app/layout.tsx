import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
    title: "Compi Bonus | Analizador de Gramáticas",
    description: "Frontend académico para analizar gramáticas con parsers LL(1), RD, LR(0), SLR(1), LR(1) y LALR(1).",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
            <body className="min-h-full flex flex-col">
                <Script id="theme-init" strategy="beforeInteractive">
                    {`
                        (function () {
                            try {
                                var storedTheme = window.localStorage.getItem('compi-theme');
                                var theme = storedTheme === 'light' || storedTheme === 'dark'
                                    ? storedTheme
                                    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

                                document.documentElement.dataset.theme = theme;
                            } catch (error) {
                                document.documentElement.dataset.theme = 'light';
                            }
                        })();
                    `}
                </Script>
                {children}
            </body>
        </html>
    );
}
