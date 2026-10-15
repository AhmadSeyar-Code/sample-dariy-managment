import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { api } from './api/axios';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Suppliers from './pages/Suppliers';
import Expenses from './pages/Expenses';
import Sales from './pages/Sales';
import Products from './pages/Products';
import Settings from './pages/Settings';

function App() {
  const [dairyName, setDairyName] = useState('لبنیات افغان');
  const [logoPath, setLogoPath] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('dairy-auth') === 'true');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('dairy-theme') === 'dark');

  const updateAppSettings = (settings) => {
    setDairyName(settings?.dairy_name || 'لبنیات افغان');
    setLogoPath(settings?.logo_path || '');
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
    localStorage.setItem('dairy-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        updateAppSettings(data);
      } catch (error) {
        console.error('App settings load failed:', error);
      }
    };

    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    localStorage.setItem('dairy-auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('dairy-auth');
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      {isAuthenticated ? (
        <div dir="rtl" lang="fa" className="min-h-screen bg-[#f5f7f5] text-slate-800">
          <div className="mx-auto flex min-h-screen max-w-[1920px] flex-col lg:flex-row">
            <Sidebar dairyName={dairyName} logoPath={logoPath} onLogout={handleLogout} />
            <main className="min-w-0 flex-1">
              <Header isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode((dark) => !dark)} />
              <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/sales" element={<Sales />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/settings" element={<Settings onSettingsUpdated={updateAppSettings} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
