/* @refresh reload */
import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import '../css/app.css';

// Pages
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import EnhancedDemo from './pages/EnhancedDemo';

// Components
import BackgroundManager from './components/BackgroundManager';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
      retryDelay: 1000, // Wait 1 second between retries
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Background Manager - handles Trianglify and custom backgrounds */}
      <BackgroundManager />

      <Router>
        <Route path="/" component={Dashboard} />
        <Route path="/settings" component={Admin} />
        <Route path="/users" component={Admin} />
        <Route path="/qa/enhanced-demo" component={EnhancedDemo} />
      </Router>
    </QueryClientProvider>
  );
}

// Mount Solid app
const rootElement = document.getElementById('app');
if (rootElement) {
  render(() => <App />, rootElement);
}
