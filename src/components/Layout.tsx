import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { 
  LayoutDashboard, 
  CreditCard, 
  BarChart4, 
  DollarSign, 
  TrendingUp, 
  Upload, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { configuracoes } = useFinance();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  
  useEffect(() => {
    if (configuracoes) {
      setTheme(configuracoes.tema === 'escuro' ? 'dark' : 'light');
    }
  }, [configuracoes]);
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/cartoes', label: 'Cartões', icon: <CreditCard size={20} /> },
    { path: '/transacoes', label: 'Receitas/Despesas', icon: <DollarSign size={20} /> },
    { path: '/investimentos', label: 'Investimentos', icon: <TrendingUp size={20} /> },
    { path: '/relatorios', label: 'Relatórios', icon: <BarChart4 size={20} /> },
    { path: '/importacao', label: 'Importar CSV', icon: <Upload size={20} /> },
    { path: '/configuracoes', label: 'Configurações', icon: <Settings size={20} /> }
  ];
  
  const isActive = (path: string) => location.pathname === path;
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark:bg-gray-900 dark:text-white' : 'bg-gray-100 text-gray-800'}`}>
      {/* Mobile header */}
      <div className="lg:hidden bg-blue-600 text-white p-4 flex justify-between items-center">
        <button 
          className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-white"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
        <h1 className="font-bold text-xl">Finance App</h1>
        <div className="w-6"></div> {/* Placeholder for balance */}
      </div>
      
      {/* Sidebar - Desktop */}
      <aside className={`fixed top-0 left-0 z-40 h-screen transition-transform bg-blue-700 text-white w-64 hidden lg:block`}>
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-blue-600">
            <h1 className="text-2xl font-bold">Finance App</h1>
            <p className="text-sm opacity-80 mt-1">{user?.nome}</p>
          </div>
          
          <nav className="p-4 flex-grow">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.path);
                    }}
                    className={`flex items-center p-3 rounded-lg transition-all ${
                      isActive(item.path)
                        ? 'bg-blue-800 text-white font-medium'
                        : 'hover:bg-blue-600'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                    {isActive(item.path) && (
                      <ChevronRight className="ml-auto" size={16} />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-blue-600">
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-3 text-white rounded-lg hover:bg-blue-600 transition-all"
            >
              <LogOut size={20} />
              <span className="ml-3">Sair</span>
            </button>
          </div>
        </div>
      </aside>
      
      {/* Sidebar - Mobile */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
        onClick={closeSidebar}
      />
      
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-blue-700 text-white transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:hidden`}
      >
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-blue-600 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">Finance App</h1>
              <p className="text-sm opacity-80 mt-1">{user?.nome}</p>
            </div>
            <button 
              className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-white"
              onClick={closeSidebar}
            >
              <X size={24} />
            </button>
          </div>
          
          <nav className="p-4 flex-grow">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.path);
                      closeSidebar();
                    }}
                    className={`flex items-center p-3 rounded-lg transition-all ${
                      isActive(item.path)
                        ? 'bg-blue-800 text-white font-medium'
                        : 'hover:bg-blue-600'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                    {isActive(item.path) && (
                      <ChevronRight className="ml-auto" size={16} />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-blue-600">
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-3 text-white rounded-lg hover:bg-blue-600 transition-all"
            >
              <LogOut size={20} />
              <span className="ml-3">Sair</span>
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="lg:ml-64 min-h-screen">
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;