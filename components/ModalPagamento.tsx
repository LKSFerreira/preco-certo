import React, { useState, useEffect } from 'react';
import { ModoConfirmacaoPagamento, PlanoID, StatusPagamento } from '../services/pagamento/tipos';
import { apiConsultarStatus, apiSolicitarAprovacaoManual } from '../services/api-pagamento';
import BotaoConfirmaComShimmer from './buttons/BotaoConfirmaComShimmer';

const WHATSAPP_SUPORTE = import.meta.env.VITE_WHATSAPP_SUPORTE || '5517996510506';

const formatarNomePlano = (planoId?: PlanoID | null) => {
  if (planoId === 'plano_cafe') return 'Cafe';
  if (planoId === 'plano_lanche') return 'Lanche';
  if (planoId === 'plano_apoiador') return 'Apoiador';
  return 'selecionado';
};

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

/** Explosao de particulas (confetes dinamicos) no sucesso */
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

/** Tipos visuais para o tema do Nucleo Quantico */
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

/** Nucleo Quantico - esfera central animada que reflete o status do pagamento */
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
          gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + startTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + startTime);
          osc.stop(ctx.currentTime + startTime + duration);
        };

        playNote(659.25, 0.0, 0.3);
        playNote(830.61, 0.1, 0.3);
        playNote(987.77, 0.2, 0.3);
        playNote(1318.51, 0.3, 0.8, 'triangle');
      } catch (e) {
        console.warn('Audio de sucesso nao suportado ou bloqueado no navegador', e);
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
      pulseClass: 'animate-pulse-error',
    },
  };

  const tema = temas[status] || temas.IDLE;

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      {status === 'SUCESSO' && <OndaDeChoque />}
      {status === 'SUCESSO' && <ExplosaoDeParticulas />}

      <div className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${tema.scale}`}>
        <svg className="w-full h-full animate-spin-slow" viewBox="0 0 160 160" style={{ animationDuration: tema.speed }}>
          <circle cx="80" cy="80" r="75" fill="none" className={`transition-colors duration-700 ${tema.ringColor}`} strokeWidth="1" strokeDasharray="4 8" opacity="0.6" />
          <circle cx="80" cy="80" r="60" fill="none" className={`transition-colors duration-700 ${tema.ringColor}`} strokeWidth="2" strokeDasharray="94 94.5" strokeLinecap="round" />
        </svg>
      </div>

      <div
        className={`relative flex items-center justify-center w-20 h-20 rounded-full ${tema.gradient} transition-all duration-700 ease-out z-10 ${tema.scale} ${tema.pulseClass}`}
        style={{ boxShadow: `0 0 30px ${tema.glow}, inset 0 0 15px rgba(255,255,255,0.4)` }}
      >
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

const TEMPO_ANIMACAO = 5000;

interface PropsModalPagamento {
  pagamento_id: string;
  qr_code: string;
  copia_e_cola: string;
  modo_confirmacao?: ModoConfirmacaoPagamento;
  plano_id?: PlanoID | null;
  aoFechar: () => void;
  aoSucesso: (pagamento_id: string) => void;
  aoTentarNovamente: () => Promise<void>;
}

const ModalPagamento: React.FC<PropsModalPagamento> = ({
  pagamento_id,
  qr_code,
  copia_e_cola,
  modo_confirmacao = 'automatico',
  plano_id,
  aoFechar,
  aoSucesso,
  aoTentarNovamente,
}) => {
  const [status, setStatus] = useState<StatusPagamento>('pendente');
  const [copiado, setCopiado] = useState(false);
  const [recarregando, setRecarregando] = useState(false);
  const [nomeContato, setNomeContato] = useState('');
  const [enviandoComprovante, setEnviandoComprovante] = useState(false);
  const [erroSolicitacaoManual, setErroSolicitacaoManual] = useState<string | null>(null);

  useEffect(() => {
    if (modo_confirmacao === 'manual') return;
    if (!pagamento_id || status === 'aprovado' || status === 'falha') return;

    const timeout_limite = Date.now() + 15 * 60 * 1000;

    const interval_id = setInterval(async () => {
      if (Date.now() > timeout_limite) {
        clearInterval(interval_id);
        setStatus('expirado');
        return;
      }

      try {
        const novo_status = await apiConsultarStatus(pagamento_id);

        if (novo_status === 'aprovado') {
          clearInterval(interval_id);
          setStatus('aprovado');
          setTimeout(() => aoSucesso(pagamento_id), TEMPO_ANIMACAO);
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
    }, 2000);

    return () => clearInterval(interval_id);
  }, [pagamento_id, aoSucesso, modo_confirmacao, status]);

  const copiarPix = () => {
    navigator.clipboard.writeText(copia_e_cola);
    setCopiado(true);
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setCopiado(false), 2000);
  };

  const enviarComprovante = async () => {
    const nome = nomeContato.trim();
    if (nome.length < 3) return;

    const agora = new Date();
    const data = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(agora);
    const hora = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(agora);
    const nomePlano = formatarNomePlano(plano_id);
    const mensagem = [
      `Ola, meu nome e ${nome}.`,
      '',
      `Realizei o pagamento do plano ${nomePlano} na data de ${data} as ${hora}.`,
      `ID de referencia: ${pagamento_id}.`,
      '',
      'Segue meu comprovante para liberacao manual do acesso premium.'
    ].join('\n');

    setEnviandoComprovante(true);
    setErroSolicitacaoManual(null);

    if (!plano_id) {
      setErroSolicitacaoManual('Nao foi possivel identificar o plano para registrar a fila manual.');
    } else {
      try {
        await apiSolicitarAprovacaoManual({
          pagamento_id,
          plano_id,
          nome_contato: nome,
          mensagem,
        });
      } catch (erroSolicitacao) {
        console.error('Erro ao registrar solicitacao manual:', erroSolicitacao);
        setErroSolicitacaoManual('Nao foi possivel registrar na fila interna. Envie o comprovante no WhatsApp.');
      }
    }

    const urlWeb = `https://wa.me/${WHATSAPP_SUPORTE}?text=${encodeURIComponent(mensagem)}`;
    window.open(urlWeb, '_blank', 'noopener,noreferrer');
    setEnviandoComprovante(false);
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto overflow-x-hidden animate-slide-up flex flex-col">
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
          <p className="text-[11px] text-gray-500 font-medium uppercase tracking-widest mt-1">
            {modo_confirmacao === 'manual' ? 'Liberacao manual' : 'Aguardando confirmacao'}
          </p>
        </div>

        <div className="p-6 flex flex-col items-center relative grow">
          {status === 'aprovado' ? (
            <div className="w-full flex flex-col items-center justify-center py-6 relative min-h-[260px]">
              <NucleoQuantico status="SUCESSO" />
              <div className="animate-text-reveal text-center relative z-10 w-full mt-6" style={{ animationFillMode: 'both', animationDelay: '1s' }}>
                <h3 className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-verde-600 to-emerald-500 mb-1 leading-tight">
                  PAGAMENTO<br />APROVADO!
                </h3>
                <p className="text-[13px] font-bold text-gray-500 mt-2">Tudo certo, liberacao concluida.</p>
              </div>
            </div>
          ) : status === 'expirado' || status === 'falha' ? (
            <div className="text-center py-8 animate-fade-in flex flex-col items-center">
              <NucleoQuantico status="ERRO" />
              <p className="text-red-500 font-bold mb-2 mt-6">PAGAMENTO EXPIRADO</p>
              <p className="text-xs text-gray-500 mb-4 px-4">
                O tempo para pagamento via PIX esgotou. Gere um novo codigo para continuar.
              </p>
              <div className="w-full max-w-[280px]">
                <BotaoConfirmaComShimmer
                  aoClicar={async () => {
                    setRecarregando(true);
                    try {
                      await aoTentarNovamente();
                      setStatus('pendente');
                    } finally {
                      setRecarregando(false);
                    }
                  }}
                  texto={recarregando ? 'Gerando novo PIX...' : 'Tentar Novamente'}
                  iconeSvg={recarregando ? (
                    <svg className="animate-spin w-full h-full text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356m-.99 5.01A9 9 0 1 0 21 12.75" />
                    </svg>
                  )}
                  compacto={true}
                  disabled={recarregando}
                />
              </div>
            </div>
          ) : modo_confirmacao === 'manual' ? (
            <div className="w-full flex flex-col items-center animate-fade-in">
              <div className="bg-gray-50 p-3 rounded-2xl border-2 border-dashed border-gray-200 mb-6 relative group w-48 h-48 flex items-center justify-center shrink-0">
                <img src={qr_code} alt="QR Code PIX" className="w-full h-full mix-blend-multiply transition-opacity duration-300 opacity-100" />
              </div>

              <div className={`w-full ${!copiado ? 'animate-breathe' : ''}`}>
                <button onClick={copiarPix} className="relative w-full rounded-[1.2rem] transition-all active:scale-95">
                  {!copiado && (
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 rounded-[1.2rem] opacity-100" />
                  )}
                  <div className={`relative flex items-center justify-center gap-2 m-[2px] py-4 rounded-[calc(1.2rem-2px)] font-black text-sm uppercase tracking-widest overflow-hidden transition-all ${
                    copiado
                      ? 'bg-green-100 text-green-700 shadow-inner'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg border border-amber-400'
                  }`}>
                    {!copiado && (
                      <div className="absolute inset-0 w-full h-full pointer-events-none">
                        <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] animate-shimmer" />
                      </div>
                    )}
                    <span className="relative z-10">{copiado ? 'CODIGO COPIADO!' : 'PIX COPIA E COLA'}</span>
                  </div>
                </button>
              </div>

              <div className="w-full rounded-2xl bg-emerald-50 border border-emerald-100 p-4 mt-4">
                <p className="text-xs text-emerald-900 font-semibold">
                  Depois do pagamento, envie o comprovante para liberar o plano {formatarNomePlano(plano_id)}.
                </p>
              </div>

              <div className="w-full mt-4">
                <label className="block text-[11px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">
                  Seu nome
                </label>
                <input
                  type="text"
                  value={nomeContato}
                  onChange={(evento) => {
                    setNomeContato(evento.target.value);
                    if (erroSolicitacaoManual) {
                      setErroSolicitacaoManual(null);
                    }
                  }}
                  placeholder="Como podemos te identificar?"
                  className="w-full text-slate-700 rounded-2xl border-2 bg-slate-50 border-transparent focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-300 font-bold text-sm p-4"
                />
              </div>

              <div className="w-full mt-4">
                <BotaoConfirmaComShimmer
                  aoClicar={async () => enviarComprovante()}
                  texto={enviandoComprovante ? 'Registrando solicitacao...' : 'Enviar comprovante no WhatsApp'}
                  iconeSvg={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                    </svg>
                  }
                  compacto={true}
                  disabled={nomeContato.trim().length < 3 || enviandoComprovante}
                />
                {erroSolicitacaoManual && (
                  <p className="mt-2 text-[11px] font-semibold text-amber-700">{erroSolicitacaoManual}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center animate-fade-in">
              <div className="bg-gray-50 p-3 rounded-2xl border-2 border-dashed border-gray-200 mb-6 relative group w-48 h-48 flex items-center justify-center shrink-0">
                <img src={qr_code} alt="QR Code PIX" className={`w-full h-full mix-blend-multiply transition-opacity duration-300 ${status === 'pendente' ? 'opacity-100' : 'opacity-20'}`} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-active:opacity-100 transition-opacity">
                  <div className="bg-black/80 text-white text-[10px] px-3 py-1 rounded-full font-black">QR CODE VALIDO</div>
                </div>
              </div>

              <div className={`w-full ${!copiado ? 'animate-breathe' : ''}`}>
                <button onClick={copiarPix} className="relative w-full rounded-[1.2rem] transition-all active:scale-95">
                  {!copiado && (
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 rounded-[1.2rem] opacity-100" />
                  )}
                  <div className={`relative flex items-center justify-center gap-2 m-[2px] py-4 rounded-[calc(1.2rem-2px)] font-black text-sm uppercase tracking-widest overflow-hidden transition-all ${
                    copiado
                      ? 'bg-green-100 text-green-700 shadow-inner'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg border border-amber-400'
                  }`}>
                    {!copiado && (
                      <div className="absolute inset-0 w-full h-full pointer-events-none">
                        <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] animate-shimmer" />
                      </div>
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {copiado ? 'CODIGO COPIADO!' : 'PIX COPIA E COLA'}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center border-t border-gray-100 shrink-0">
          {modo_confirmacao === 'manual' ? 'Liberacao manual por comprovante' : 'Liberacao instantanea pelo sistema'}
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes bounce-in { 0% { transform: scale(0.8); opacity: 0; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes shimmer { 0% { transform: translateX(-150%); } 40%, 100% { transform: translateX(250%); } }
        @keyframes text-reveal { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.025); } }
        @keyframes draw { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
        @keyframes shockwave-anim { 0% { transform: scale(1); opacity: 0.8; border-width: 8px; } 100% { transform: scale(3.5); opacity: 0; border-width: 0px; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }
        @keyframes spin-linear { 100% { transform: rotate(360deg); } }
        @keyframes pulse-error {
          0%, 100% { transform: scale(0.9); box-shadow: 0 0 20px rgba(225, 29, 72, 0.4), inset 0 0 15px rgba(255,255,255,0.4); }
          50% { transform: scale(0.95); box-shadow: 0 0 35px rgba(225, 29, 72, 0.8), inset 0 0 15px rgba(255,255,255,0.6); }
        }

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
