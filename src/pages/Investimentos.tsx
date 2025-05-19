import React, { useState } from "react";

const tipos = ["Poupança", "CDB", "Tesouro Direto", "LCI", "LCA"];

const Investimentos: React.FC = () => {
  const [investimentos, setInvestimentos] = useState([
    // Exemplo inicial (mock)
    { id: 1, tipo: "Poupança", nome: "Caixa", valor_aplicado: 1000, rendimento_mensal: 0.5 },
  ]);
  const [form, setForm] = useState({
    tipo: tipos[0],
    nome: "",
    valor_aplicado: "",
    rendimento_mensal: "",
  });
  const [editId, setEditId] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.valor_aplicado || !form.rendimento_mensal) return;
    if (editId) {
      setInvestimentos(investimentos.map(inv =>
        inv.id === editId
          ? { ...inv, ...form, valor_aplicado: Number(form.valor_aplicado), rendimento_mensal: Number(form.rendimento_mensal) }
          : inv
      ));
      setEditId(null);
    } else {
      setInvestimentos([
        ...investimentos,
        {
          id: Date.now(),
          tipo: form.tipo,
          nome: form.nome,
          valor_aplicado: Number(form.valor_aplicado),
          rendimento_mensal: Number(form.rendimento_mensal),
        },
      ]);
    }
    setForm({ tipo: tipos[0], nome: "", valor_aplicado: "", rendimento_mensal: "" });
  };

  const handleEdit = (id: number) => {
    const inv = investimentos.find(i => i.id === id);
    if (inv) {
      setForm({
        tipo: inv.tipo,
        nome: inv.nome,
        valor_aplicado: inv.valor_aplicado.toString(),
        rendimento_mensal: inv.rendimento_mensal.toString(),
      });
      setEditId(id);
    }
  };

  const handleDelete = (id: number) => {
    setInvestimentos(investimentos.filter(i => i.id !== id));
    if (editId === id) setEditId(null);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Investimentos / Poupança</h2>
      <form className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-2" onSubmit={handleSubmit}>
        <select
          name="tipo"
          value={form.tipo}
          onChange={handleChange}
          className="border rounded px-2 py-1"
        >
          {tipos.map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
        <input
          name="nome"
          placeholder="Nome"
          value={form.nome}
          onChange={handleChange}
          className="border rounded px-2 py-1"
          required
        />
        <input
          name="valor_aplicado"
          type="number"
          min={0}
          step="0.01"
          placeholder="Valor aplicado"
          value={form.valor_aplicado}
          onChange={handleChange}
          className="border rounded px-2 py-1"
          required
        />
        <input
          name="rendimento_mensal"
          type="number"
          min={0}
          step="0.01"
          placeholder="Rendimento (%)"
          value={form.rendimento_mensal}
          onChange={handleChange}
          className="border rounded px-2 py-1"
          required
        />
        <button
          type="submit"
          className="col-span-1 md:col-span-4 bg-blue-600 text-white rounded px-4 py-2 mt-2"
        >
          {editId ? "Salvar Edição" : "Adicionar"}
        </button>
      </form>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Tipo</th>
            <th className="p-2">Nome</th>
            <th className="p-2">Valor Aplicado</th>
            <th className="p-2">Rendimento (%)</th>
            <th className="p-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {investimentos.map(inv => (
            <tr key={inv.id} className="border-t">
              <td className="p-2">{inv.tipo}</td>
              <td className="p-2">{inv.nome}</td>
              <td className="p-2">R$ {inv.valor_aplicado.toFixed(2)}</td>
              <td className="p-2">{inv.rendimento_mensal}%</td>
              <td className="p-2 flex gap-2">
                <button
                  className="text-blue-600 underline"
                  onClick={() => handleEdit(inv.id)}
                >
                  Editar
                </button>
                <button
                  className="text-red-600 underline"
                  onClick={() => handleDelete(inv.id)}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
          {investimentos.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center p-4 text-gray-400">Nenhum investimento cadastrado.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Investimentos;
