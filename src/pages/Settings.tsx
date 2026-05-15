import { useState, useEffect } from 'react';
import { Bell, CreditCard, User, Shield, Palette, Globe } from 'lucide-react';

// Busca usuário do localStorage (ajuste conforme sua lógica)
function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

const Settings = () => {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    setUser(getUser());
  }, []);

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: <User size={20} /> },
    { id: 'notifications', label: 'Notificações', icon: <Bell size={20} /> },
    { id: 'cards', label: 'Cartões', icon: <CreditCard size={20} /> },
    { id: 'security', label: 'Segurança', icon: <Shield size={20} /> },
    { id: 'appearance', label: 'Aparência', icon: <Palette size={20} /> },
    { id: 'language', label: 'Idioma', icon: <Globe size={20} /> },
  ];

  return (
    <div className="animate-fade-in">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-slate-500">Gerencie suas preferências</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de navegação */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <div className="flex items-center p-2 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-medium overflow-hidden mr-3">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'Usuário'} className="w-full h-full object-cover" />
                ) : (
                  user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'
                )}
              </div>
              <div>
                <p className="font-medium">{user?.displayName || 'Usuário'}</p>
                <p className="text-sm text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>

            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="lg:col-span-3">
          <div className="card">
            {/* Perfil */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <h2 className="text-lg font-medium mb-4">Informações do Perfil</h2>
                <form className="space-y-4">
                  <div>
                    <label htmlFor="name" className="label">Nome completo</label>
                    <input
                      type="text"
                      id="name"
                      className="input"
                      defaultValue={user?.displayName || ''}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="label">E-mail</label>
                    <input
                      type="email"
                      id="email"
                      className="input"
                      defaultValue={user?.email || ''}
                      disabled
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Salvar alterações
                  </button>
                </form>
              </div>
            )}

            {/* Notificações */}
            {activeTab === 'notifications' && (
              <div className="p-6">
                <h2 className="text-lg font-medium mb-4">Preferências de Notificação</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Vencimento de faturas</p>
                      <p className="text-sm text-slate-500">Receba alertas quando uma fatura estiver próxima do vencimento</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-900"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Limite do cartão</p>
                      <p className="text-sm text-slate-500">Receba alertas quando o limite estiver próximo de ser atingido</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-900"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Relatórios mensais</p>
                      <p className="text-sm text-slate-500">Receba um resumo mensal das suas finanças</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-900"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Cartões */}
            {activeTab === 'cards' && (
              <div className="p-6">
                <h2 className="text-lg font-medium mb-4">Configurações dos Cartões</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Ordem de exibição</label>
                    <select className="input">
                      <option>Por nome</option>
                      <option>Por limite disponível</option>
                      <option>Por data de vencimento</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Alertas de limite</label>
                    <select className="input">
                      <option>80% do limite</option>
                      <option>85% do limite</option>
                      <option>90% do limite</option>
                      <option>95% do limite</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Segurança */}
            {activeTab === 'security' && (
              <div className="p-6">
                <h2 className="text-lg font-medium mb-4">Segurança da Conta</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="current-password" className="label">Senha atual</label>
                    <input type="password" id="current-password" className="input" />
                  </div>
                  <div>
                    <label htmlFor="new-password" className="label">Nova senha</label>
                    <input type="password" id="new-password" className="input" />
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="label">Confirmar nova senha</label>
                    <input type="password" id="confirm-password" className="input" />
                  </div>
                  <button className="btn btn-primary">Alterar senha</button>
                </div>
              </div>
            )}

            {/* Aparência */}
            {activeTab === 'appearance' && (
              <div className="p-6">
                <h2 className="text-lg font-medium mb-4">Personalização</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Tema</label>
                    <select className="input">
                      <option>Claro</option>
                      <option>Escuro</option>
                      <option>Sistema</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Densidade</label>
                    <select className="input">
                      <option>Confortável</option>
                      <option>Compacto</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Idioma */}
            {activeTab === 'language' && (
              <div className="p-6">
                <h2 className="text-lg font-medium mb-4">Preferências de Idioma</h2>
                <div>
                  <label className="label">Idioma do sistema</label>
                  <select className="input">
                    <option>Português (Brasil)</option>
                    <option>English (US)</option>
                    <option>Español</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;