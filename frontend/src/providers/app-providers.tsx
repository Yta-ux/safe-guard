import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider, useTheme } from './theme-provider';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

function ToastWithTheme() {
  const { isDark } = useTheme();

  return (
    <Toaster
      theme={isDark ? 'dark' : 'light'}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: 'Manrope, sans-serif',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '13px',
          fontWeight: 600,
        },
      }}
    />
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ToastWithTheme />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
