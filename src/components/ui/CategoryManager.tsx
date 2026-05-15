import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Save, X } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from './Toast';

interface Category {
  id: number;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
  icone: string;
  ativo: boolean;
}

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryChange: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  isOpen,
  onClose,
  onCategoryChange
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'despesa' as 'receita' | 'despesa',
    cor: '#3B82F6',
    icone: '💰',
    ativo: true
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const cores = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const icones = [
    '💰', '🏠', '🚗', '🍔', '🎬', '💊', '📚', '✈️', '👕', '⚡',
    '📱', '🎮', '🏋️', '🎵', '🛒', '💳', '🎯', '🔧', '🌟', '📊'
  ];

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categorias');
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editId) {
        await api.put(`/categorias/${editId}`, formData);
        showToast({
          type: 'success',
          title: 'Categoria atualizada!',
          message: 'A categoria foi atualizada com sucesso'
        });
      } else {
        await api.post('/categorias', formData);
        showToast({
          type: 'success',
          title: 'Categoria criada!',
          message: 'Nova categoria criada com sucesso'
        });
      }

      setShowForm(false);
      setEditId(null);
      resetForm();
      loadCategories();
      onCategoryChange();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro ao salvar categoria',
        message: error.response?.data?.error || 'Ocorreu um erro inesperado'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditId(category.id);
    setFormData({
      nome: category.nome,
      tipo: category.tipo,
      cor: category.cor,
      icone: category.icone,
      ativo: category.ativo
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    try {
      await api.delete(`/categorias/${id}`);
      loadCategories();
      onCategoryChange();
      showToast({
        type: 'success',
        title: 'Categoria excluída!',
        message: 'A categoria foi excluída com sucesso'
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro ao excluir categoria',
        message: error.response?.data?.error || 'Ocorreu um erro inesperado'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'despesa',
      cor: '#3B82F6',
      icone: '💰',
      ativo: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-strong max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-800">Gerenciar Categorias</h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 transition-all duration-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Suas Categorias</h3>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-medium"
            >
              <Plus size={20} />
              Nova Categoria
            </button>
          </div>

          {showForm && (
            <div className="bg-neutral-50 p-6 rounded-2xl mb-6 border border-neutral-200">
              <h4 className="text-lg font-semibold mb-4">
                {editId ? 'Editar Categoria' : 'Nova Categoria'}
              </h4>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Nome da Categoria
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'receita' | 'despesa' })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    >
                      <option value="despesa">Despesa</option>
                      <option value="receita">Receita</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Cor
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {cores.map(cor => (
                      <button
                        key={cor}
                        type="button"
                        onClick={() => setFormData({ ...formData, cor })}
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                          formData.cor === cor ? 'border-neutral-800 scale-110' : 'border-neutral-300'
                        }`}
                        style={{ backgroundColor: cor }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Ícone
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {icones.map(icone => (
                      <button
                        key={icone}
                        type="button"
                        onClick={() => setFormData({ ...formData, icone })}
                        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-lg transition-all duration-200 ${
                          formData.icone === icone ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 hover:border-neutral-400'
                        }`}
                      >
                        {icone}
                      </button>
                    ))}
                  </div>
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
                    <Save size={20} />
                    {loading ? 'Salvando...' : editId ? 'Atualizar' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-lg font-semibold mb-3 text-accent-600">Despesas</h4>
              <div className="space-y-2">
                {categories.filter(cat => cat.tipo === 'despesa').map(category => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-neutral-200 hover:shadow-medium transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: category.cor }}
                      >
                        {category.icone}
                      </div>
                      <span className="font-medium">{category.nome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-neutral-400 hover:text-primary-500 rounded-full hover:bg-primary-50 transition-all duration-200"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-neutral-400 hover:text-accent-500 rounded-full hover:bg-accent-50 transition-all duration-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3 text-primary-600">Receitas</h4>
              <div className="space-y-2">
                {categories.filter(cat => cat.tipo === 'receita').map(category => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-neutral-200 hover:shadow-medium transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: category.cor }}
                      >
                        {category.icone}
                      </div>
                      <span className="font-medium">{category.nome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-neutral-400 hover:text-primary-500 rounded-full hover:bg-primary-50 transition-all duration-200"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-neutral-400 hover:text-accent-500 rounded-full hover:bg-accent-50 transition-all duration-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;