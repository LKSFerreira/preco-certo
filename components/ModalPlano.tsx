import React, { useState } from 'react';

// Simulando os tipos que você tem no seu app
type PlanoID = 'plano_cafe' | 'plano_lanche' | 'plano_apoiador';

interface PropsModalPlano {
    aoFechar: () => void;
    aoSelecionarPlano: (plano: PlanoID) => Promise<void>;
}

const ModalPlano: React.FC<PropsModalPlano> = ({ aoFechar, aoSelecionarPlano }) => {
    const [carregando, setCarregando] = useState<PlanoID | null>(null);

    const selecionar = async (plano: PlanoID) => {
        setCarregando(plano);
        try {
            await aoSelecionarPlano(plano);
        } catch (e) {
            alert('Erro ao iniciar pagamento. Tente novamente.');
        } finally {
            setCarregando(null);
        }
    };

    const planos = [
        { id: 'plano_cafe' as PlanoID, nome: 'Café', valor: 'R$ 2,90', dias: 15, destaque: false, microCopy: 'R$ 0,19/dia' },
        { id: 'plano_lanche' as PlanoID, nome: 'Lanche', valor: 'R$ 4,90', dias: 30, destaque: true, microCopy: 'Apenas R$ 0,16/dia' },
        { id: 'plano_apoiador' as PlanoID, nome: 'Apoiador', valor: 'R$ 9,90', dias: 60, destaque: false, microCopy: 'Máximo tempo' },
    ];

    return (
        <>
            <style>
                {`
                    @keyframes fadeInBg { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes slideUpModal { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                    
                    @keyframes ouroFlow { 
                        0% { background-position: 0% 50%; } 
                        100% { background-position: 200% 50%; } 
                    }
                    @keyframes ouroPulse {
                        0%, 100% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.4); }
                        50% { box-shadow: 0 0 25px rgba(245, 158, 11, 0.8); }
                    }
                    @keyframes shineSweep {
                        0% { transform: translateX(-100px) skewX(-20deg); }
                        40%, 100% { transform: translateX(500px) skewX(-20deg); }
                    }

                    .anim-fade-in { animation: fadeInBg 0.3s ease-out forwards; }
                    .anim-slide-up { animation: slideUpModal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    
                    .destaque-border-anim { 
                        animation: ouroFlow 2s linear infinite, ouroPulse 2s ease-in-out infinite; 
                        background-size: 200% auto;
                    }
                `}
            </style>

            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm anim-fade-in">
                {/* Removido o overflow-y-auto e a barra de rolagem, a altura se adapta ao conteúdo inteligentemente */}
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden anim-slide-up ring-1 ring-black/10 flex flex-col">
                    
                    {/* Header Premium - Globalmente menor e espremido dinamicamente em telas pequenas */}
                    <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-600 px-5 py-5 sm:px-6 [@media(max-height:720px)]:py-4 text-white text-center relative overflow-hidden flex-shrink-0">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-900/40 rounded-full blur-3xl"></div>
                        
                        <button 
                            onClick={aoFechar} 
                            disabled={carregando !== null}
                            className="absolute top-3 right-3 p-2 text-emerald-100 active:text-white active:bg-emerald-600/50 rounded-full transition-all disabled:opacity-50"
                            aria-label="Fechar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <span className="inline-block px-4 py-1.5 mb-2 [@media(max-height:720px)]:mb-1.5 text-[10px] sm:text-xs font-black tracking-widest uppercase bg-amber-500 text-amber-950 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                                Experiência Completa
                            </span>
                            
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight [@media(max-height:720px)]:mb-0 mb-1">
                                Planos Premium
                            </h2>
                            {/* Este texto desaparece completamente se a tela for menor que 720px de altura */}
                            <p className="text-sm sm:text-base text-emerald-50 leading-tight px-4 font-medium opacity-90 [@media(max-height:720px)]:hidden">
                                Libere ferramentas exclusivas e apoie o projeto para continuarmos evoluindo.
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-5 py-6 sm:px-7 [@media(max-height:720px)]:px-4 [@media(max-height:720px)]:py-4 bg-white flex-1 relative flex flex-col justify-between">
                        
                        {/* Planos - "Espremidos" dinamicamente */}
                        <div className="flex flex-col gap-3.5 [@media(max-height:720px)]:gap-2.5 mb-6 [@media(max-height:720px)]:mb-4 relative">
                            {planos.map((p) => {
                                const isCarregando = carregando === p.id;
                                const isDesabilitado = carregando !== null;
                                
                                if (p.destaque) {
                                    return (
                                        <div key={p.id} className="relative p-[3px] rounded-[1.2rem] z-10">
                                            <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-yellow-200 to-amber-600 rounded-[1.2rem] destaque-border-anim opacity-100 transition-opacity"></div>
                                            
                                            <button
                                                onClick={() => selecionar(p.id)}
                                                disabled={isDesabilitado}
                                                className={`relative w-full flex items-center justify-between px-4 py-3.5 [@media(max-height:720px)]:py-2.5 [@media(max-height:720px)]:px-3 rounded-[1rem] bg-white transition-all duration-200 text-left
                                                    ${isDesabilitado && !isCarregando ? 'opacity-40 grayscale-[0.5] cursor-not-allowed' : 'active:scale-[0.98] active:bg-amber-50'}
                                                `}
                                            >
                                                <div className="absolute inset-0 overflow-hidden rounded-[1rem] pointer-events-none">
                                                    <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent animate-[shineSweep_4s_ease-in-out_infinite]"></div>
                                                </div>

                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] sm:text-xs font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg border border-amber-400 overflow-hidden">
                                                    Mais Popular
                                                    <div className="absolute top-0 bottom-0 left-0 w-6 bg-white/40 blur-[1px] animate-[shineSweep_4s_ease-in-out_infinite]"></div>
                                                </div>
                                                
                                                <div className="flex-1 mt-1 relative z-10">
                                                    <h3 className="font-black text-lg [@media(max-height:720px)]:text-base text-emerald-800 leading-none">
                                                        {p.nome}
                                                    </h3>
                                                    <p className="text-[13px] text-gray-500 font-medium mt-0.5">{p.dias} dias de acesso</p>
                                                </div>
                                                
                                                <div className="text-right flex flex-col items-end mt-1 relative z-10">
                                                    <div className="text-2xl [@media(max-height:720px)]:text-xl font-black text-emerald-700 leading-none">
                                                        {p.valor}
                                                    </div>
                                                    
                                                    {isCarregando ? (
                                                        <div className="flex items-center gap-1.5 mt-1 text-amber-600">
                                                            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Gerando...</span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[11px] [@media(max-height:720px)]:text-[10px] font-bold mt-1 text-amber-600 bg-amber-50/80 px-2 py-0.5 rounded-md backdrop-blur-sm">
                                                            {p.microCopy}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        </div>
                                    );
                                }

                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => selecionar(p.id)}
                                        disabled={isDesabilitado}
                                        className={`relative w-full flex items-center justify-between px-4 py-3.5 [@media(max-height:720px)]:py-2.5 [@media(max-height:720px)]:px-3 rounded-2xl border-2 transition-all duration-200 text-left
                                            border-gray-100 bg-white active:border-emerald-300 active:bg-emerald-50/50
                                            ${isDesabilitado && !isCarregando ? 'opacity-40 grayscale-[0.5] cursor-not-allowed' : 'active:scale-[0.98]'}
                                        `}
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg [@media(max-height:720px)]:text-base text-gray-800 leading-none">
                                                {p.nome}
                                            </h3>
                                            <p className="text-[13px] text-gray-500 font-medium mt-0.5">{p.dias} dias de acesso</p>
                                        </div>
                                        
                                        <div className="text-right flex flex-col items-end">
                                            <div className="text-xl [@media(max-height:720px)]:text-lg font-black text-gray-900 leading-none">
                                                {p.valor}
                                            </div>
                                            
                                            {isCarregando ? (
                                                <div className="flex items-center gap-1.5 mt-1 text-emerald-600">
                                                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Gerando...</span>
                                                </div>
                                            ) : (
                                                <div className="text-[11px] [@media(max-height:720px)]:text-[10px] font-bold mt-1 text-gray-400">
                                                    {p.microCopy}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Benefícios Premium */}
                        <div className="px-1 relative">
                            <div className="flex items-center justify-center gap-4 mb-4 [@media(max-height:720px)]:mb-3">
                                <div className="h-px bg-gray-200 flex-1"></div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">O QUE VOCÊ GANHA</h4>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>

                            <ul className="space-y-3.5 [@media(max-height:720px)]:space-y-2.5">
                                {[
                                    { titulo: 'Auto Preenchimento com IA ilimitado' },
                                    { titulo: 'Sem limite de itens no Carrinho' },
                                    { titulo: 'Histórico das suas compras' },
                                    { titulo: 'Acompanhe variações de preço' },
                                ].map((item, index) => (
                                    <li key={index} className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 [@media(max-height:720px)]:w-5 [@media(max-height:720px)]:h-5 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-[0_3px_8px_rgba(16,185,129,0.3)]">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3.5} stroke="currentColor" className="w-3.5 h-3.5 [@media(max-height:720px)]:w-3 [@media(max-height:720px)]:h-3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                            </svg>
                                        </div>
                                        <span className="font-bold text-gray-900 text-[14px] [@media(max-height:720px)]:text-[13px] leading-tight">{item.titulo}</span>
                                    </li>
                                ))}
                                
                                {/* Item Novo Destacado - APENAS PARA TELAS GRANDES (Normal) */}
                                <li className="mt-4 pt-1 [@media(max-height:720px)]:hidden">
                                    <div className="flex items-center justify-center gap-3.5 bg-gradient-to-r from-amber-50 to-orange-50 py-3 px-4 rounded-xl border border-amber-200/60 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/40"></div>
                                        <span className="text-[24px] drop-shadow-[0_4px_4px_rgba(245,158,11,0.5)] transform -rotate-6 relative z-10 animate-pulse">
                                            ✨
                                        </span>
                                        <span className="text-[14px] text-amber-900 font-black tracking-tight relative z-10">
                                            Novas funcionalidades premium em breve
                                        </span>
                                    </div>
                                </li>

                                {/* Item Novo Substituído - APENAS PARA TELAS PEQUENAS (Espremido) */}
                                <li className="hidden [@media(max-height:720px)]:flex items-center gap-3">
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100/80 border border-amber-200 flex items-center justify-center shadow-sm">
                                        <span className="text-[10px] transform -translate-y-[1px]">✨</span>
                                    </div>
                                    <span className="font-bold text-amber-700 text-[13px] leading-tight">Novas funcionalidades em breve</span>
                                </li>
                            </ul>
                        </div>
                        
                        {/* Footer direto dentro do card branco */}
                        <div className="pt-6 [@media(max-height:720px)]:pt-4 pb-1 text-center">
                            <button 
                                onClick={aoFechar} 
                                disabled={carregando !== null}
                                className="text-gray-400 text-[13px] font-medium active:text-gray-600 transition-colors underline decoration-gray-300 underline-offset-4 disabled:opacity-50"
                            >
                                Continuar na versão gratuita
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ModalPlano;
