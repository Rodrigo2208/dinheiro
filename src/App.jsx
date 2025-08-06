import { useEffect, useState } from "react";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import app from "./firebase";

const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [dados, setDados] = useState([]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroAno, setFiltroAno] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  function loginComGoogle() {
    signInWithPopup(auth, provider)
      .then((result) => {
        setUsuario(result.user);
      })
      .catch((error) => {
        console.error("Erro ao logar:", error);
      });
  }

  function logout() {
    signOut(auth).then(() => setUsuario(null));
  }

  function trocarConta() {
    logout();
    setTimeout(() => {
      loginComGoogle();
    }, 1000); // Pequeno atraso evita problemas com o popup
  }

  function abrirModalParaAdicionar() {
    setDescricao("");
    setValor("");
    setEditandoId(null);
    setModalAberto(true);
  }

  function abrirModalParaEditar(dado) {
    setDescricao(dado.descricao);
    setValor(dado.valor);
    setEditandoId(dado.id);
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    if (!descricao || !valor) return;

    const dadosRef = collection(db, "financeiro");

    const dado = {
      descricao,
      valor,
      uid: usuario.uid,
      criadoEm: new Date(),
    };

    try {
      if (editandoId) {
        const docRef = doc(db, "financeiro", editandoId);
        await updateDoc(docRef, dado);
      } else {
        await addDoc(dadosRef, dado);
      }
      setModalAberto(false);
      setDescricao("");
      setValor("");
      setEditandoId(null);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  }

  async function excluir(id) {
    await deleteDoc(doc(db, "financeiro", id));
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!usuario) return;

    const dadosRef = collection(db, "financeiro");

    const filtros = [
      where("uid", "==", usuario.uid),
      orderBy("criadoEm", "desc"),
    ];

    const q = query(dadosRef, ...filtros);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDados(lista);
    });

    return () => unsubscribe();
  }, [usuario]);

  const dadosFiltrados = dados.filter((dado) => {
    const data = dado.criadoEm?.toDate?.();
    if (!data) return false;

    const mes = data.getMonth() + 1;
    const ano = data.getFullYear();

    const filtroMesOk = filtroMes ? mes === parseInt(filtroMes) : true;
    const filtroAnoOk = filtroAno ? ano === parseInt(filtroAno) : true;

    return filtroMesOk && filtroAnoOk;
  });

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <button
          onClick={loginComGoogle}
          className="bg-blue-600 px-6 py-3 rounded-xl text-lg hover:bg-blue-700 transition"
        >
          Entrar com Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-start p-6">
      <div className="w-full max-w-xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Minhas Finanças</h1>
          <div className="space-x-2">
            <button
              onClick={abrirModalParaAdicionar}
              className="bg-green-600 px-3 py-1 rounded hover:bg-green-700 transition"
            >
              Nova Transação
            </button>
            <button
              onClick={trocarConta}
              className="bg-yellow-600 px-3 py-1 rounded hover:bg-yellow-700 transition"
            >
              Alterar Conta
            </button>
            <button
              onClick={logout}
              className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition"
            >
              Sair
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="bg-gray-800 p-2 rounded"
          >
            <option value="">Mês</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
              <option key={mes} value={mes}>
                {mes.toString().padStart(2, "0")}
              </option>
            ))}
          </select>
          <select
            value={filtroAno}
            onChange={(e) => setFiltroAno(e.target.value)}
            className="bg-gray-800 p-2 rounded"
          >
            <option value="">Ano</option>
            {["2023", "2024", "2025"].map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </div>

        <ul className="space-y-3">
          {dadosFiltrados.map((dado) => (
            <li
              key={dado.id}
              className="bg-gray-800 p-4 rounded flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{dado.descricao}</p>
                <p className="text-sm text-gray-400">R$ {dado.valor}</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => abrirModalParaEditar(dado)}
                  className="bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
                >
                  Editar
                </button>
                <button
                  onClick={() => excluir(dado.id)}
                  className="bg-red-600 px-2 py-1 rounded hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <form
            onSubmit={salvar}
            className="bg-gray-800 p-6 rounded-lg w-full max-w-sm"
          >
            <h2 className="text-xl font-bold mb-4">
              {editandoId ? "Editar Transação" : "Nova Transação"}
            </h2>
            <input
              type="text"
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full p-2 mb-3 rounded bg-gray-700 text-white"
            />
            <input
              type="number"
              placeholder="Valor"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full p-2 mb-3 rounded bg-gray-700 text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-green-600 rounded hover:bg-green-700"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
