import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'Microtuff Solutions — Client Portal',
  description: 'Secure client document, photo & video submission portal.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-navy-900 text-slate-100 antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0f2a52',
              color: '#f8fafc',
              border: '1px solid #f5c54240',
            },
          }}
        />
      </body>
    </html>
  )
}
