import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { InstallBanner } from "@/components/InstallBanner"
import "./globals.css"

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Infinity Command Center",
  description:
    "Plataforma de inteligencia financiera y consultoría estratégica — Toma de decisiones basada en datos en tiempo real.",
  icons: {
    icon: "/icon.svg",
  },
  manifest: "/manifest.json",
  other: {
    "theme-color": "#3b82f6",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className="min-h-full bg-surface-900 text-surface-100 font-sans">
        <QueryProvider>
          <InstallBanner />
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
