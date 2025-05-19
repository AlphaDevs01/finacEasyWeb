import React, { useState } from "react";

const Cartoes: React.FC = () => {
  const [cartoes, setCartoes] = useState([
    // Exemplo inicial (mock)
    { id: 1, nome: "Nubank", numero: "1234", limite: 2000, data_fechamento: "10", data_vencimento: "20" },
  ]);
  const [form, setForm] = useState({
    nome: "",
    numero: "",
    limite: "",
    data_fechamento: "",
    data_vencimento: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.numero || !form.limite) return;
    setCartoes([
      ...cartoes,
      {
        id: Date.now(),
        nome: form.nome,
        numero: form.numero,
        limite: Number(form.limite),
        data_fechamento: form.data_fechamento,
        data_vencimento: form.data_vencimento,
      },
    ]);
    setForm({ nome: "", numero: "", limite: "", data_fechamento: "", data_vencimento: "" });
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Cartões</h1>
      <form className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-2" onSubmit={handleSubmit}>
        <input
          name="nome"
          placeholder="Nome"
          value={form.nome}
          onChange={handleChange}
          className="border rounded px-2 py-1"
          required
        />
        <input
          name="numero"
          placeholder="Últimos 4 dígitos"
          value={form.numero}
          onChange={handleChange}
          className="border rounded px-2 py-1"
          maxLength={4}
          required
        />
        <input
          name="limite"
          type="number"
          min={0}
          step="0.01"
          placeholder="Limite"
          value={form.limite}
          onChange={handleChange}
          className="border rounded px-2 py-1"
          required
        />
        <input
          name="data_fechamento"
          type="number"
          min={1}
          max={31}
          placeholder="Dia fechamento"
          value={form.data_fechamento}
          onChange={handleChange}
          className="border rounded px-2 py-1"
        />
        <input
          name="data_vencimento"
          type="number"
          min={1}
          max={31}
          placeholder="Dia vencimento"
          value={form.data_vencimento}
          onChange={handleChange}
          className="border rounded px-2 py-1"
        />
        <button
          type="submit"
          className="col-span-1 md:col-span-5 bg-blue-600 text-white rounded px-4 py-2 mt-2"
        >
          Adicionar
        </button>
      </form>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Nome</th>
            <th className="p-2">Número</th>
            <th className="p-2">Limite</th>
            <th className="p-2">Fechamento</th>
            <th className="p-2">Vencimento</th>
          </tr>
        </thead>
        <tbody>
          {cartoes.map(cartao => (
            <tr key={cartao.id} className="border-t">
              <td className="p-2">{cartao.nome}</td>
              <td className="p-2">{cartao.numero}</td>
              <td className="p-2">R$ {cartao.limite.toFixed(2)}</td>
              <td className="p-2">{cartao.data_fechamento}</td>
              <td className="p-2">{cartao.data_vencimento}</td>
            </tr>
          ))}
          {cartoes.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center p-4 text-gray-400">Nenhum cartão cadastrado.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Cartoes;