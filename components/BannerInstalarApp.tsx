import React, { useState, useEffect, useRef } from 'react';

/**
 * Chave do localStorage para armazenar o timestamp do último prompt exibido.
 * O banner só aparece novamente após 30 dias.
 */
const CHAVE_ULTIMO_PROMPT = 'pwa_ultimo_prompt';
const INTERVALO_DIAS = 30;

/** Verifica se o dispositivo é mobile */
const ehDispositivoMobile = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

/** Verifica se o app já está rodando em modo standalone (instalado) */
const ehStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as any).standalone === true;

/** Verifica se já mostrou o prompt dentro do intervalo de dias */
const promptDentroDoPrazo = () => {
  const ultimoPrompt = localStorage.getItem(CHAVE_ULTIMO_PROMPT);
  if (!ultimoPrompt) return false;
  const diasPassados = (Date.now() - Number(ultimoPrompt)) / (1000 * 60 * 60 * 24);
  return diasPassados < INTERVALO_DIAS;
};

/**
 * Banner de instalação PWA.
 * Aparece na parte inferior da tela em dispositivos mobile,
 * apenas 1x a cada 30 dias, se o app não estiver instalado.
 */
const BannerInstalarApp: React.FC = () => {
  const [visivel, setVisivel] = useState(false);
  const [animandoSaida, setAnimandoSaida] = useState(false);
  const eventoInstalacao = useRef<any>(null);

  useEffect(() => {
    // Não exibe se não for mobile, se já estiver instalado ou se já perguntou recentemente
    if (!ehDispositivoMobile() || ehStandalone() || promptDentroDoPrazo()) return;

    const capturarEvento = (evento: Event) => {
      // Impede o mini-infobar padrão do Chrome
      evento.preventDefault();
      eventoInstalacao.current = evento;

      // Pequeno delay para não competir com o carregamento da tela
      setTimeout(() => setVisivel(true), 2500);
    };

    window.addEventListener('beforeinstallprompt', capturarEvento);

    return () => {
      window.removeEventListener('beforeinstallprompt', capturarEvento);
    };
  }, []);

  const fecharBanner = () => {
    setAnimandoSaida(true);
    localStorage.setItem(CHAVE_ULTIMO_PROMPT, String(Date.now()));
    setTimeout(() => {
      setVisivel(false);
      setAnimandoSaida(false);
    }, 300);
  };

  const instalarApp = async () => {
    if (!eventoInstalacao.current) return;

    // Dispara o prompt nativo do navegador
    eventoInstalacao.current.prompt();
    const { outcome } = await eventoInstalacao.current.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] Usuário aceitou instalar o app');
    } else {
      console.log('[PWA] Usuário rejeitou a instalação');
    }

    // Independente da escolha, salva o timestamp e fecha o banner
    localStorage.setItem(CHAVE_ULTIMO_PROMPT, String(Date.now()));
    eventoInstalacao.current = null;
    setAnimandoSaida(true);
    setTimeout(() => {
      setVisivel(false);
      setAnimandoSaida(false);
    }, 300);
  };

  if (!visivel) return null;

  return (
    <>
      <style>{`
        @keyframes bannerSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes bannerSlideDown {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100%); opacity: 0; }
        }
      `}</style>

      <div
        className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        style={{
          animation: animandoSaida ? 'bannerSlideDown 0.3s ease-in forwards' : 'bannerSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <div className="max-w-md mx-auto bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] p-4 text-white relative overflow-hidden">
          {/* Decoração de fundo */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-teal-400/15 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex items-center gap-3">
            {/* Ícone do App */}
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 flex items-center justify-center shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-7 h-7">
                <rect x="32" y="32" width="448" height="448" rx="128" ry="128" fill="#22c55e" />
                <g fill="#ffffff">
                  <rect x="128" y="160" width="48" height="192" rx="16" />
                  <rect x="208" y="160" width="32" height="192" rx="16" />
                  <rect x="272" y="160" width="64" height="192" rx="16" />
                  <rect x="368" y="160" width="16" height="192" rx="8" />
                </g>
              </svg>
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black leading-tight">Instale o Sem Susto</p>
              <p className="text-[11px] text-emerald-100/80 font-medium leading-tight mt-0.5">
                Acesse direto da sua tela inicial, rápido e sem navegador.
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="relative z-10 flex gap-2 mt-3">
            <button
              onClick={fecharBanner}
              className="flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider text-emerald-100/70 active:text-white transition-colors rounded-xl active:bg-white/10"
            >
              Agora não
            </button>
            <button
              onClick={instalarApp}
              className="flex-[2] py-2.5 bg-white text-emerald-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all active:bg-emerald-50 flex items-center justify-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Instalar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BannerInstalarApp;
