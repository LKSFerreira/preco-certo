import React, { useState, useEffect, useRef } from 'react';

/**
 * Numero do WhatsApp do desenvolvedor para contato.
 * Formato: codigo do pais + DDD + numero (sem espacos ou tracos).
 */
const WHATSAPP_DESENVOLVEDOR = '5517996510506';
const MIN_NOME = 3;
const MIN_MENSAGEM = 25;

interface PropsModalContato {
  aoFechar: () => void;
}

/**
 * Modal de contato via WhatsApp.
 *
 * Melhorias aplicadas:
 * - Layout responsivo por ResizeObserver (compacto em telas curtas)
 * - Validacao de minimos para nome e mensagem
 * - Feedback visual de envio antes de abrir o WhatsApp
 * - Botao de envio premium com borda dourada e efeito shimmer
 */
const ModalContato: React.FC<PropsModalContato> = ({ aoFechar }) => {
  const [nome, setNome] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [nomeTocado, setNomeTocado] = useState(false);
  const [mensagemTocada, setMensagemTocada] = useState(false);
  const [tecladoAtivo, setTecladoAtivo] = useState(false);
  const [modoCompacto, setModoCompacto] = useState(false);
  const [textareaRows, setTextareaRows] = useState(3);
  const [mostrarIcone, setMostrarIcone] = useState(true);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const refNome = useRef<HTMLInputElement>(null);
  const refMensagem = useRef<HTMLTextAreaElement>(null);
  const refBotaoEnviar = useRef<HTMLButtonElement>(null);
  const timerDesfoqueRef = useRef<number | null>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const altura = entry.contentRect.height;

        setModoCompacto(altura < 600);

        // Ajuste fino por faixas de altura do dispositivo
        if (altura <= 710) {
          setMostrarIcone(false);
          setTextareaRows(altura <= 640 ? 4 : 5);
        } else if (altura < 850) {
          setMostrarIcone(true);
          setTextareaRows(4);
        } else {
          setMostrarIcone(true);
          setTextareaRows(5);
        }
      }
    });

    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (timerDesfoqueRef.current) {
        window.clearTimeout(timerDesfoqueRef.current);
      }
    };
  }, []);

  const nomeLimpo = nome.trim();
  const mensagemLimpa = mensagem.trim();
  const nomeCurto = nomeLimpo.length > 0 && nomeLimpo.length < MIN_NOME;
  const mensagemCurta = mensagemLimpa.length > 0 && mensagemLimpa.length < MIN_MENSAGEM;
  const nomeErroVisivel = nomeTocado && nomeCurto;
  const mensagemErroVisivel = mensagemTocada && mensagemCurta;
  const nomeContador = `${Math.min(nomeLimpo.length, MIN_NOME)}/${MIN_NOME}`;
  const mensagemContador = `${Math.min(mensagemLimpa.length, MIN_MENSAGEM)}/${MIN_MENSAGEM}`;
  const nomeContadorClasse = nomeLimpo.length >= MIN_NOME
    ? 'text-emerald-600'
    : (nomeTocado && nomeLimpo.length > 0 ? 'text-red-600' : 'text-slate-400');
  const mensagemContadorClasse = mensagemLimpa.length >= MIN_MENSAGEM
    ? 'text-emerald-600'
    : (mensagemTocada && mensagemLimpa.length > 0 ? 'text-red-600' : 'text-slate-400');
  const formularioValido = nomeLimpo.length >= MIN_NOME && mensagemLimpa.length >= MIN_MENSAGEM;

  const focarCampoVisivel = (elemento: HTMLElement | null, alvoSecundario?: HTMLElement | null) => {
    if (timerDesfoqueRef.current) {
      window.clearTimeout(timerDesfoqueRef.current);
      timerDesfoqueRef.current = null;
    }

    setTecladoAtivo(true);

    window.setTimeout(() => {
      elemento?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      alvoSecundario?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 120);
  };

  const lidarBlurCampo = () => {
    if (timerDesfoqueRef.current) {
      window.clearTimeout(timerDesfoqueRef.current);
    }

    timerDesfoqueRef.current = window.setTimeout(() => {
      const ativo = document.activeElement as HTMLElement | null;
      const aindaEmCampo = !!ativo && (ativo.tagName === 'INPUT' || ativo.tagName === 'TEXTAREA');
      if (!aindaEmCampo) {
        setTecladoAtivo(false);
      }
    }, 140);
  };

  const lidarMudancaNome = (valor: string) => {
    // Aceita somente letras (incluindo acentos) e espacos.
    if (/^[a-zA-Z\u00C0-\u00FF\s]*$/.test(valor)) {
      setNomeTocado(true);
      setNome(valor);
    }
  };

  const enviarMensagem = () => {
    if (!formularioValido) return;

    const textoCompleto = `Olá! Meu nome é ${nomeLimpo}.\n\n${mensagemLimpa}`;
    const textoEncoded = encodeURIComponent(textoCompleto);
    const urlWeb = `https://wa.me/${WHATSAPP_DESENVOLVEDOR}?text=${textoEncoded}`;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    window.open(urlWeb, '_blank', 'noopener,noreferrer');
    aoFechar();
  };

  const lidarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNomeTocado(true);
    setMensagemTocada(true);
    enviarMensagem();
  };

  return (
    <div
      ref={wrapperRef}
      className="absolute inset-0 z-[60] flex items-center justify-end sm:justify-center p-3 sm:p-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] bg-slate-900/60 backdrop-blur-md animate-fade-in"
    >
      <div
        className="bg-white rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.4)] w-full max-w-sm relative flex flex-col max-h-[calc(100dvh-0.75rem)] overflow-hidden"
      >
        {/* Header Premium com Gradiente Esmeralda */}
        <div className={`bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 text-white text-center rounded-t-[2.5rem] relative shrink-0 transition-all ${modoCompacto ? 'p-5' : 'p-8'}`}>
          <button
            onClick={aoFechar}
            className="absolute top-4 right-4 text-white/60 active:text-white active:bg-white/20 active:scale-95 rounded-full p-2 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          {mostrarIcone && (
            <div className={`mb-3 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-md border border-white/30 shadow-inner transition-all ${modoCompacto ? 'w-10 h-10' : 'w-14 h-14'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={`${modoCompacto ? 'w-5 h-5' : 'w-7 h-7'}`}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
          )}

          <h2 className={`font-black tracking-tight ${modoCompacto ? 'text-xl' : 'text-2xl'}`}>Fale Conosco</h2>
          <p className={`text-emerald-50/80 font-medium px-4 mt-1 ${modoCompacto ? 'text-[11px]' : 'text-sm'}`}>
            Duvidas ou sugestoes? Nossa equipe esta pronta para te atender!
          </p>
        </div>

        {/* Form Body (Sem Scroll, responsivo na altura) */}
        <form onSubmit={lidarSubmit} className={`flex-1 overflow-y-auto overscroll-contain flex flex-col ${modoCompacto ? 'gap-3 p-4' : 'gap-5 p-6'} ${tecladoAtivo ? 'pb-[calc(env(safe-area-inset-bottom)+8rem)]' : 'pb-[calc(env(safe-area-inset-bottom)+1rem)]'}`}>
          <div className={modoCompacto ? 'space-y-3' : 'space-y-4'}>
            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="text-[11px] uppercase font-black text-slate-400 tracking-widest block">
                  Seu Nome
                </label>
                <p
                  id="contador-nome"
                  className={`text-sm font-black tracking-wide leading-none ${nomeContadorClasse}`}
                  aria-live="polite"
                >
                  {nomeContador}
                </p>
              </div>
              <input
                ref={refNome}
                type="text"
                value={nome}
                onChange={(e) => lidarMudancaNome(e.target.value)}
                onFocus={(e) => focarCampoVisivel(e.currentTarget, refMensagem.current)}
                onBlur={lidarBlurCampo}
                placeholder="Como podemos te chamar?"
                aria-invalid={nomeErroVisivel}
                aria-describedby="contador-nome"
                className={`w-full text-slate-700 rounded-2xl border-2 focus:bg-white focus:ring-4 outline-none transition-all placeholder:text-slate-300 font-bold text-sm ${nomeErroVisivel ? 'bg-red-50/70 border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'bg-slate-50 border-transparent focus:border-emerald-500 focus:ring-emerald-500/10'} ${modoCompacto ? 'p-3' : 'p-4'}`}
              />
            </div>

            <div className="relative">
              <label className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-1.5 block ml-1">
                Sua Mensagem
              </label>
              <textarea
                ref={refMensagem}
                value={mensagem}
                onChange={(e) => {
                  setMensagemTocada(true);
                  setMensagem(e.target.value);
                }}
                onFocus={(e) => focarCampoVisivel(e.currentTarget, refBotaoEnviar.current)}
                onBlur={lidarBlurCampo}
                placeholder={`Escreva aqui (minimo ${MIN_MENSAGEM} caracteres)...`}
                rows={textareaRows}
                aria-invalid={mensagemErroVisivel}
                aria-describedby="contador-mensagem"
                className={`w-full text-slate-700 rounded-2xl border-2 focus:bg-white focus:ring-4 outline-none transition-all resize-none font-bold text-sm placeholder:text-slate-300 pr-20 ${mensagemErroVisivel ? 'bg-red-50/70 border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'bg-slate-50 border-transparent focus:border-emerald-500 focus:ring-emerald-500/10'} ${modoCompacto ? 'p-3 pb-7' : 'p-4 pb-8'}`}
              />
              <p
                id="contador-mensagem"
                className={`pointer-events-none absolute bottom-3 right-4 text-sm font-black tracking-wide leading-none ${mensagemContadorClasse}`}
                aria-live="polite"
              >
                {mensagemContador}
              </p>
            </div>
          </div>

          {/* Botao de Envio Premium com Borda Dourada e Efeito Shimmer */}
          <button
            ref={refBotaoEnviar}
            type="submit"
            disabled={!formularioValido}
            className={`relative w-full rounded-[1.2rem] transition-all
              ${formularioValido ? 'active:scale-95' : 'opacity-60 cursor-not-allowed'}
            `}
          >
            {/* Borda Premium Dourada */}
            {formularioValido && (
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 rounded-[1.2rem] opacity-100"></div>
            )}

            {/* Conteudo do Botao */}
            <div className={`relative flex items-center justify-center gap-2 m-[2px] py-4 rounded-[calc(1.2rem-2px)] font-black text-sm uppercase tracking-widest overflow-hidden transition-all
              ${formularioValido
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg'
                : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              {/* Feixe de luz dinamico (Shimmer) */}
              {formularioValido && (
                <div className="absolute inset-0 w-full h-full">
                  <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] animate-shimmer"></div>
                </div>
              )}

              <span className="relative z-10">Enviar Mensagem</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 relative z-10">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </div>
          </button>
        </form>

        {/* Footer */}
        <div className="pb-5 pt-1 text-center shrink-0">
          <button
            onClick={aoFechar}
            className="text-slate-400 text-[11px] uppercase font-black tracking-widest active:text-slate-800 active:bg-slate-100 active:scale-95 transition-all py-2 px-6 rounded-full"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Animacao do Shimmer */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-150%); }
          40%, 100% { transform: translateX(250%); }
        }
        .animate-shimmer {
          animation: shimmer 2.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ModalContato;
