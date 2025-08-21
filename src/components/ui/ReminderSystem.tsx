import React, { useState, useEffect } from 'react';
import { Bell, Plus, Edit, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from './Toast';

interface Reminder {
  id: number;
  titulo: string;
  descricao: string;
  data_vencimento: string;
  tipo: 'despesa' | 'receita' | 'fatura' | 'meta';
  ativo: boolean;
  notificado: boolean;
}

interface ReminderSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReminderSystem: React.FC<ReminderSystemProps> = ({ isOpen, onClose }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data_vencimento: '',
    tipo: 'despesa' as 'despesa' | 'receita' | 'fatura' | 'meta',
    ativo: true
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadReminders();
    }
  }, [isOpen]);

  const loadReminders = async () => {
    try {
      const response = await api.get('/lembretes');
      setReminders(response.data);
    } catch (error) {
      console.error('Erro ao carregar lembretes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editId) {
        await api.put(`/lembretes/${editId}`, formData);
        showToast({
          type: 'success',
          title: 'Lembrete atualizado!',
          message: 'O lembrete foi atualizado com sucesso'
        });
      } else {
        await api.post('/lembretes', formData);
        showToast({
          type: 'success',
          title: 'Lembrete criado!',
          message: 'Novo lembrete criado com sucesso'
        });
      }

      setShowForm(false);
      setEditId(null);
      resetForm();
      loadReminders();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro ao salvar lembrete',
        message: error.response?.data?.error || 'Ocorreu um erro inesperado'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditId(reminder.id);
    setFormData({
      titulo: reminder.titulo,
      descricao: reminder.descricao,
      data_vencimento: reminder.data_vencimento.slice(0, 16),
      tipo: reminder.tipo,
      ativo: reminder.ativo
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este lembrete?')) {
      return;
    }

    try {
      await api.delete(`/lembretes/${id}`);
      loadReminders();
      showToast({
        type: 'success',
        title: 'Lembrete excluído!',
        message: 'O lembrete foi excluído com sucesso'
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro ao excluir lembrete',
        message: error.response?.data?.error || 'Ocorreu um erro inesperado'
      });
    }
  };

  const toggleActive = async (id: number, ativo: boolean) => {
    try {
      await api.patch(`/lembretes/${id}`, { ativo });
      loadReminders();
      showToast({
        type: 'success',
        title: ativo ? 'Lembrete ativado!' : 'Lembrete desativado!',
        message: `O lembrete foi ${ativo ? 'ativado' : 'desativado'} com sucesso`
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro ao atualizar lembrete',
        message: error.response?.data?.error || 'Ocorreu um erro inesperado'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      data_vencimento: '',
      tipo: 'despesa',
      ativo: true
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const isOverdue = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'despesa': return 'bg-red-100 text-red-700';
      case 'receita': return 'bg-green-100 text-green-700';
      case 'fatura': return 'bg-blue-100 text-blue-700';
      case 'meta': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-strong max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
            <Bell size={24} />
            Sistema de Lembretes
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 transition-all duration-200"
          >
            <AlertCircle size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Seus Lembretes</h3>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-medium"
            >
              <Plus size={20} />
              Novo Lembrete
            </button>
          </div>

          {showForm && (
            <div className="bg-neutral-50 p-6 rounded-2xl mb-6 border border-neutral-200">
              <h4 className="text-lg font-semibold mb-4">
                {editId ? 'Editar Lembrete' : 'Novo Lembrete'}
              </h4>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Título
                    </label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    >
                      <option value="despesa">Despesa</option>
                      <option value="receita">Receita</option>
                      <option value="fatura">Fatura</option>
                      <option value="meta">Meta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Data e Hora
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.data_vencimento}
                    onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    placeholder="Adicione uma descrição para o lembrete..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditId(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-neutral-700 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-medium disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Salvando...' : editId ? 'Atualizar' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {reminders.map(reminder => (
              <div
                key={reminder.id}
                className={`p-4 rounded-2xl border transition-all duration-200 ${
                  reminder.ativo 
                    ? isOverdue(reminder.data_vencimento)
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-neutral-200 hover:shadow-medium'
                    : 'bg-neutral-50 border-neutral-200 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-neutral-800">{reminder.titulo}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(reminder.tipo)}`}>
                        {reminder.tipo}
                      </span>
                      {isOverdue(reminder.data_vencimento) && reminder.ativo && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Vencido
                        </span>
                      )}
                    </div>
                    
                    {reminder.descricao && (
                      <p className="text-neutral-600 text-sm mb-2">{reminder.descricao}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={16} />
                        {formatDateTime(reminder.data_vencimento)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(reminder.id, !reminder.ativo)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                        reminder.ativo
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {reminder.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                    
                    <button
                      onClick={() => handleEdit(reminder)}
                      className="p-2 text-neutral-400 hover:text-primary-500 rounded-full hover:bg-primary-50 transition-all duration-200"
                    >
                      <Edit size={16} />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(reminder.id)}
                      className="p-2 text-neutral-400 hover:text-accent-500 rounded-full hover:bg-accent-50 transition-all duration-200"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {reminders.length === 0 && (
              <div className="text-center py-12 text-neutral-500">
                <Bell size={48} className="mx-auto mb-2 opacity-50" />
                <p>Nenhum lembrete criado ainda</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-medium"
                >
                  Criar Primeiro Lembrete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderSystem;