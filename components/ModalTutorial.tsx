import React, { useState, useEffect, useMemo } from 'react';

// Atualizado para v9 para garantir que os usuários vejam a nova versão com múltiplas somas
const CHAVE_TUTORIAL_VISTO = 'sem_susto_tutorial_v9';

// Configuração da velocidade da animação (em milissegundos). 
// Altere este valor para deixar tudo mais rápido ou mais lento!
const VELOCIDADE_ANIMACAO_MS = 4500; 

// Configuração do zoom máximo do código de barras ao se aproximar da câmera.
// 1.0 = tamanho normal, 1.1 = 110%, 1.5 = 150%, etc.
const ZOOM_CODIGO_BARRAS = 1.1;

// 10 preços diferentes para simular vários produtos sendo escaneados
const LISTA_PRECOS = [5.50, 12.90, 3.20, 8.40, 15.00, 4.30, 9.90, 6.75, 2.50, 11.20];

// Exatamente 65% do tempo é quando a animação do dinheiro "caindo" chega no total
const PORCENTAGEM_ATUALIZACAO_TOTAL = 0.65; 

interface PropsModalTutorial {
  aoFechar: () => void;
}

/**
 * Tutorial visual de primeiro acesso (Tela Única).
 * Foco em ensinar o utilizador a aproximar a câmara e mostrar a soma automática.
 */
export const ModalTutorial: React.FC<PropsModalTutorial> = ({ aoFechar }) => {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [totalAcumulado, setTotalAcumulado] = useState(0);
  
  // Novo estado: 1 para direita, -1 para esquerda
  const [direcaoDescarte, setDirecaoDescarte] = useState(1); 

  const finalizarTutorial = () => {
    localStorage.setItem(CHAVE_TUTORIAL_VISTO, 'true');
    aoFechar();
  };

  // Efeito responsável por coordenar a troca de produtos e a soma
  useEffect(() => {
    // Loop principal: Troca o produto na velocidade definida
    const intervaloPrincipal = setInterval(() => {
      setIndiceAtual((prev) => (prev + 1) % LISTA_PRECOS.length);
      // A cada ciclo, escolhe uma direção aleatória para descartar o código de barras
      setDirecaoDescarte(Math.random() > 0.5 ? 1 : -1);
    }, VELOCIDADE_ANIMACAO_MS);

    return () => clearInterval(intervaloPrincipal);
  }, []);

  // Efeito responsável por somar o valor no exato momento que a animação visual atinge o carrinho
  useEffect(() => {
    const tempoAteCair = VELOCIDADE_ANIMACAO_MS * PORCENTAGEM_ATUALIZACAO_TOTAL;
    
    const timerSoma = setTimeout(() => {
      if (indiceAtual === 0) {
         // Se recomeçou a lista de 10 produtos, reseta a soma para não crescer ao infinito
         setTotalAcumulado(LISTA_PRECOS[0]);
      } else {
         // Soma o produto atual ao total acumulado
         setTotalAcumulado((prev) => prev + LISTA_PRECOS[indiceAtual]);
      }
    }, tempoAteCair);

    return () => clearTimeout(timerSoma);
  }, [indiceAtual]);

  // Gerador dinâmico de código de barras: Muda levemente a cada novo produto para dar realismo
  const padraoBarras = useMemo(() => {
    const base = [3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 4, 2, 1, 3, 1, 1, 2, 3, 1, 2];
    const resultado = [];
    for (let i = 0; i < base.length; i++) {
       // Desloca os valores com base no índice para "gerar" um código visualmente diferente
       resultado.push(base[(i + indiceAtual * 2) % base.length]);
    }
    return resultado;
  }, [indiceAtual]);

  // Formatador de Moeda
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
        // Passamos a direção do descarte para o CSS ler
        '--descarte-x': `${direcaoDescarte * 200}px`,
        '--descarte-rotacao': `${direcaoDescarte * 30}deg`
      } as React.CSSProperties}
    >
      
      {/* Fundo decorativo sutil */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>

      <div className="relative flex-1 flex flex-col justify-between z-10 px-6 py-10 max-w-md mx-auto w-full">
        
        {/* Cabeçalho */}
        <div className="text-center animate-fade-in mt-2">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg backdrop-blur-sm">
            {/* Usando inline SVG para não depender de fontes externas */}
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
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
              1. <span className="text-green-400 font-bold">Aproxime e centralize</span> o código
            </p>
            
            {/* Visor da Câmara (Retangular) */}
            <div className="relative w-[220px] h-[120px] flex items-center justify-center rounded-xl animate-focus-frame bg-black/40 overflow-hidden shadow-inner backdrop-blur-sm">
              
              {/* Marcadores de Canto (Crosshairs) */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 rounded-tl border-white/50 animate-corner-color"></div>
              <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 rounded-tr border-white/50 animate-corner-color"></div>
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 rounded-bl border-white/50 animate-corner-color"></div>
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 rounded-br border-white/50 animate-corner-color"></div>

              {/* Código de Barras que se aproxima (Zoom in) - Agora dinâmico! */}
              <div className="flex h-16 bg-white p-2 rounded animate-approach-barcode shadow-lg">
                {padraoBarras.map((largura, i) => (
                  <div 
                    key={i} 
                    className="h-full bg-slate-900 transition-all duration-300" 
                    style={{ width: `${largura * 2}px`, marginRight: i === padraoBarras.length -1 ? '0' : '2px' }}
                  ></div>
                ))}
              </div>
              
              {/* Linha do Laser Animada */}
              <div className="absolute left-0 w-full h-[2px] bg-red-500 shadow-[0_0_15px_3px_rgba(239,68,68,0.8)] animate-laser-sync"></div>
              
              {/* Check de Sucesso Animado */}
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm animate-success-check-sync opacity-0">
                <div className="bg-green-500 rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-green-500/50">
                   <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Efeito de Conexão - Dinheiro caindo */}
          <div className="h-10 w-full flex justify-center items-center relative z-20">
             <div className="bg-green-500 text-white font-bold px-4 py-1.5 rounded-full text-sm animate-float-money-sync absolute opacity-0 shadow-lg shadow-green-500/30 flex items-center gap-2">
               <span className="text-xs font-black">+</span> {formataMoeda(precoAtual)}
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
              <div className="w-14 h-14 shrink-0 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
                 {/* Ícone de carrinho levemente maior, verde e invertido horizontalmente (-scale-x-100) */}
                 <svg className="w-7 h-7 text-green-500 transform -scale-x-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <div className="text-right flex-1 ml-3">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total da Compra</p>
                <p className="text-slate-800 text-2xl font-black tabular-nums transition-all">
                   {/* Agora o valor real do React é atualizado e o CSS só cuida da cor! */}
                   <span className="animate-price-color-sync block">{formataMoeda(totalAcumulado)}</span>
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Botão de Ação Único com Animação Sincronizada (Heartbeat) */}
        <div className="mt-8 mb-4">
          <button
            onClick={finalizarTutorial}
            className="w-full bg-green-500 text-white text-xl font-bold py-5 rounded-2xl shadow-[0_8px_30px_rgba(34,197,94,0.4)] hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-3 animate-button-pulse-sync"
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

        /* TIMELINE CONTROLADA PELA VARIÁVEL CSS --duracao-animacao */
        
        /* 1. Zoom do Código de Barras e Descarte Aleatório */
        @keyframes approachBarcode {
          /* Nasce pequeno no fundo, invisível para esconder o pulo do reset */
          0%, 5% { transform: scale(0.35) rotate(-5deg) translateX(0); opacity: 0; filter: blur(2px); }
          /* Vem pro centro e fica estabilizado para o scan com o zoom dinâmico */
          15%, 55% { transform: scale(var(--zoom-codigo-barras)) rotate(0deg) translateX(0); opacity: 1; filter: blur(0px); }
          /* Assim que dá o check (60%), é jogado para fora na direção decidida pelo React! */
          65%, 100% { transform: scale(var(--zoom-codigo-barras)) translateX(var(--descarte-x)) rotate(var(--descarte-rotacao)); opacity: 0; filter: blur(1px); }
        }
        .animate-approach-barcode { animation: approachBarcode var(--duracao-animacao) infinite cubic-bezier(0.25, 1, 0.5, 1); }

        /* 2. Cores das quinas do visor (Branco -> Verde) */
        @keyframes cornerColor {
          0%, 45% { border-color: rgba(255,255,255,0.4); }
          50%, 65% { border-color: #22c55e; }
          75%, 100% { border-color: rgba(255,255,255,0.4); }
        }
        .animate-corner-color { animation: cornerColor var(--duracao-animacao) infinite; }

        @keyframes focusFrame {
          0%, 45% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1); }
          50%, 65% { box-shadow: inset 0 0 0 2px #22c55e; }
          75%, 100% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1); }
        }
        .animate-focus-frame { animation: focusFrame var(--duracao-animacao) infinite; }

        /* 3. Laser escaneando (Só liga quando está perto) */
        @keyframes laserScanSync {
          0%, 35% { opacity: 0; top: 10%; }
          40% { opacity: 1; top: 10%; }
          48% { opacity: 1; top: 90%; }
          50%, 100% { opacity: 0; top: 90%; }
        }
        .animate-laser-sync { animation: laserScanSync var(--duracao-animacao) infinite ease-in-out; }

        /* 4. Check Verde na câmara */
        @keyframes successCheckSync {
          0%, 49% { opacity: 0; transform: scale(0.5); }
          50%, 60% { opacity: 1; transform: scale(1); }
          65%, 100% { opacity: 0; transform: scale(1.1); }
        }
        .animate-success-check-sync { animation: successCheckSync var(--duracao-animacao) infinite cubic-bezier(0.34, 1.56, 0.64, 1); }

        /* 5. Dinheiro caindo pro carrinho */
        @keyframes floatMoneySync {
          0%, 52% { opacity: 0; transform: translateY(-20px) scale(0.8); }
          55% { opacity: 1; transform: translateY(0px) scale(1); }
          65%, 100% { opacity: 0; transform: translateY(40px) scale(0.8); }
        }
        .animate-float-money-sync { animation: floatMoneySync var(--duracao-animacao) infinite ease-in; }

        /* 6. Carrinho pulsando ao receber o dinheiro (65%) */
        @keyframes pulseTotalSync {
          0%, 63% { transform: scale(1); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: #f1f5f9; }
          /* Ajustado para pulsar com tons de verde mantendo a harmonia com o novo carrinho */
          65% { transform: scale(1.05); box-shadow: 0 20px 25px -5px rgba(34, 197, 94, 0.3); border-color: #bbf7d0; }
          72%, 100% { transform: scale(1); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: #f1f5f9; }
        }
        .animate-pulse-total-sync { animation: pulseTotalSync var(--duracao-animacao) infinite ease-in-out; }

        /* 7. O valor real é atualizado pelo React, o CSS só chama a atenção colorindo de verde! */
        @keyframes priceColorSync {
          0%, 64% { color: #1e293b; }
          65%, 85% { color: #16a34a; }
          90%, 100% { color: #1e293b; }
        }
        .animate-price-color-sync {
          animation: priceColorSync var(--duracao-animacao) infinite;
        }

        /* 8. PULSO ÚNICO DO BOTÃO: Apenas 1 "hit" fluído (75% a 95%)
           Cria o fechamento perfeito do ciclo antes do próximo produto. */
        @keyframes buttonPulseSync {
          0%, 75%, 100% { 
            transform: scale(1); 
            box-shadow: 0 8px 30px rgba(34,197,94,0.4); 
            background-color: #22c55e;
          }
          85% { 
            transform: scale(1.04); 
            box-shadow: 0 15px 35px rgba(34,197,94,0.7); 
            background-color: #16a34a; 
          }
        }
        .animate-button-pulse-sync {
          animation: buttonPulseSync var(--duracao-animacao) infinite ease-in-out;
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


// -------- Wrapper para testar e ver o Preview -------- 
export default function AppPrincipal() {
  const { mostrar, fechar } = useTutorialPrimeiroAcesso();

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-center">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Simulador do App</h2>
        <p className="text-slate-600 mb-6">Esta é a tela de fundo. O modal do tutorial deve estar aberto.</p>
        <button 
          onClick={() => {
            localStorage.removeItem(CHAVE_TUTORIAL_VISTO);
            window.location.reload();
          }} 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:bg-blue-700"
        >
          Resetar / Ver Tutorial Novamente
        </button>
      </div>
      
      {mostrar && <ModalTutorial aoFechar={fechar} />}
    </div>
  );
}