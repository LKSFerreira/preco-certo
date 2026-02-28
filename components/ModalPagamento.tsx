import React, { useState, useEffect } from 'react';
import { StatusPagamento } from '../services/pagamento/tipos';
import { fabricaPagamento } from '../services/pagamento/fabrica';

/**
 * ===================================================================
 * TEMPORÁRIO: Dados mockados de PIX para exibição na modal.
 * Substituir pela resposta real da API do Mercado Pago quando a
 * integração estiver concluída.
 * ===================================================================
 */
import dadosMockPix from '../chave_pix/chave_pix.json';
// Os campos utilizados do mock são:
//   dadosMockPix.qrcode_base64      -> imagem base64 do QR Code
//   dadosMockPix.copia_e_cola_pix   -> código PIX copia e cola

// --- COMPONENTES DE EFEITO (Dopamina UX) ---

/** Efeito de onda de choque (ripple) no sucesso */
const OndaDeChoque = () => (
  <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
    <div
      className="w-20 h-20 rounded-full border-4 border-emerald-400 absolute opacity-0"
      style={{ animation: 'shockwave-anim 1.2s ease-out forwards' }}
    />
  </div>
);

/** Explosão de partículas (confetes dinâmicos) no sucesso */
const ExplosaoDeParticulas = () => {
  const cores = [
    'bg-rose-400', 'bg-amber-400', 'bg-emerald-400',
    'bg-cyan-400', 'bg-violet-400', 'bg-fuchsia-400',
  ];
  const particulas = Array.from({ length: 16 }).map((_, indice) => {
    const angulo = (indice * 22.5) * (Math.PI / 180);
    const distancia = 70 + Math.random() * 40;
    const posicao_x = Math.cos(angulo) * distancia;
    const posicao_y = Math.sin(angulo) * distancia;
    const tamanho = 5 + Math.random() * 6;
    const cor = cores[indice % cores.length];
    return { id: indice, posicao_x, posicao_y, tamanho, atraso: Math.random() * 0.15, cor };
  });

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
      {particulas.map(particula => (
        <div
          key={particula.id}
          className={`absolute rounded-full ${particula.cor}`}
          style={{
            width: `${particula.tamanho}px`,
            height: `${particula.tamanho}px`,
            boxShadow: '0 0 8px currentColor',
            animation: `particle-anim-${particula.id} 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
            animationDelay: `${particula.atraso}s`,
            opacity: 0,
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes particle-anim-${particula.id} {
              0% { transform: translate(0, 0) scale(0); opacity: 1; }
              70% { transform: translate(${particula.posicao_x}px, ${particula.posicao_y}px) scale(1); opacity: 1; }
              100% { transform: translate(${particula.posicao_x * 1.2}px, ${particula.posicao_y * 1.2}px) scale(0); opacity: 0; }
            }
          ` }} />
        </div>
      ))}
    </div>
  );
};

/** Tipos visuais para o tema do Núcleo Quântico */
type StatusVisualNucleo = 'IDLE' | 'CARREGANDO' | 'SUCESSO' | 'ERRO';

interface TemaNucleo {
  gradient: string;
  glow: string;
  ringColor: string;
  scale: string;
  speed: string;
  icon: string | null;
  pulseClass: string;
}

/** Núcleo Quântico – esfera central animada que reflete o status do pagamento */
const NucleoQuantico: React.FC<{ status: StatusVisualNucleo }> = ({ status }) => {
  useEffect(() => {
    if (status === 'SUCESSO') {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        
        const playNote = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
          
          gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
          gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + startTime + 0.05); // volume ameno
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(ctx.currentTime + startTime);
          osc.stop(ctx.currentTime + startTime + duration);
        };
        
        // Acorde mágico em escalada (Mi Maior)
        playNote(659.25, 0.0, 0.3); // E5
        playNote(830.61, 0.1, 0.3); // G#5
        playNote(987.77, 0.2, 0.3); // B5
        playNote(1318.51, 0.3, 0.8, 'triangle'); // E6
      } catch (e) {
        console.warn('Áudio de sucesso não suportado ou bloqueado no navegador', e);
      }
    }
  }, [status]);

  const temas: Record<StatusVisualNucleo, TemaNucleo> = {
    IDLE: {
      gradient: 'bg-gradient-to-tr from-slate-500 to-slate-400',
      glow: 'rgba(100, 116, 139, 0.4)',
      ringColor: 'stroke-slate-300',
      scale: 'scale-90',
      speed: '10s',
      icon: null,
      pulseClass: '',
    },
    CARREGANDO: {
      gradient: 'bg-gradient-to-tr from-blue-500 to-cyan-500',
      glow: 'rgba(56, 189, 248, 0.5)',
      ringColor: 'stroke-cyan-400',
      scale: 'scale-100',
      speed: '1.2s',
      icon: null,
      pulseClass: 'animate-pulse',
    },
    SUCESSO: {
      gradient: 'bg-gradient-to-tr from-green-400 to-emerald-600',
      glow: 'rgba(16, 185, 129, 0.5)',
      ringColor: 'stroke-emerald-400',
      scale: 'scale-110',
      speed: '6s',
      icon: 'CHECK',
      pulseClass: '',
    },
    ERRO: {
      gradient: 'bg-gradient-to-tr from-rose-500 to-red-600',
      glow: 'rgba(225, 29, 72, 0.5)',
      ringColor: 'stroke-red-400',
      scale: 'scale-90',
      speed: '4s',
      icon: 'CROSS',
      pulseClass: 'animate-pulse-error', // Efeito contínuo de pulsar de alerta
    },
  };

  const tema = temas[status] || temas.IDLE;

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      {status === 'SUCESSO' && <OndaDeChoque />}
      {status === 'SUCESSO' && <ExplosaoDeParticulas />}

      {/* Anéis SVG Orbitais */}
      <div className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${tema.scale}`}>
        <svg className="w-full h-full animate-spin-slow" viewBox="0 0 160 160" style={{ animationDuration: tema.speed }}>
          <circle cx="80" cy="80" r="75" fill="none" className={`transition-colors duration-700 ${tema.ringColor}`} strokeWidth="1" strokeDasharray="4 8" opacity="0.6" />
          {/* Dois arcos opostos em equilíbrio simétrico (Circ. = 2*PI*60 ≈ 377 → 94 + 94.5 formam 2 arcos) */}
          <circle cx="80" cy="80" r="60" fill="none" className={`transition-colors duration-700 ${tema.ringColor}`} strokeWidth="2" strokeDasharray="94 94.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Núcleo Central */}
      <div
        className={`relative flex items-center justify-center w-20 h-20 rounded-full ${tema.gradient} transition-all duration-700 ease-out z-10 ${tema.scale} ${tema.pulseClass}`}
        style={{ boxShadow: `0 0 30px ${tema.glow}, inset 0 0 15px rgba(255,255,255,0.4)` }}
      >
        {/* Ícones com animação de desenho (Stroke) */}
        <div className="z-20 text-white">
          {tema.icon === 'CHECK' && (
            <svg className="w-10 h-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path className="animate-draw-check" pathLength={100} strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {tema.icon === 'CROSS' && (
            <svg className="w-10 h-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path className="animate-draw-cross" pathLength={100} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE MODAL PAGAMENTO ---

/** Tempo (ms) para aguardar a animação de sucesso antes de chamar o callback aoSucesso */
const TEMPO_ANIMACAO = 5000;

interface PropsModalPagamento {
  pagamento_id: string;
  qr_code: string;
  copia_e_cola: string;
  aoFechar: () => void;
  aoSucesso: () => void;
  aoTentarNovamente: () => Promise<void>;
}

const ModalPagamento: React.FC<PropsModalPagamento> = ({
  pagamento_id,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  qr_code: _qr_code_api, // Propriedade original vinda da API (desabilitada temporariamente)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  copia_e_cola: _copia_e_cola_api, // Propriedade original vinda da API (desabilitada temporariamente)
  aoFechar,
  aoSucesso,
  aoTentarNovamente,
}) => {
  /**
   * ===================================================================
   * TEMPORÁRIO: Usar dados mockados do chave_pix.json enquanto a
   * integração com a API do Mercado Pago não estiver concluída.
   *
   * Quando a integração estiver pronta, remover estas duas linhas e
   * reativar as props `qr_code` e `copia_e_cola` na desestruturação acima:
   *   qr_code,        (ao invés de _qr_code_api)
   *   copia_e_cola,   (ao invés de _copia_e_cola_api)
   * ===================================================================
   */
  const qr_code = dadosMockPix.qrcode_base64;
  const copia_e_cola = dadosMockPix.copia_e_cola_pix;

  const [status, setStatus] = useState<StatusPagamento>('pendente');
  const [copiado, setCopiado] = useState(false);
  const [recarregando, setRecarregando] = useState(false);

  useEffect(() => {
    if (!pagamento_id || status === 'aprovado' || status === 'falha') return;

    const timeout_limite = Date.now() + 15 * 60 * 1000; // 15 minutos de expiração PIX
    const servico = fabricaPagamento.obterProvedor();

    const interval_id = setInterval(async () => {
      if (Date.now() > timeout_limite) {
        clearInterval(interval_id);
        setStatus('expirado');
        return;
      }

      try {
        const novo_status = await servico.consultarStatus(pagamento_id);

        if (novo_status === 'aprovado') {
          clearInterval(interval_id);
          setStatus('aprovado');
          setTimeout(aoSucesso, TEMPO_ANIMACAO);
        } else if (novo_status === 'falha') {
          clearInterval(interval_id);
          setStatus('falha');
        } else if (novo_status === 'expirado') {
          clearInterval(interval_id);
          setStatus('expirado');
        }
      } catch (erro_polling) {
        console.error('Erro ao consultar polling:', erro_polling);
      }
    }, 2000); // Polling a cada 2 segundos

    return () => clearInterval(interval_id);
  }, [pagamento_id, aoSucesso]);

  const copiarPix = () => {
    navigator.clipboard.writeText(copia_e_cola);
    setCopiado(true);
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 animate-fade-in backdrop-blur-sm">
      {/* Container modal com limite vertical de 85vh para nunca ocupar 100% da tela */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto overflow-x-hidden animate-slide-up flex flex-col">

        {/* Header */}
        <div className="p-5 text-center bg-gray-50 border-b border-gray-100 relative shrink-0">
          <button
            onClick={aoFechar}
            className="absolute top-4 right-4 text-gray-300 active:text-gray-500 transition-colors p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="w-12 h-12 bg-verde-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-verde-600">
              <path d="M4.5 3.75a3 3 0 0 0-3 3v.75h21v-.75a3 3 0 0 0-3-3h-15Z" />
              <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-7.5Zm-18 3.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="font-black text-gray-900 leading-tight">Pagamento PIX</h2>
          <p className="text-[11px] text-gray-500 font-medium uppercase tracking-widest mt-1">Aguardando confirmação</p>
        </div>

        {/* Status Area */}
        <div className="p-6 flex flex-col items-center relative grow">
          {status === 'aprovado' ? (
            <div className="w-full flex flex-col items-center justify-center py-6 relative min-h-[260px]">
              <NucleoQuantico status="SUCESSO" />

              <div
                className="animate-text-reveal text-center relative z-10 w-full mt-6"
                style={{ animationFillMode: 'both', animationDelay: '1s' }}
              >
                <h3 className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-verde-600 to-emerald-500 mb-1 leading-tight">
                  PAGAMENTO<br />APROVADO!
                </h3>
                <p className="text-[13px] font-bold text-gray-500 mt-2">
                  Tudo certo, liberação concluída.
                </p>
              </div>
            </div>
          ) : status === 'expirado' || status === 'falha' ? (
            <div className="text-center py-8 animate-fade-in flex flex-col items-center">
              <NucleoQuantico status="ERRO" />

              <p className="text-red-500 font-bold mb-2 mt-6">PAGAMENTO EXPIRADO</p>
              <p className="text-xs text-gray-500 mb-4 px-4">
                O tempo para pagamento via PIX esgotou. Gere um novo código para continuar.
              </p>
              <button
                onClick={async () => {
                  setRecarregando(true);
                  try {
                    await aoTentarNovamente();
                    setStatus('pendente');
                  } finally {
                    setRecarregando(false);
                  }
                }}
                disabled={recarregando}
                className={`bg-verde-700 active:bg-verde-800 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 ${recarregando ? 'opacity-70 cursor-wait' : 'active:scale-95'}`}
              >
                {recarregando ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Gerando novo PIX...
                  </>
                ) : (
                  'Tentar Novamente'
                )}
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center animate-fade-in">
              {/* Container do QR Code */}
              <div className="bg-gray-50 p-3 rounded-2xl border-2 border-dashed border-gray-200 mb-6 relative group w-48 h-48 flex items-center justify-center shrink-0">
                <img
                  src={qr_code}
                  alt="QR Code PIX"
                  className={`w-full h-full mix-blend-multiply transition-opacity duration-300 ${status === 'pendente' ? 'opacity-100' : 'opacity-20'}`}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-active:opacity-100 transition-opacity">
                  <div className="bg-black/80 text-white text-[10px] px-3 py-1 rounded-full font-black">QR CODE VÁLIDO</div>
                </div>
              </div>

              {/* Botão Copiar PIX – estilo premium com borda dourada e shimmer */}
              <div className={`w-full ${!copiado ? 'animate-breathe' : ''}`}>
                <button
                  onClick={copiarPix}
                  className="relative w-full rounded-[1.2rem] transition-all active:scale-95"
                >
                  {/* Borda dourada (visível apenas quando NÃO copiado) */}
                  {!copiado && (
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 rounded-[1.2rem] opacity-100" />
                  )}

                  <div
                    className={`relative flex items-center justify-center gap-2 m-[2px] py-4 rounded-[calc(1.2rem-2px)] font-black text-sm uppercase tracking-widest overflow-hidden transition-all
                      ${copiado
                        ? 'bg-green-100 text-green-700 shadow-inner'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg border border-amber-400'
                      }`}
                  >
                    {/* Feixe de luz animado (shimmer) */}
                    {!copiado && (
                      <div className="absolute inset-0 w-full h-full pointer-events-none">
                        <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] animate-shimmer" />
                      </div>
                    )}

                    <span className="relative z-10 flex items-center gap-2">
                      {copiado ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                          CÓDIGO COPIADO!
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
                          PIX COPIA E COLA
                        </>
                      )}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center border-t border-gray-100 shrink-0">
          Liberação instantânea pelo sistema
        </div>
      </div>

      {/* Keyframes – animações da modal e do NúcleoQuântico */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes bounce-in { 0% { transform: scale(0.8); opacity: 0; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes shimmer { 0% { transform: translateX(-150%); } 40%, 100% { transform: translateX(250%); } }
        @keyframes text-reveal { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }

        /* Respiração contínua do botão principal */
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.025); }
        }

        /* Animações do NúcleoQuântico */
        @keyframes draw { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
        @keyframes shockwave-anim { 0% { transform: scale(1); opacity: 0.8; border-width: 8px; } 100% { transform: scale(3.5); opacity: 0; border-width: 0px; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }
        @keyframes spin-linear { 100% { transform: rotate(360deg); } }

        /* Pulsar contínuo para estado de erro */
        @keyframes pulse-error {
          0%, 100% { transform: scale(0.9); box-shadow: 0 0 20px rgba(225, 29, 72, 0.4), inset 0 0 15px rgba(255,255,255,0.4); }
          50% { transform: scale(0.95); box-shadow: 0 0 35px rgba(225, 29, 72, 0.8), inset 0 0 15px rgba(255,255,255,0.6); }
        }

        /* Classes utilitárias de animação */
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-shimmer { animation: shimmer 2.5s infinite ease-in-out; }
        .animate-text-reveal { animation: text-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-breathe { animation: breathe 3s infinite ease-in-out; }

        .animate-draw-check { stroke-dasharray: 100; stroke-dashoffset: 100; animation: draw 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; animation-delay: 0.2s; }
        .animate-draw-cross { stroke-dasharray: 100; stroke-dashoffset: 100; animation: draw 0.4s ease-out forwards; animation-delay: 0.1s; }

        .animate-shake { animation: shake 0.4s ease-in-out; }
        .animate-spin-slow { animation: spin-linear infinite linear; }
        .animate-pulse-error { animation: pulse-error 2s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default ModalPagamento;
