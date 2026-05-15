import { useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const useNotifications = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      initializeNotifications();
      checkPendingNotifications();
    }
  }, [isAuthenticated]);

  const initializeNotifications = async () => {
    await notificationService.initialize();
    await notificationService.requestPermission();
  };

  const checkPendingNotifications = async () => {
    try {
      // Verificar lembretes próximos
      const remindersResponse = await api.get('/lembretes/proximos?dias=1');
      const reminders = remindersResponse.data;

      for (const reminder of reminders) {
        if (!reminder.notificado) {
          await notificationService.showNotification(reminder.titulo, {
            body: reminder.descricao,
            tag: `reminder-${reminder.id}`
          });

          // Marcar como notificado
          await api.patch(`/lembretes/${reminder.id}`, { notificado: true });
        }
      }

      // Verificar despesas vencendo
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const despesasResponse = await api.get('/despesas', {
        params: {
          status: 'pendente',
          data_vencimento_ate: tomorrow.toISOString().split('T')[0]
        }
      });

      const despesasVencendo = despesasResponse.data.filter((despesa: any) => {
        if (!despesa.data_vencimento) return false;
        const vencimento = new Date(despesa.data_vencimento);
        return vencimento <= tomorrow && vencimento >= today;
      });

      for (const despesa of despesasVencendo) {
        await notificationService.notifyBillDue(
          despesa.descricao,
          despesa.valor,
          new Date(despesa.data_vencimento)
        );
      }

      // Verificar metas excedidas
      const metasResponse = await api.get('/metas');
      const metas = metasResponse.data;

      for (const meta of metas) {
        const percentual = meta.valor_limite > 0 ? (meta.valor_gasto / meta.valor_limite) * 100 : 0;
        
        if (percentual >= 100) {
          await notificationService.notifyBudgetExceeded(
            meta.categoria,
            meta.valor_gasto,
            meta.valor_limite
          );
        }
      }

    } catch (error) {
      console.error('Erro ao verificar notificações:', error);
    }
  };

  return {
    showNotification: notificationService.showNotification.bind(notificationService),
    scheduleNotification: notificationService.scheduleNotification.bind(notificationService),
    checkPendingNotifications
  };
};