import React, { useState, useEffect, useMemo } from 'react';

import { useTutorialPrimeiroAcesso, CHAVE_TUTORIAL_VISTO } from '../hooks/useTutorialUso';

// Configuração da velocidade da animação (em milissegundos). 
const VELOCIDADE_ANIMACAO_MS = 4500;

// Configuração do zoom máximo do código de barras ao se aproximar da câmera.
const ZOOM_CODIGO_BARRAS = 1.35;

// 10 preços diferentes para simular vários produtos sendo escaneados
const LISTA_PRECOS = [5.50, 12.90, 3.20, 8.40, 15.00, 4.30, 9.90, 6.75, 2.50, 11.20];

// Porcentagem do ciclo onde a soma acontece (Sincronizado com o final da queda da moeda)
const PORCENTAGEM_ATUALIZACAO_TOTAL = 0.70;

interface PropsModalTutorial {
  aoFechar: () => void;
}

/**
 * Tutorial visual de primeiro acesso (Tela Única).
 * Foco em ensinar o utilizador a aproximar a câmara e mostrar a soma automática.
 */
const ModalTutorialUso: React.FC<PropsModalTutorial> = ({ aoFechar }) => {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [totalAcumulado, setTotalAcumulado] = useState(0);
  const [direcaoDescarte, setDirecaoDescarte] = useState(1);

  const finalizarTutorial = () => {
    localStorage.setItem(CHAVE_TUTORIAL_VISTO, 'true');
    aoFechar();
  };

  useEffect(() => {
    const intervaloPrincipal = setInterval(() => {
      setIndiceAtual((prev) => (prev + 1) % LISTA_PRECOS.length);
      setDirecaoDescarte(Math.random() > 0.5 ? 1 : -1);
    }, VELOCIDADE_ANIMACAO_MS);

    return () => clearInterval(intervaloPrincipal);
  }, []);

  useEffect(() => {
    const tempoAteCair = VELOCIDADE_ANIMACAO_MS * PORCENTAGEM_ATUALIZACAO_TOTAL;
    const timerSoma = setTimeout(() => {
      if (indiceAtual === 0) {
        setTotalAcumulado(LISTA_PRECOS[0]);
      } else {
        setTotalAcumulado((prev) => prev + LISTA_PRECOS[indiceAtual]);
      }
    }, tempoAteCair);

    return () => clearTimeout(timerSoma);
  }, [indiceAtual]);

  const padraoBarras = useMemo(() => {
    const base = [3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 4, 2, 1, 3, 1, 1, 2, 3, 1, 2];
    const resultado = [];
    for (let i = 0; i < base.length; i++) {
      resultado.push(base[(i + indiceAtual * 2) % base.length]);
    }
    return resultado;
  }, [indiceAtual]);

  const formataMoeda = (valor: number) => {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
  };

  const precoAtual = LISTA_PRECOS[indiceAtual];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-blue-600 to-blue-900 font-sans"
      style={{
        '--duracao-animacao': `${VELOCIDADE_ANIMACAO_MS}ms`,
        '--zoom-codigo-barras': ZOOM_CODIGO_BARRAS,
        '--descarte-x': `${direcaoDescarte * 200}px`,
        '--descarte-rotacao': `${direcaoDescarte * 30}deg`
      } as React.CSSProperties}
    >
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>

      <div className="relative flex-1 flex flex-col justify-between z-10 px-6 py-10 max-w-md mx-auto w-full">
        <div className="text-center animate-fade-in mt-2">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg backdrop-blur-sm">
            <span className="text-4xl">✨</span>
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight mb-2">Como usar o App</h1>
          <p className="text-blue-50 text-base">Veja como é simples controlar seus gastos:</p>
        </div>

        <div className="relative w-full aspect-[3/4] bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20 flex flex-col items-center justify-center p-6 shadow-2xl pointer-events-none mt-4">
          <div className="flex flex-col items-center mb-6 relative w-full">
            <p className="text-white font-medium mb-3 text-lg text-center">
              1. <span className="text-green-400 font-bold">Aproxime e centralize</span> o código
            </p>
            {/* Visor da Câmera: w-[220px] */}
            <div className="relative w-[220px] h-[120px] flex items-center justify-center rounded-xl animate-focus-frame bg-black/40 overflow-hidden shadow-inner backdrop-blur-sm">
              <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 rounded-tl border-white/50 animate-corner-color"></div>
              <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 rounded-tr border-white/50 animate-corner-color"></div>
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 rounded-bl border-white/50 animate-corner-color"></div>
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 rounded-br border-white/50 animate-corner-color"></div>

              <div className="flex h-16 bg-white p-2 rounded animate-approach-barcode shadow-lg">
                {padraoBarras.map((largura, i) => (
                  <div key={i} className="h-full bg-slate-900 transition-all duration-300" style={{ width: `${largura * 2}px`, marginRight: i === padraoBarras.length - 1 ? '0' : '2px' }}></div>
                ))}
              </div>
              <div className="absolute left-0 w-full h-[2px] bg-red-500 shadow-[0_0_15px_3px_rgba(239,68,68,0.8)] animate-laser-sync"></div>
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm animate-success-check-sync opacity-0">
                <div className="bg-green-500 rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-green-500/50">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="h-10 w-full flex justify-center items-center relative z-20">
            {/* Dinheiro que é somado */}
            <div className="bg-green-600 text-white font-bold px-5 py-2 rounded-full text-base animate-float-money-sync absolute opacity-0 shadow-lg shadow-green-600/30 flex items-center gap-2">
              <span className="text-sm font-black">+</span> {formataMoeda(precoAtual)}
            </div>
            <div className="h-full w-0.5 border-l-2 border-dashed border-white/30"></div>
          </div>

          <div className="flex flex-col items-center mt-2 w-full">
            <p className="text-white font-medium mb-3 text-lg">
              2. O App soma automaticamente
            </p>

            {/* Card Total: Largura idêntica à câmera (220px) com ajustes de espaço interno para não cortar os números grandes */}
            <div className="w-[220px] bg-white rounded-3xl p-3 flex items-center justify-between shadow-2xl animate-pulse-total-sync border border-white/50">
              <div className="w-12 h-12 shrink-0 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
                <svg className="w-6 h-6 text-green-500 transform -scale-x-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <div className="text-right flex-1 ml-2 overflow-hidden">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate">Total Geral</p>
                {/* Fonte ajustada para text-[26px] e tracking-tighter para garantir encaixe perfeito */}
                <p className="text-slate-800 text-[26px] font-black tabular-nums tracking-tighter transition-all leading-none">
                  <span className="animate-price-color-sync block whitespace-nowrap">{formataMoeda(totalAcumulado)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 mb-4">
          <button onClick={finalizarTutorial} className="w-full bg-green-600 text-white text-xl font-bold py-5 rounded-2xl shadow-[0_8px_30px_rgba(22,163,74,0.4)] hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-3 animate-button-pulse-sync">
            <span>Entendi, vamos começar!</span>
            <span className="text-2xl">🚀</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }

        @keyframes approachBarcode {
          0%, 5% { transform: scale(0.35) rotate(-5deg) translateX(0); opacity: 0; filter: blur(2px); }
          15%, 55% { transform: scale(var(--zoom-codigo-barras)) rotate(0deg) translateX(0); opacity: 1; filter: blur(0px); }
          65%, 100% { transform: scale(var(--zoom-codigo-barras)) translateX(var(--descarte-x)) rotate(var(--descarte-rotacao)); opacity: 0; filter: blur(1px); }
        }
        .animate-approach-barcode { animation: approachBarcode var(--duracao-animacao) infinite cubic-bezier(0.25, 1, 0.5, 1); }

        @keyframes cornerColor { 0%, 45% { border-color: rgba(255,255,255,0.4); } 50%, 65% { border-color: #22c55e; } 75%, 100% { border-color: rgba(255,255,255,0.4); } }
        .animate-corner-color { animation: cornerColor var(--duracao-animacao) infinite; }

        @keyframes focusFrame { 0%, 45% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1); } 50%, 65% { box-shadow: inset 0 0 0 2px #22c55e; } 75%, 100% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1); } }
        .animate-focus-frame { animation: focusFrame var(--duracao-animacao) infinite; }

        @keyframes laserScanSync { 0%, 35% { opacity: 0; top: 10%; } 40% { opacity: 1; top: 10%; } 48% { opacity: 1; top: 90%; } 50%, 100% { opacity: 0; top: 90%; } }
        .animate-laser-sync { animation: laserScanSync var(--duracao-animacao) infinite ease-in-out; }

        @keyframes successCheckSync { 0%, 49% { opacity: 0; transform: scale(0.5); } 50%, 60% { opacity: 1; transform: scale(1); } 65%, 100% { opacity: 0; transform: scale(1.1); } }
        .animate-success-check-sync { animation: successCheckSync var(--duracao-animacao) infinite cubic-bezier(0.34, 1.56, 0.64, 1); }

        /* Ajustado para iniciar APENAS no momento do sucesso (50%) garantindo que o laser termine primeiro,
           mas mantendo a queda alongada e suave usando o translateY para prolongar a visibilidade */
        @keyframes floatMoneySync { 
          0%, 49% { opacity: 0; transform: translateY(-30px) scale(0.8); } 
          51% { opacity: 1; transform: translateY(-20px) scale(1.05); } 
          70% { opacity: 1; transform: translateY(15px) scale(1); }
          75%, 100% { opacity: 0; transform: translateY(45px) scale(0.8); } 
        }
        .animate-float-money-sync { animation: floatMoneySync var(--duracao-animacao) infinite ease-in-out; }

        @keyframes pulseTotalSync { 0%, 68% { transform: scale(1); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: #f1f5f9; } 70% { transform: scale(1.05); box-shadow: 0 20px 25px -5px rgba(34, 197, 94, 0.3); border-color: #bbf7d0; } 78%, 100% { transform: scale(1); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: #f1f5f9; } }
        .animate-pulse-total-sync { animation: pulseTotalSync var(--duracao-animacao) infinite ease-in-out; }

        @keyframes priceColorSync { 0%, 69% { color: #1e293b; } 70%, 90% { color: #16a34a; } 95%, 100% { color: #1e293b; } }
        .animate-price-color-sync { animation: priceColorSync var(--duracao-animacao) infinite; }

        @keyframes buttonPulseSync { 0%, 75%, 100% { transform: scale(1); box-shadow: 0 8px 30px rgba(22,163,74,0.4); background-color: #16a34a; } 85% { transform: scale(1.04); box-shadow: 0 15px 35px rgba(22,163,74,0.7); background-color: #15803d; } }
        .animate-button-pulse-sync { animation: buttonPulseSync var(--duracao-animacao) infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default ModalTutorialUso;
