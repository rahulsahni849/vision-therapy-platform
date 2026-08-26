import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/ThemeProvider';
import { apiClient } from './lib/api';
import { useAuthStore } from './stores/auth.store';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

// Sync ApiClient with persisted auth state on reload
const { accessToken } = useAuthStore.getState();
if (accessToken) {
  apiClient.setAccessToken(accessToken);
}

// Keep ApiClient in sync whenever store changes
useAuthStore.subscribe((state) => {
  apiClient.setAccessToken(state.accessToken);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
