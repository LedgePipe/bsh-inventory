import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BSH Inventory - I\'m Helping!',
  description: 'Bradshaw Social House Inventory Management - Ralph Wiggum Edition',
  manifest: '/manifest.json',
  themeColor: '#475569',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'white',
              border: '2px solid #e0e0e0',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  )
}
