import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';

interface PropsModalPagamentoAprovado {
  token: string;
  diasAtivados: number;
  plano: string;
  aoAtivarCallback: () => void;
  aoFechar: () => void;
}

const ModalPagamentoAprovado: React.FC<PropsModalPagamentoAprovado> = ({
  token,
  diasAtivados,
  plano,
  aoAtivarCallback,
  aoFechar
}) => {
  const cartaoRef = useRef<HTMLDivElement>(null);
  const [capturando, setCapturando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const urlApp = window.location.origin;
  const urlAtivacao = `${urlApp}/ativar/${token}`;

  const nomePlanoMonitor = plano === 'plano_cafe' ? 'Café' : plano === 'plano_lanche' ? 'Lanche' : 'Apoiador';

  const ativarPlano = () => {
    // Encaminha para o fluxo oficial de ativação com token pré-preenchido.
    aoAtivarCallback();
  };

  const copiarToken = () => {
    navigator.clipboard.writeText(token);
    setCopiado(true);
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setCopiado(false), 2000);
  };

  const enviarWhatsApp = () => {
    const mensagem = encodeURIComponent(`Acabei de gerar um acesso Premium (${nomePlanoMonitor}) no app Sem Susto!\n\nToken: *${token}*\n\nAtive diretamente aqui: ${urlAtivacao}`);
    window.open(`https://wa.me/?text=${mensagem}`, '_blank');
  };

  const baixarScreenshot = async () => {
    if (!cartaoRef.current) return;

    try {
      setCapturando(true);
      // Pequeno delay para garantir que estado CSS de "capturando" aplique (ex: remover sombras pesadas)
      await new Promise(r => setTimeout(r, 100));

      const dataUrl = await toPng(cartaoRef.current, {
        quality: 1.0,
        pixelRatio: 3, // Alta resolução
        style: {
          transform: 'scale(1)', // Garante que não herde transformações da modal
          boxShadow: 'none',
          margin: '0'
        }
      });

      const link = document.createElement('a');
      link.download = `SemSusto-Premium-${token.substring(0, 8)}.png`;
      link.href = dataUrl;
      link.click();

    } catch (err) {
      console.error('Erro ao gerar imagem', err);
      alert('Não foi possível gerar a imagem no momento.');
    } finally {
      setCapturando(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[70] flex flex-col items-center justify-center p-4 bg-black/85 animate-fade-in backdrop-blur-md">

      {/* Botão Fechar Global */}
      <button
        onClick={aoFechar}
        className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      {/* Título Superior */}
      <div className="text-center mb-6 animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-emerald-400">
             <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">Pagamento Aprovado</h2>
        <p className="text-emerald-300 font-medium mt-1">Seu acesso premium foi gerado com sucesso!</p>
      </div>

      {/* Cartão Capturável */}
      <div className="relative w-full max-w-sm shrink-0 animate-slide-up perspective-1000" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>

        {/* Este é o elemento que será transformado em PNG */}
        <div
          ref={cartaoRef}
          className={`relative bg-gradient-to-br from-indigo-900 via-slate-900 to-black rounded-2xl overflow-hidden border border-white/10 ${capturando ? 'rounded-none' : 'shadow-[0_20px_50px_rgba(0,0,0,0.5)]'}`}
        >
          {/* Efeitos de fundo do Cartão */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

          <div className="relative p-6 z-10">
            {/* Header Cartão */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Plano Ativo</span>
                <h3 className="text-2xl font-bold text-white mt-0.5">{nomePlanoMonitor}</h3>
              </div>
              <div className="flex bg-white/10 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm">
                <span className="text-xs font-bold text-white">{diasAtivados} DIAS</span>
              </div>
            </div>

            {/* Token Central Exibição */}
            <div className="mb-6">
              <label className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2 block">Código de Acesso Exclusivo</label>
              <div
                onClick={!capturando ? copiarToken : undefined}
                className={`bg-black/40 border ${copiado ? 'border-emerald-500' : 'border-slate-700 hover:border-slate-500'} rounded-xl p-4 flex items-center justify-between transition-colors ${!capturando ? 'cursor-pointer' : ''} group`}
              >
                <div className="font-mono text-lg font-bold tracking-widest text-white">
                  {token}
                </div>
                {!capturando && (
                   <div className={`p-2 rounded-lg ${copiado ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-300 group-hover:bg-white/10'}`}>
                    {copiado ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Cartão */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
              <div className="flex items-center gap-2 text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-500">
                  <path d="M4.5 3.75a3 3 0 0 0-3 3v.75h21v-.75a3 3 0 0 0-3-3h-15Z" />
                  <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-7.5Zm-18 3.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-bold tracking-wide">Sem Susto</span>
              </div>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest">Acesso Pessoal</span>
            </div>
          </div>

          {/* Marca d'água na captura */}
          {capturando && (
            <div className="absolute bottom-4 right-4 text-[8px] text-white/30 uppercase tracking-widest">
              semsusto.app
            </div>
          )}
        </div>

        {/* Glow sub-card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-2xl blur-xl opacity-20 -z-10 animate-pulse-slow"></div>
      </div>

      {/* Ações Inferiores (Fora do Cartão Capturável) */}
      <div className="w-full max-w-sm mt-8 space-y-3 animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>

        {/* Ativar Diretamente */}
        <button
          onClick={ativarPlano}
          className="w-full relative group overflow-hidden rounded-xl p-[2px] transition-all active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 rounded-xl"></div>
          <div className="relative bg-black rounded-[10px] py-4 flex items-center justify-center gap-2 group-hover:bg-black/80 transition-colors">
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200 uppercase tracking-widest">
              Ativar Acesso Agora
            </span>
          </div>
        </button>

        {/* Grupo Botões Compartilhar/Salvar */}
        <div className="grid grid-cols-2 gap-3">
          {/* WhatsApp */}
          <button
            onClick={enviarWhatsApp}
            className="flex flex-col items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/15 rounded-xl border border-white/5 transition-all outline-none"
          >
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
               <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
               </svg>
            </div>
            <span className="text-xs font-bold text-slate-300">WhatsApp</span>
          </button>

          {/* Salvar Imagem Galeria */}
          <button
            onClick={baixarScreenshot}
            disabled={capturando}
            className={`flex flex-col items-center justify-center gap-2 py-3 ${capturando ? 'bg-white/5 opacity-50' : 'bg-white/10 hover:bg-white/15'} rounded-xl border border-white/5 transition-all outline-none`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              {capturando ? (
                <svg className="animate-spin w-5 h-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              )}
            </div>
            <span className="text-xs font-bold text-slate-300">Salvar Foto</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.05); } }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
};

export default ModalPagamentoAprovado;
