import { BrowserRouter, Routes, Route, Outlet } from 'react-router';
import { TopNavbar } from '@/components/app-layout/top-navbar';
import { Footer } from '@/components/app-layout/footer';
import ReportPage from '@/pages/report';
import ResultPage from '@/pages/result';
import DashboardPage from '@/pages/dashboard';

function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <TopNavbar />
      <Outlet />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<ReportPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/result/:id" element={<ResultPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
