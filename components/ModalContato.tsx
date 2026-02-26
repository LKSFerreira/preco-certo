import React, { useEffect, useRef, useState } from 'react';

/**
 * Numero do WhatsApp do desenvolvedor para contato.
 * Formato: codigo do pais + DDD + numero (sem espacos ou tracos).
 */
const WHATSAPP_DESENVOLVEDOR = '5517996510506';

interface PropsModalContato {
  aoFechar: () => void;
}

/**
 * Modal de contato via WhatsApp.
 *
 * Melhorias aplicadas:
 * - Layout responsivo por ResizeObserver (compacto em telas curtas)
 * - Validacao mais estrita (mensagem com minimo de 30 caracteres)
 * - Feedback visual de envio antes de abrir o WhatsApp
 */
const ModalContato: React.FC<PropsModalContato> = ({ aoFechar }) => {
  const [nome, setNome] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [modoCompacto, setModoCompacto] = useState(false);
  const [textareaRows, setTextareaRows] = useState(4);
  const [mostrarIcone, setMostrarIcone] = useState(true);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutEnvioRef = useRef<number | null>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const altura = entry.contentRect.height;

        setModoCompacto(altura < 640);

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
      if (timeoutEnvioRef.current !== null) {
        window.clearTimeout(timeoutEnvioRef.current);
      }
    };
  }, []);

  const formularioValido = nome.trim().length > 0 && mensagem.trim().length >= 30;

  const lidarMudancaNome = (valor: string) => {
    // Aceita somente letras (incluindo acentos) e espacos.
    if (/^[a-zA-ZÀ-ÿ\s]*$/.test(valor)) {
      setNome(valor);
    }
  };

  const enviarMensagem = () => {
    if (!formularioValido) return;

    const textoCompleto = `Olá! Meu nome é ${nome}.\n\n${mensagem}`;
    const textoEncoded = encodeURIComponent(textoCompleto);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    setEnviado(true);

    timeoutEnvioRef.current = window.setTimeout(() => {
      window.open(`https://wa.me/${WHATSAPP_DESENVOLVEDOR}?text=${textoEncoded}`, '_blank');
      aoFechar();
    }, 1200);
  };

  const lidarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    enviarMensagem();
  };

  return (
    <div
      ref={wrapperRef}
      className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in"
    >
      <div
        className={`bg-white rounded-[2.25rem] shadow-[0_25px_60px_rgba(0,0,0,0.35)] w-full max-w-sm relative flex flex-col transition-all duration-300 max-h-[95%] ${enviado ? 'scale-95 opacity-0' : 'opacity-100'}`}
      >
        <div className={`bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 text-white text-center rounded-t-[2.25rem] relative shrink-0 ${modoCompacto ? 'p-5' : 'p-7'}`}>
          <button
            onClick={aoFechar}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/15 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          {mostrarIcone && (
            <div className={`mb-3 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-md border border-white/30 ${modoCompacto ? 'w-10 h-10' : 'w-14 h-14'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={`${modoCompacto ? 'w-5 h-5' : 'w-7 h-7'}`}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
          )}

          <h2 className={`font-black tracking-tight ${modoCompacto ? 'text-xl' : 'text-2xl'}`}>Fale Conosco</h2>
          <p className={`text-emerald-50/85 font-medium px-4 mt-1 ${modoCompacto ? 'text-[11px]' : 'text-sm'}`}>
            Dúvidas, sugestões ou feedback? Nossa equipe está pronta para te atender.
          </p>
        </div>

        <form onSubmit={lidarSubmit} className={`flex flex-col shrink-0 ${modoCompacto ? 'gap-3 p-4' : 'gap-5 p-6'}`}>
          <div>
            <label className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-1.5 block ml-1">
              Seu Nome
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => lidarMudancaNome(e.target.value)}
              placeholder="Como podemos te chamar?"
              className={`w-full bg-slate-50 text-slate-700 rounded-2xl border-2 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-300 font-bold ${modoCompacto ? 'p-3 text-sm' : 'p-4 text-sm'}`}
            />
          </div>

          <div>
            <label className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-1.5 block ml-1">
              Sua Mensagem
            </label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Escreva aqui (mínimo 30 caracteres)..."
              rows={textareaRows}
              className={`w-full bg-slate-50 text-slate-700 rounded-2xl border-2 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none placeholder:text-slate-300 font-bold ${modoCompacto ? 'p-3 text-sm' : 'p-4 text-sm'}`}
            />
            <p className="mt-1 text-[11px] text-slate-400 text-right">
              {mensagem.trim().length}/30
            </p>
          </div>

          <button
            type="submit"
            disabled={!formularioValido}
            className={`relative w-full rounded-xl font-black uppercase tracking-widest transition-all py-3.5 text-sm ${
              formularioValido
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-700 hover:to-teal-600 active:scale-95 shadow-lg'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Enviar Mensagem
          </button>
        </form>

        <div className="pb-5 pt-1 text-center shrink-0">
          <button
            onClick={aoFechar}
            className="text-slate-400 text-[11px] uppercase font-black tracking-widest hover:text-slate-700 transition-all py-2 px-6 rounded-full"
          >
            Cancelar
          </button>
        </div>
      </div>

      {enviado && (
        <div className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-white/95 rounded-3xl animate-fade-in">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-5 shadow-2xl shadow-emerald-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-10 h-10 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-slate-900">Mensagem Enviada!</h3>
          <p className="text-slate-500 font-bold mt-1">Conectando ao WhatsApp...</p>
        </div>
      )}
    </div>
  );
};

export default ModalContato;
