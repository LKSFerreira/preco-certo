import React from 'react';

interface PropsBotaoConfirmaComShimmer {
  aoClicar?: () => void;
  texto: string;
  icone?: string;
  iconeSvg?: React.ReactNode;
  compacto?: boolean;
  disabled?: boolean;
  tipo?: 'button' | 'submit' | 'reset';
  botaoRef?: React.Ref<HTMLButtonElement>;
}

const BotaoConfirmaComShimmer: React.FC<PropsBotaoConfirmaComShimmer> = ({
  aoClicar,
  texto,
  icone,
  iconeSvg,
  compacto = false,
  disabled = false,
  tipo = 'button',
  botaoRef,
}) => {
  return (
    <>
      <button
        ref={botaoRef}
        onClick={aoClicar}
        type={tipo}
        disabled={disabled}
        className={`relative overflow-hidden w-full bg-green-600 text-white font-bold shadow-[0_8px_30px_rgba(22,163,74,0.4)] transition-all flex items-center justify-center ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-700 active:scale-95 animate-botao-pulinho-sync'
        } ${
          compacto ? 'py-3.5 text-lg rounded-xl gap-2' : 'py-5 text-xl rounded-2xl gap-3'
        }`}
      >
        {!disabled && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] animate-shimmer" />
          </div>
        )}
        <span className="relative z-10">{texto}</span>
        {iconeSvg ? (
          <span className={`relative z-10 ${compacto ? 'w-5 h-5' : 'w-6 h-6'}`}>{iconeSvg}</span>
        ) : icone ? (
          <span className={`relative z-10 ${compacto ? 'text-xl' : 'text-2xl'}`}>{icone}</span>
        ) : null}
      </button>

      <style>{`
        /* Ciclo total: 3s
           - Shimmer passa no primeiro 1s
           - Pulinho acontece 500ms depois (em ~1.5s)
        */
        @keyframes shimmer {
          0% { transform: translateX(-150%); }
          33.333% { transform: translateX(250%); }
          100% { transform: translateX(250%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite ease-in-out;
        }

        @keyframes botao-pulinho-sync {
          0%, 49%, 100% { transform: scale(1); }
          53% { transform: scale(1.04); }
          57% { transform: scale(0.985); }
          62% { transform: scale(1); }
        }
        .animate-botao-pulinho-sync {
          animation: botao-pulinho-sync 3s infinite ease-in-out;
        }
      `}</style>
    </>
  );
};

export default BotaoConfirmaComShimmer;
