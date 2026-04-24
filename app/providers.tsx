'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1 },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1C1C1C',
            color: '#F5F5F5',
            border: '1px solid #333',
            borderRadius: '2px',
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#00FF88', secondary: '#0A0A0A' } },
          error:   { iconTheme: { primary: '#FF3B3B', secondary: '#0A0A0A' } },
        }}
      />
    </QueryClientProvider>
  )
}
