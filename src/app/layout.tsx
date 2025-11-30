import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ScanEoFacial - Reconocimiento de Emociones',
  description: 'Sistema de reconocimiento facial con análisis de emociones en tiempo real',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
          {children}
        </div>
      </body>
    </html>
  )
}
