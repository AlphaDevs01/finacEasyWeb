import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from './Toast';

interface Notification {
  id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  data_criacao: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notificacoes');
      setNotifications(response.data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      showToast({
        type: 'error',
        title: 'Erro ao carregar notificações',
        message: 'Não foi possível carregar as notificações'
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notificacoes/${id}/lida`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, lida: true } : notif
        )
      );
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível marcar como lida'
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notificacoes/marcar-todas-lidas');
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, lida: true }))
      );
      showToast({
        type: 'success',
        title: 'Sucesso!',
        message: 'Todas as notificações foram marcadas como lidas'
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível marcar todas como lidas'
      });
    }
  };

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'despesas_vencidas':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'limite_cartao':
        return <AlertCircle className="text-yellow-500" size={20} />;
      case 'meta_excedida':
        return <AlertCircle className="text-orange-500" size={20} />;
      default:
        return <Bell className="text-blue-500" size={20} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-strong max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-neutral-800">Notificações</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
              >
                Marcar todas como lidas
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 transition-all duration-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Bell size={48} className="mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-neutral-50 transition-colors ${
                    !notification.lida ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.tipo)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className={`text-sm font-medium ${
                            !notification.lida ? 'text-neutral-900' : 'text-neutral-700'
                          }`}>
                            {notification.titulo}
                          </h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            {notification.mensagem}
                          </p>
                          <p className="text-xs text-neutral-400 mt-2 flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(notification.data_criacao)}
                          </p>
                        </div>
                        
                        {!notification.lida && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-neutral-400 hover:text-primary-500 rounded-full hover:bg-primary-50 transition-all duration-200"
                            title="Marcar como lida"
                          >
                            <Check size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;