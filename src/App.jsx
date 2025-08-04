import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db, provider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState("receita");
  const [data, setData] = useState("");
  const [transacoes, setTransacoes] = useState([]);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [idEdicao, setIdEdicao] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  const [mesSelecionado, setMesSelecionado] = useState("");
  const [anoSelecionado, setAnoSelecionado] = useState("");

  // Novo estado para controle do modal de confirmação de exclusão
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [idExcluir, setIdExcluir] = useState(null);

  function loginComGoogle() {
    signInWithPopup(auth, provider).catch((erro) => {
      alert("Erro ao fazer login: " + erro.message);
    });
  }

  function logout() {
    signOut(auth);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "transacoes"), orderBy("data", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransacoes(dados);
    });
    return () => unsubscribe();
  }, []);

  async function salvar(e) {
    e.preventDefault();
    if (!descricao || !valor || !categoria || !data) {
      alert("Preencha todos os campos");
      return;
    }

    const novaTransacao = {
      descricao,
      valor: parseFloat(valor),
      categoria,
      tipo,
      data,
      uid: usuario.uid,
    };

    if (modoEdicao) {
      await updateDoc(doc(db, "transacoes", idEdicao), novaTransacao);
      setModoEdicao(false);
      setIdEdicao("");
    } else {
      await addDoc(collection(db, "transacoes"), novaTransacao);
    }

    setDescricao("");
    setValor("");
    setCategoria("");
    setTipo("receita");
    setData("");
    setModalAberto(false);
  }

  function confirmarExcluir(id) {
    setIdExcluir(id);
    setModalExcluirAberto(true);
  }

  async function excluir() {
    if (idExcluir) {
      await deleteDoc(doc(db, "transacoes", idExcluir));
      setIdExcluir(null);
      setModalExcluirAberto(false);
    }
  }

  async function editar(transacao) {
    setDescricao(transacao.descricao);
    setValor(transacao.valor);
    setCategoria(transacao.categoria);
    setTipo(transacao.tipo);
    setData(transacao.data);
    setModoEdicao(true);
    setIdEdicao(transacao.id);
    setModalAberto(true);
  }

  const transacoesDoUsuario = transacoes
    .filter((t) => t.uid === usuario?.uid)
    .filter((t) => {
      const dataTransacao = new Date(t.data);
      const mes = dataTransacao.getMonth() + 1;
      const ano = dataTransacao.getFullYear();
      return (
        (!mesSelecionado || Number(mesSelecionado) === mes) &&
        (!anoSelecionado || Number(anoSelecionado) === ano)
      );
    });

  const totalReceitas = transacoesDoUsuario
    .filter((t) => t.tipo === "receita")
    .reduce((soma, t) => soma + t.valor, 0);
  const totalDespesas = transacoesDoUsuario
    .filter((t) => t.tipo === "despesa")
    .reduce((soma, t) => soma + t.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <button
          onClick={loginComGoogle}
          className="bg-blue-700 hover:bg-blue-600 px-6 py-3 rounded shadow cursor-pointer"
        >
          Entrar com Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <div className="max-w-3xl mx-auto p-6">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">💸 Minhas Finanças</h1>
          <div>
            <span className="mr-4">{usuario.displayName}</span>
            <button
              onClick={logout}
              className="text-red-400 hover:text-red-300 cursor-pointer transition-colors duration-200"
            >
              Sair
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
          <div className="bg-green-800 p-4 rounded shadow">
            <h2 className="font-semibold">Receitas</h2>
            <p className="text-lg">R$ {totalReceitas.toFixed(2)}</p>
          </div>
          <div className="bg-red-800 p-4 rounded shadow">
            <h2 className="font-semibold">Despesas</h2>
            <p className="text-lg">R$ {totalDespesas.toFixed(2)}</p>
          </div>
          <div className="bg-blue-800 p-4 rounded shadow">
            <h2 className="font-semibold">Saldo</h2>
            <p className="text-lg">R$ {saldo.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          <select
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="bg-gray-800 text-white border border-gray-700 rounded p-2"
          >
            <option value="">Todos os Meses</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("pt-BR", { month: "long" })}
              </option>
            ))}
          </select>

          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(e.target.value)}
            className="bg-gray-800 text-white border border-gray-700 rounded p-2"
          >
            <option value="">Todos os Anos</option>
            {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(
              (ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              )
            )}
          </select>

          <button
            onClick={() => setModalAberto(true)}
            className="ml-auto bg-green-700 hover:bg-green-600 px-4 py-2 rounded cursor-pointer transition-colors duration-200"
          >
            + Nova Transação
          </button>
        </div>

        <ul className="space-y-3">
          {transacoesDoUsuario.length === 0 && (
            <li className="text-center text-gray-400">
              Nenhuma transação encontrada.
            </li>
          )}
          {transacoesDoUsuario.map((t) => (
            <li
              key={t.id}
              className={`p-4 rounded flex justify-between items-center transition-all duration-300 ${
                t.tipo === "receita"
                  ? "bg-green-900 hover:bg-green-800"
                  : "bg-red-900 hover:bg-red-800"
              }`}
            >
              <div>
                <p className="font-bold">{t.descricao}</p>
                <p className="text-sm text-gray-300">
                  R$ {t.valor.toFixed(2)} | {t.categoria} |{" "}
                  {new Date(t.data).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => editar(t)}
                  className="text-blue-400 hover:text-blue-600 font-semibold cursor-pointer transition-colors duration-200"
                  aria-label={`Editar transação ${t.descricao}`}
                >
                  Editar
                </button>
                <button
                  onClick={() => confirmarExcluir(t.id)}
                  className="text-red-400 hover:text-red-600 font-semibold cursor-pointer transition-colors duration-200"
                  aria-label={`Excluir transação ${t.descricao}`}
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* MODAL DE ADICIONAR / EDITAR */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-30 flex items-center justify-center z-50">
          <form
            onSubmit={salvar}
            className="bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg space-y-4"
          >
            <h2 className="text-xl font-bold mb-2">
              {modoEdicao ? "Editar Transação" : "Nova Transação"}
            </h2>
            <input
              type="text"
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-gray-700 text-white p-2 rounded"
              autoFocus
            />
            <input
              type="number"
              placeholder="Valor"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full bg-gray-700 text-white p-2 rounded"
              step="0.01"
              min="0"
            />
            <input
              type="text"
              placeholder="Categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full bg-gray-700 text-white p-2 rounded"
            />
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full bg-gray-700 text-white p-2 rounded"
            />
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full bg-gray-700 text-white p-2 rounded"
            >
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
            <div className="flex justify-between items-center pt-2">
              <button
                type="submit"
                className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded cursor-pointer transition-colors duration-200"
              >
                {modoEdicao ? "Atualizar" : "Adicionar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalAberto(false);
                  setModoEdicao(false);
                  setDescricao("");
                  setValor("");
                  setCategoria("");
                  setData("");
                  setTipo("receita");
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded cursor-pointer transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {modalExcluirAberto && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full text-center shadow-lg">
            <h3 className="text-lg font-semibold mb-4">
              Confirmar exclusão
            </h3>
            <p className="mb-6">
              Tem certeza que deseja excluir essa transação? Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={excluir}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded transition-colors duration-200"
              >
                Excluir
              </button>
              <button
                onClick={() => setModalExcluirAberto(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded cursor-pointer transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
