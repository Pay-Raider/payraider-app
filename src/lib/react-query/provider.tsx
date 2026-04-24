"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactQueryLogger } from './logger';

// Create a client
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Time in milliseconds that data remains fresh
        staleTime: 5 * 60 * 1000, // 5 minutes
        
        // Time in milliseconds that inactive queries will be garbage collected
        gcTime: 10 * 60 * 1000, // 10 minutes
        
        // Number of times a failed query should be retried
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error && typeof error === 'object' && 'status' in error) {
            const status = (error as any).status;
            if (status >= 400 && status < 500) {
              return false;
            }
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        
        // Delay between retries (exponential backoff)
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Whether to refetch on window focus
        refetchOnWindowFocus: false,
        
        // Whether to refetch on reconnect
        refetchOnReconnect: true,
        
        // Whether to refetch on interval
        refetchInterval: false,
        
        // Enable error logging
        throwOnError: false,
      },
      mutations: {
        // Retry mutations up to 1 time
        retry: 1,
        
        // Delay between retries
        retryDelay: 1000,
      },
    },
  });
}

interface ReactQueryProviderProps {
  children: React.ReactNode;
  client?: QueryClient;
}

export function ReactQueryProvider({ children, client }: ReactQueryProviderProps) {
  const queryClient = client || createQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
      <ReactQueryLogger />
    </QueryClientProvider>
  );
}

// Export a singleton instance for easy access
export const queryClient = createQueryClient();
