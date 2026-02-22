import React, { useState, useEffect } from 'react';

// Atualizado para v8 para aplicar a sincronização da animação do botão com o loop principal
const CHAVE_TUTORIAL_VISTO = 'sem_susto_tutorial_v8';

interface PropsModalTutorial {
  aoFechar: () => void;
}

/**
 * Tutorial visual de primeiro acesso (Tela Única).
 * Foco em ensinar o utilizador a aproximar a câmara do código de barras retangular.
 */
export const ModalTutorial: React.FC<PropsModalTutorial> = ({ aoFechar }) => {
  const finalizarTutorial = () => {
    localStorage.setItem(CHAVE_TUTORIAL_VISTO, 'true');
    aoFechar();
  };

  // Gerador de barras para criar um código de barras realista e retangular
  const padraoBarras = [3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 4, 2, 1, 3, 1, 1, 2, 3, 1, 2];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-blue-600 to-blue-900">
      
      {/* Fundo decorativo sutil da versão anterior */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>

      <div className="relative flex-1 flex flex-col justify-between z-10 px-6 py-10 max-w-md mx-auto w-full">
        
        {/* Cabeçalho */}
        <div className="text-center animate-fade-in mt-2">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg backdrop-blur-sm">
            <i className="fas fa-magic text-2xl text-white"></i>
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight mb-2">
            Como usar o App
          </h1>
          <p className="text-blue-200 text-base">
            Veja como é simples controlar seus gastos:
          </p>
        </div>

        {/* Área da Animação Explicativa (Não clicável) */}
        <div className="relative w-full aspect-[3/4] bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20 flex flex-col items-center justify-center p-6 shadow-2xl pointer-events-none mt-4">
          
          {/* Passo 1: O Scanner e a Aproximação */}
          <div className="flex flex-col items-center mb-6 relative w-full">
            <p className="text-white/80 font-medium mb-3 text-sm text-center">
              1. <span className="text-green-400 font-bold">Aproxime e centralize</span> o código de barras
            </p>
            
            {/* Visor da Câmara (Retangular) */}
            <div className="relative w-[220px] h-[120px] flex items-center justify-center rounded-xl animate-focus-frame bg-black/40 overflow-hidden shadow-inner backdrop-blur-sm">
              
              {/* Marcadores de Canto (Crosshairs) */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 rounded-tl border-white/50 animate-corner-color"></div>
              <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 rounded-tr border-white/50 animate-corner-color"></div>
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 rounded-bl border-white/50 animate-corner-color"></div>
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 rounded-br border-white/50 animate-corner-color"></div>

              {/* Código de Barras que se aproxima (Zoom in) */}
              <div className="flex h-16 bg-white p-2 rounded animate-approach-barcode shadow-lg">
                {padraoBarras.map((largura, i) => (
                  <div 
                    key={i} 
                    className="h-full bg-slate-900" 
                    style={{ width: `${largura * 2}px`, marginRight: i === padraoBarras.length -1 ? '0' : '2px' }}
                  ></div>
                ))}
              </div>
              
              {/* Linha do Laser Animada (Só aparece quando está perto) */}
              <div className="absolute left-0 w-full h-[2px] bg-red-500 shadow-[0_0_15px_3px_rgba(239,68,68,0.8)] animate-laser-sync"></div>
              
              {/* Check de Sucesso Animado */}
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm animate-success-check-sync opacity-0">
                <div className="bg-green-500 rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-green-500/50">
                  <i className="fas fa-check text-2xl text-white"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Efeito de Conexão - Dinheiro caindo */}
          <div className="h-10 w-full flex justify-center items-center relative z-20">
             <div className="bg-green-500 text-white font-bold px-4 py-1.5 rounded-full text-sm animate-float-money-sync absolute opacity-0 shadow-lg shadow-green-500/30 flex items-center gap-2">
               <i className="fas fa-plus text-xs"></i> R$ 5,50
             </div>
             {/* Rastro tracejado ligando o scanner ao carrinho */}
             <div className="h-full w-0.5 border-l-2 border-dashed border-white/30"></div>
          </div>

          {/* Passo 2: O Total Calculado */}
          <div className="flex flex-col items-center mt-2 w-full">
            <p className="text-white/80 font-medium mb-3 text-sm">
              2. O App soma o total automaticamente
            </p>
            
            <div className="w-full max-w-[220px] bg-white rounded-2xl p-4 flex items-center justify-between shadow-xl animate-pulse-total-sync border border-white/50">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                 <i className="fas fa-shopping-cart text-blue-500 text-xl"></i>
              </div>
              <div className="text-right flex-1 ml-3">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total da Compra</p>
                <p className="text-slate-800 text-2xl font-black tabular-nums">
                   <span className="animate-price-change-sync block">R$ 0,00</span>
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Botão de Ação Único com Animação Sincronizada */}
        <div className="mt-8 mb-4">
          <button
            onClick={finalizarTutorial}
            className="w-full bg-green-500 text-white text-xl font-bold py-5 rounded-2xl shadow-[0_8px_30px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 animate-button-pulse-sync"
          >
            <span>Entendi, vamos começar!</span>
            <span className="text-2xl">🚀</span>
          </button>
        </div>

      </div>

      {/* Estilos para a história animada e o botão */}
      <style>{`
        /* Fade inicial do componente */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }

        /* TIMELINE DE 6 SEGUNDOS DO TUTORIAL */
        
        /* 1. Zoom do Código de Barras (Ensina a aproximar) */
        @keyframes approachBarcode {
          0%, 15% { transform: scale(0.35) rotate(-5deg); opacity: 0.5; filter: blur(2px); }
          35%, 60% { transform: scale(1.1) rotate(0deg); opacity: 1; filter: blur(0px); }
          80%, 100% { transform: scale(0.35) rotate(-5deg); opacity: 0.5; filter: blur(2px); }
        }
        .animate-approach-barcode { animation: approachBarcode 6s infinite cubic-bezier(0.25, 1, 0.5, 1); }

        /* 2. Cores das quinas do visor (Branco -> Verde) */
        @keyframes cornerColor {
          0%, 45% { border-color: rgba(255,255,255,0.4); }
          50%, 65% { border-color: #22c55e; }
          75%, 100% { border-color: rgba(255,255,255,0.4); }
        }
        .animate-corner-color { animation: cornerColor 6s infinite; }

        @keyframes focusFrame {
          0%, 45% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1); }
          50%, 65% { box-shadow: inset 0 0 0 2px #22c55e; }
          75%, 100% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1); }
        }
        .animate-focus-frame { animation: focusFrame 6s infinite; }

        /* 3. Laser escaneando (Só liga quando está perto) */
        @keyframes laserScanSync {
          0%, 35% { opacity: 0; top: 10%; }
          40% { opacity: 1; top: 10%; }
          48% { opacity: 1; top: 90%; }
          50%, 100% { opacity: 0; top: 90%; }
        }
        .animate-laser-sync { animation: laserScanSync 6s infinite ease-in-out; }

        /* 4. Check Verde na câmara */
        @keyframes successCheckSync {
          0%, 49% { opacity: 0; transform: scale(0.5); }
          50%, 60% { opacity: 1; transform: scale(1); }
          65%, 100% { opacity: 0; transform: scale(1.1); }
        }
        .animate-success-check-sync { animation: successCheckSync 6s infinite cubic-bezier(0.34, 1.56, 0.64, 1); }

        /* 5. Dinheiro caindo pro carrinho */
        @keyframes floatMoneySync {
          0%, 52% { opacity: 0; transform: translateY(-20px) scale(0.8); }
          55% { opacity: 1; transform: translateY(0px) scale(1); }
          65%, 100% { opacity: 0; transform: translateY(40px) scale(0.8); }
        }
        .animate-float-money-sync { animation: floatMoneySync 6s infinite ease-in; }

        /* 6. Carrinho pulsando ao receber */
        @keyframes pulseTotalSync {
          0%, 63% { transform: scale(1); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: #f1f5f9; }
          65% { transform: scale(1.05); box-shadow: 0 20px 25px -5px rgba(59, 130, 246, 0.4); border-color: #bfdbfe; }
          72%, 100% { transform: scale(1); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: #f1f5f9; }
        }
        .animate-pulse-total-sync { animation: pulseTotalSync 6s infinite ease-in-out; }

        /* 7. Texto do Preço mudando */
        @keyframes priceChangeSync {
          0%, 64% { content: "R$ 0,00"; color: #1e293b; }
          65%, 85% { content: "R$ 5,50"; color: #16a34a; }
          90%, 100% { content: "R$ 0,00"; color: #1e293b; }
        }
        .animate-price-change-sync {
          position: relative;
          color: transparent !important;
        }
        .animate-price-change-sync::after {
          content: "R$ 0,00";
          position: absolute;
          right: 0;
          top: 0;
          color: #1e293b;
          animation: priceChangeSync 6s infinite;
        }

        /* 8. Chamada de Atenção Sincronizada no Botão (Ocorre no final do loop, após o tutorial completo) */
        @keyframes buttonPulseSync {
          /* Fica quieto durante a animação principal do app (0% a 82%) */
          0%, 82%, 100% { transform: scale(1); box-shadow: 0 8px 30px rgba(34,197,94,0.4); }
          /* Bate duas vezes bem no finalzinho da explicação (86% e 94%) */
          86%, 94% { transform: scale(1.03); box-shadow: 0 12px 35px rgba(34,197,94,0.6); }
          90% { transform: scale(1); box-shadow: 0 8px 30px rgba(34,197,94,0.4); }
        }
        .animate-button-pulse-sync {
          /* Mesmo tempo total das outras animações (6s) garante que nunca saia de sincronia */
          animation: buttonPulseSync 6s infinite;
        }
      `}</style>
    </div>
  );
};

/**
 * Hook para verificar se deve mostrar o tutorial.
 */
export const useTutorialPrimeiroAcesso = () => {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    const jaVisto = localStorage.getItem(CHAVE_TUTORIAL_VISTO);
    if (!jaVisto) {
      setMostrar(true);
    }
  }, []);

  const fechar = () => setMostrar(false);

  return { mostrar, fechar };
};