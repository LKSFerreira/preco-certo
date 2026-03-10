import React from 'react';
import type { Compra } from '../types';
import { formatarMoeda } from '../services/utilitarios';

interface PropsModalHistoricoCompras {
  compras: Compra[];
  carregando: boolean;
  aoFechar: () => void;
}

function formatarDataCompra(dataIso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(dataIso));
}

const ModalHistoricoCompras: React.FC<PropsModalHistoricoCompras> = ({
  compras,
  carregando,
  aoFechar
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={aoFechar} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92dvh] overflow-hidden animate-slide-up">
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight">Histórico de Compras</h2>
            <p className="text-sm text-emerald-50 opacity-90">
              Suas compras finalizadas ficam disponíveis enquanto o premium estiver ativo.
            </p>
          </div>

          <button
            onClick={aoFechar}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center"
            aria-label="Fechar histórico"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(92dvh-88px)] bg-slate-50">
          {carregando ? (
            <div className="py-14 text-center text-gray-600">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4 mx-auto" />
              <p>Carregando histórico...</p>
            </div>
          ) : compras.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto mb-4 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="w-8 h-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Nenhuma compra registrada</h3>
              <p className="text-sm text-gray-600 mt-1">
                Finalize uma compra para começar a construir seu histórico.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {compras.map((compraAtual) => (
                <section
                  key={compraAtual.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <header className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        Compra de {formatarDataCompra(compraAtual.data)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {compraAtual.itens.length} item(ns) distintos
                      </p>
                    </div>
                    <p className="text-lg font-black text-emerald-700">
                      {formatarMoeda(compraAtual.total)}
                    </p>
                  </header>

                  <ul className="divide-y divide-gray-100">
                    {compraAtual.itens.map((itemAtual) => (
                      <li
                        key={`${compraAtual.id}-${itemAtual.codigo_barras}`}
                        className="px-4 py-3 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {itemAtual.descricao}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {itemAtual.marca || 'Sem marca'} • {itemAtual.tamanho || 'Sem tamanho'}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-500">{itemAtual.quantidade} uni</p>
                          <p className="text-sm font-bold text-gray-800">
                            {formatarMoeda((itemAtual.preco_estimado || 0) * itemAtual.quantidade)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalHistoricoCompras;
