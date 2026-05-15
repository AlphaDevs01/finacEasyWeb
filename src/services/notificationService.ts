export class NotificationService {
  private static instance: NotificationService;
  private registration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready;
        console.log('Service Worker ready for notifications');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      vibrate: [200, 100, 200],
      tag: 'finance-notification',
      renotify: true,
      ...options
    };

    if (this.registration) {
      await this.registration.showNotification(title, defaultOptions);
    } else {
      new Notification(title, defaultOptions);
    }
  }

  async scheduleNotification(title: string, body: string, delay: number): Promise<void> {
    setTimeout(() => {
      this.showNotification(title, { body });
    }, delay);
  }

  // Notificações específicas do sistema financeiro
  async notifyBillDue(description: string, amount: number, dueDate: Date): Promise<void> {
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    await this.showNotification('Conta a Vencer', {
      body: `${description} - ${formatter.format(amount)} vence em ${dueDate.toLocaleDateString('pt-BR')}`,
      icon: '/android-chrome-192x192.png',
      actions: [
        { action: 'pay', title: 'Marcar como Paga' },
        { action: 'remind', title: 'Lembrar Depois' }
      ]
    });
  }

  async notifyBudgetExceeded(category: string, spent: number, limit: number): Promise<void> {
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    const percentage = (spent / limit) * 100;

    await this.showNotification('Meta de Gastos Excedida', {
      body: `Categoria ${category}: ${formatter.format(spent)} de ${formatter.format(limit)} (${percentage.toFixed(1)}%)`,
      icon: '/android-chrome-192x192.png',
      tag: `budget-${category}`,
      actions: [
        { action: 'view', title: 'Ver Detalhes' },
        { action: 'adjust', title: 'Ajustar Meta' }
      ]
    });
  }

  async notifyGoalAchieved(description: string): Promise<void> {
    await this.showNotification('Meta Alcançada! 🎉', {
      body: description,
      icon: '/android-chrome-192x192.png',
      tag: 'goal-achieved'
    });
  }
}

export const notificationService = NotificationService.getInstance();