import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, User, Settings, Search, MenuIcon } from 'lucide-react';

// Busca usuário do localStorage (ajuste conforme sua lógica)
function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(getUser());
  }, []);

  // Fechar dropdowns quando clicar fora deles
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Botão de menu para dispositivos móveis */}
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <MenuIcon size={20} />
        </button>

        {/* Barra de pesquisa */}
        <div className="hidden md:flex items-center max-w-md w-full relative mx-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Pesquisar..."
            className="pl-10 input bg-slate-100 border-0 focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-3">
          {/* Notificações */}
          <div ref={notificationRef} className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 relative"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 origin-top-right bg-white rounded-lg shadow-lg border border-slate-200 animate-fade-in">
                <div className="p-3 border-b border-slate-200">
                  <h3 className="font-medium">Notificações</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-slate-100 hover:bg-slate-50">
                    <p className="text-sm font-medium">Fatura do cartão Nubank</p>
                    <p className="text-xs text-slate-500">Vence em 3 dias</p>
                  </div>
                  <div className="p-4 border-b border-slate-100 hover:bg-slate-50">
                    <p className="text-sm font-medium">Limite próximo do fim</p>
                    <p className="text-xs text-slate-500">Cartão Itaú está com 80% do limite usado</p>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium">Meta de economia atingida</p>
                    <p className="text-xs text-slate-500">Você atingiu sua meta mensal</p>
                  </div>
                </div>
                <div className="p-2 text-center border-t border-slate-200">
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    Ver todas
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Perfil do usuário */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center"
            >
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-medium overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'Usuário'} className="w-full h-full object-cover" />
                ) : (
                  user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'
                )}
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-lg shadow-lg border border-slate-200 animate-fade-in">
                <div className="p-3 border-b border-slate-200">
                  <p className="font-medium">{user?.displayName || user?.email}</p>
                  <p className="text-sm text-slate-500 truncate">{user?.email}</p>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/configuracoes');
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-slate-100"
                  >
                    <User size={16} className="mr-2 text-slate-500" />
                    Meu Perfil
                  </button>
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/configuracoes');
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-slate-100"
                  >
                    <Settings size={16} className="mr-2 text-slate-500" />
                    Configurações
                  </button>
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-slate-100 text-red-600"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;