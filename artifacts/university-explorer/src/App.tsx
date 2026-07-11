import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { LanguageProvider } from '@/contexts/language';
import { AuthProvider } from '@/contexts/auth';
import { Navbar } from '@/components/Navbar';
import Home from '@/pages/Home';
import Explore from '@/pages/Explore';
import UniversityDetail from '@/pages/University';
import ProgramDetail from '@/pages/Program';
import Services from '@/pages/Services';
import LoginPage from '@/pages/Login';

import '@/i18n'; // Initialize i18n

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function Router() {
  return (
    <>
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/explore" component={Explore} />
        <Route path="/university" component={UniversityDetail} />
        <Route path="/program" component={ProgramDetail} />
        <Route path="/services" component={Services} />
        <Route path="/login" component={LoginPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
