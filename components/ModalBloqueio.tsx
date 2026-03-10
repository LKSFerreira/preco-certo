import React from 'react';

interface PropsModalBloqueio {
  titulo: string;
  mensagem: string;
  textoBotaoPrincipal?: string;
  textoBotaoSecundario?: string;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}

const ModalBloqueio: React.FC<PropsModalBloqueio> = ({
  titulo,
  mensagem,
  textoBotaoPrincipal = 'Ver premium',
  textoBotaoSecundario = 'Agora não',
  aoConfirmar,
  aoCancelar
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={aoCancelar} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">
        <div className="px-5 pt-5 pb-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4 mx-auto">
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

          <h2 className="text-xl font-bold text-gray-800 text-center">{titulo}</h2>
        </div>

        <div className="px-5 pb-5">
          <p className="text-gray-700 text-center leading-relaxed">{mensagem}</p>
        </div>

        <div className="flex border-t border-gray-100">
          <button
            onClick={aoCancelar}
            className="flex-1 py-4 font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            {textoBotaoSecundario}
          </button>
          <button
            onClick={aoConfirmar}
            className="flex-1 py-4 font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            {textoBotaoPrincipal}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalBloqueio;
