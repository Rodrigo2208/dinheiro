import React, { useEffect, useState } from "react";
import { db } from "./firebase"; // ajuste o caminho se necessário
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "./AuthProvider"; // ajuste conforme seu context/provider de autenticação

const Transacoes = () => {
  const { user } = useAuth(); // precisa estar autenticado
  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "transacoes"),
      where("uid", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransacoes(lista);
      setCarregando(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (carregando) {
    return <p className="text-center text-gray-500">Carregando...</p>;
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Suas Transações</h2>
      {transacoes.length === 0 ? (
        <p className="text-center text-gray-600">Nenhuma transação encontrada.</p>
      ) : (
        <ul className="space-y-2">
          {transacoes.map((t) => (
            <li
              key={t.id}
              className={`flex justify-between items-center p-3 rounded-lg shadow ${
                t.tipo === "receita" ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <div>
                <p className="font-medium">{t.descricao}</p>
                <p className="text-sm text-gray-600">{t.categoria}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  R$ {parseFloat(t.valor).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(t.data).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Transacoes;
