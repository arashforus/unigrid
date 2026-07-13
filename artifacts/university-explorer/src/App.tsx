import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { LanguageProvider } from '@/contexts/language';
import { AuthProvider } from '@/contexts/auth';
import { Navbar } from '@/components/Navbar';
import Home from '@/pages/Home';
import Explore from '@/pages/Explore';
import UniversityDetail from '@/pages/University';
import ProgramDetail from '@/pages/Program';
import Services from '@/pages/Services';
import LoginPage from '@/pages/Login';
import About from '@/pages/About';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import Faq from '@/pages/Faq';
import { AdminLayout } from '@/admin/AdminLayout';
import AdminDashboardPage from '@/admin/pages/Dashboard';
import AdminUsersPage from '@/admin/pages/Users';
import AdminUniversitiesPage from '@/admin/pages/Universities';
import AdminCoursesPage from '@/admin/pages/Courses';
import AdminStatisticsPage from '@/admin/pages/Statistics';
import AdminTasksPage from '@/admin/pages/Tasks';
import AdminSettingsPage from '@/admin/pages/Settings';

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
  const [location] = useLocation();
  const isAdmin = location.startsWith('/admin');

  return (
    <>
      {!isAdmin && <Navbar />}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/explore" component={Explore} />
        <Route path="/university" component={UniversityDetail} />
        <Route path="/program" component={ProgramDetail} />
        <Route path="/services" component={Services} />
        <Route path="/login" component={LoginPage} />
        <Route path="/about" component={About} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/faq" component={Faq} />
        <Route path="/admin" component={() => <AdminLayout><AdminDashboardPage /></AdminLayout>} />
        <Route path="/admin/users" component={() => <AdminLayout><AdminUsersPage /></AdminLayout>} />
        <Route path="/admin/universities" component={() => <AdminLayout><AdminUniversitiesPage /></AdminLayout>} />
        <Route path="/admin/courses" component={() => <AdminLayout><AdminCoursesPage /></AdminLayout>} />
        <Route path="/admin/statistics" component={() => <AdminLayout><AdminStatisticsPage /></AdminLayout>} />
        <Route path="/admin/tasks" component={() => <AdminLayout><AdminTasksPage /></AdminLayout>} />
        <Route path="/admin/settings" component={() => <AdminLayout><AdminSettingsPage /></AdminLayout>} />
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
