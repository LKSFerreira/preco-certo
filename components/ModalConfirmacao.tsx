import React from 'react';

interface PropsModalConfirmacao {
  titulo: string;
  mensagem: React.ReactNode;
  textoBotaoConfirmar?: string;
  textoBotaoCancelar?: string;
  corBotaoConfirmar?: 'vermelho' | 'verde' | 'azul';
  icone?: 'alerta' | 'lixeira' | 'check';
  aoConfirmar: () => void;
  aoCancelar: () => void;
}

function renderizarIconeConfirmacao(icone: PropsModalConfirmacao['icone']) {
  if (icone === 'lixeira') {
    return (
      <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4 mx-auto border border-red-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.11 0 0 0-7.5 0"
          />
        </svg>
      </div>
    );
  }

  if (icone === 'check') {
    return (
      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 mx-auto border border-emerald-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4 mx-auto border border-amber-100">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z"
        />
      </svg>
    </div>
  );
}

const ModalConfirmacao: React.FC<PropsModalConfirmacao> = ({
  titulo,
  mensagem,
  textoBotaoConfirmar = 'Confirmar',
  textoBotaoCancelar = 'Cancelar',
  corBotaoConfirmar = 'vermelho',
  icone = 'alerta',
  aoConfirmar,
  aoCancelar
}) => {
  const coresBotao = {
    vermelho: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
    verde: 'bg-verde-700 hover:bg-verde-700 active:bg-verde-800',
    azul: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={aoCancelar} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">
        <div className="px-5 pt-5 pb-3 text-center">
          {renderizarIconeConfirmacao(icone)}
          <h2 className="text-xl font-bold text-gray-800 text-center">{titulo}</h2>
        </div>

        <div className="px-5 pb-5">
          <div className="text-gray-700 text-center leading-relaxed">{mensagem}</div>
        </div>

        <div className="flex border-t border-gray-100">
          <button
            onClick={aoCancelar}
            className="flex-1 py-4 font-semibold text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            {textoBotaoCancelar}
          </button>
          <button
            onClick={aoConfirmar}
            className={`flex-1 py-4 font-bold text-white transition-colors ${coresBotao[corBotaoConfirmar]}`}
          >
            {textoBotaoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacao;
