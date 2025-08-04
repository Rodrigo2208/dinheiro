import { useState } from "react";

export default function ModalTransacao({ onSalvar, onClose }) {
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("receita");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [data, setData] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!descricao || !valor || !categoria || !data) {
      alert("Preencha todos os campos!");
      return;
    }

    const novaTransacao = {
      descricao,
      tipo,
      valor: parseFloat(valor),
      categoria,
      data,
    };

    onSalvar(novaTransacao);
    onClose(); // fecha o modal
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
        <h2 className="text-xl font-semibold mb-4">Nova Transação</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Descrição"
            className="w-full border p-2 rounded"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
          <select
            className="w-full border p-2 rounded"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
          </select>
          <input
            type="number"
            placeholder="Valor"
            className="w-full border p-2 rounded"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <input
            type="text"
            placeholder="Categoria"
            className="w-full border p-2 rounded"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          />
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
          <div className="flex justify-between mt-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
