import React, { useState, useEffect, useRef } from 'react';

type PlanoID = 'plano_cafe' | 'plano_lanche' | 'plano_apoiador';

interface PropsModalPlano {
    aoFechar: () => void;
    aoSelecionarPlano: (plano: PlanoID) => Promise<void>;
}

const ModalPlano: React.FC<PropsModalPlano> = ({ aoFechar, aoSelecionarPlano }) => {
    const [carregando, setCarregando] = useState<PlanoID | null>(null);
    const [planoSelecionado, setPlanoSelecionado] = useState<PlanoID | null>(null);
    const PLANO_RECOMENDADO: PlanoID = 'plano_lanche';
    const [planoDestaque, setPlanoDestaque] = useState<PlanoID>(PLANO_RECOMENDADO);
    const [confeteAtivo, setConfeteAtivo] = useState(false);
    const confeteTimerRef = useRef<number | null>(null);

    const [tamanhoTela, setTamanhoTela] = useState('normal');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const height = entry.contentRect.height;
                if (height < 720) {
                    setTamanhoTela('muito-compacto');
                } else {
                    setTamanhoTela('normal');
                }
            }
        });

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const isMuitoCompacto = tamanhoTela === 'muito-compacto';

    useEffect(() => {
        return () => {
            if (confeteTimerRef.current !== null) {
                window.clearTimeout(confeteTimerRef.current);
            }
        };
    }, []);

    const selecionar = async (plano: PlanoID) => {
        setPlanoSelecionado(plano);

        if (plano !== PLANO_RECOMENDADO) {
            setPlanoDestaque(plano);
            setConfeteAtivo(false);
            if (confeteTimerRef.current !== null) {
                window.clearTimeout(confeteTimerRef.current);
                confeteTimerRef.current = null;
            }
        } else {
            setPlanoDestaque(PLANO_RECOMENDADO);
            if (confeteTimerRef.current !== null) {
                window.clearTimeout(confeteTimerRef.current);
            }
            setConfeteAtivo(true);
            confeteTimerRef.current = window.setTimeout(() => {
                setConfeteAtivo(false);
                confeteTimerRef.current = null;
            }, 2000);
        }

        setCarregando(plano);
        try {
            await aoSelecionarPlano(plano);
        } catch {
            alert('Erro ao iniciar pagamento. Tente novamente.');
        } finally {
            setCarregando(null);
        }
    };

    const planos = [
        { id: 'plano_cafe' as PlanoID, nome: 'Cafe', valor: 'R$ 2,90', dias: 15, microCopy: 'R$ 0,19/dia' },
        { id: 'plano_lanche' as PlanoID, nome: 'Lanche', valor: 'R$ 4,90', dias: 30, microCopy: 'Apenas R$ 0,16/dia' },
        { id: 'plano_apoiador' as PlanoID, nome: 'Apoiador', valor: 'R$ 9,90', dias: 60, microCopy: 'Maximo tempo' },
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
                    @keyframes shineSweep {
                        0% { transform: translateX(-100px) skewX(-20deg); }
                        40%, 100% { transform: translateX(500px) skewX(-20deg); }
                    }
                    @keyframes fireworkRing {
                        0% { transform: translate(-50%, -50%) scale(0.15); opacity: 0; }
                        20% { opacity: 0.9; }
                        100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0; }
                    }
                    @keyframes fireworkCore {
                        0% { transform: translate(-50%, -50%) scale(0.1); opacity: 0; }
                        25% { opacity: 1; }
                        100% { transform: translate(-50%, -50%) scale(0.65); opacity: 0; }
                    }
                    @keyframes fireworkSpark {
                        0% { transform: translateY(-6px) scale(0.35); opacity: 0; }
                        22% { opacity: 1; }
                        100% { transform: translateY(-52px) scale(1); opacity: 0; }
                    }

                    .anim-fade-in { animation: fadeInBg 0.3s ease-out forwards; }
                    .anim-slide-up { animation: slideUpModal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

                    .destaque-border-anim {
                        animation: ouroFlow 3.2s linear infinite;
                        background-size: 220% auto;
                    }
                    .firework-ring { animation: fireworkRing 900ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    .firework-core { animation: fireworkCore 800ms ease-out forwards; }
                    .firework-spark { animation: fireworkSpark 820ms cubic-bezier(0.12, 0.9, 0.25, 1) forwards; }
                `}
            </style>

            <div ref={containerRef} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm anim-fade-in overflow-y-auto">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md max-h-[calc(100dvh-1rem)] overflow-hidden anim-slide-up ring-1 ring-black/10 flex flex-col">

                    <div className={`bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-600 px-5 sm:px-6 ${isMuitoCompacto ? 'py-4' : 'py-5'} text-white text-center relative overflow-hidden flex-shrink-0`}>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-900/40 rounded-full blur-3xl pointer-events-none"></div>

                        <button
                            onClick={aoFechar}
                            disabled={carregando !== null}
                            className="absolute top-3 right-3 z-20 p-2 text-emerald-100 active:text-white active:bg-emerald-600/50 rounded-full transition-all disabled:opacity-50"
                            aria-label="Fechar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="relative z-10 flex flex-col items-center">
                            <span className={`inline-block px-4 py-1.5 ${isMuitoCompacto ? 'mb-1.5' : 'mb-2'} text-[10px] sm:text-xs font-black tracking-widest uppercase bg-amber-500 text-amber-950 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)]`}>
                                Experiencia Completa
                            </span>

                            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isMuitoCompacto ? 'mb-0' : 'mb-1'}`}>
                                Planos Premium
                            </h2>
                            {!isMuitoCompacto && (
                                <p className="text-sm sm:text-base text-emerald-50 leading-tight px-4 font-medium opacity-90">
                                    Libere ferramentas exclusivas e apoie o projeto para continuarmos evoluindo.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={`flex-1 relative flex flex-col justify-between bg-white overflow-y-auto ${isMuitoCompacto ? 'px-4 py-4' : 'px-5 py-6 sm:px-7'}`}>

                        <div className={`flex flex-col relative ${isMuitoCompacto ? 'gap-2.5 mb-4' : 'gap-3.5 mb-6'}`}>
                            {planos.map((p) => {
                                const isSelecionado = planoSelecionado === p.id;
                                const isCarregando = carregando === p.id;
                                const isDesabilitado = carregando !== null && !isSelecionado;
                                const isDestaque = planoDestaque === p.id;
                                const mostrarSeloMaisPopular = isDestaque && p.id === PLANO_RECOMENDADO;
                                const isPremiumSelecionado = isSelecionado && p.id === PLANO_RECOMENDADO;
                                const confeteNoCard = confeteAtivo && p.id === PLANO_RECOMENDADO;

                                return (
                                    <div
                                        key={p.id}
                                        className={`relative transition-all duration-150 ${isDestaque ? 'p-[3px] rounded-[1.2rem]' : ''} ${isSelecionado ? 'scale-[1.01]' : ''} ${isDesabilitado ? 'opacity-60' : ''}`}
                                    >
                                        {isDestaque && (
                                            <div className="absolute inset-0 rounded-[1.2rem] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 destaque-border-anim"></div>
                                        )}

                                        <button
                                            onClick={() => selecionar(p.id)}
                                            disabled={isDesabilitado}
                                            aria-pressed={isSelecionado}
                                            className={`relative w-full touch-manipulation flex items-center justify-between ${isMuitoCompacto ? 'px-3 py-2.5' : 'px-4 py-3.5'} rounded-[1rem] border-2 transition-transform transition-shadow transition-colors duration-120 ease-out text-left
                                                ${isDestaque ? 'border-transparent bg-white' : 'border-gray-100 bg-white'}
                                                ${isPremiumSelecionado ? 'ring-2 ring-amber-400 shadow-[0_0_0_2px_rgba(251,191,36,0.45),0_10px_28px_rgba(245,158,11,0.34)]' : ''}
                                                ${isSelecionado && !isPremiumSelecionado ? 'border-amber-400 ring-2 ring-amber-200 bg-amber-50/85 shadow-[0_0_0_2px_rgba(251,191,36,0.34),0_12px_24px_rgba(245,158,11,0.2)]' : ''}
                                                ${isDesabilitado ? 'cursor-not-allowed' : 'active:scale-[0.985] active:shadow-[0_4px_10px_rgba(17,24,39,0.10)] active:bg-black/[0.02]'}
                                            `}
                                        >
                                            {isDestaque && (
                                                <div className="absolute inset-0 overflow-hidden rounded-[1rem] pointer-events-none">
                                                    <div className={`absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-transparent via-amber-100/45 to-transparent ${isPremiumSelecionado ? 'animate-[shineSweep_3.2s_ease-in-out_infinite]' : 'animate-[shineSweep_4.6s_ease-in-out_infinite]'}`}></div>
                                                </div>
                                            )}

                                            {mostrarSeloMaisPopular && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] sm:text-xs font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg border border-amber-400 overflow-hidden">
                                                    Mais Popular
                                                    <div className="absolute top-0 bottom-0 left-0 w-6 bg-white/40 blur-[1px] animate-[shineSweep_4s_ease-in-out_infinite]"></div>
                                                </div>
                                            )}

                                            {confeteNoCard && (
                                                <div className="absolute inset-0 pointer-events-none overflow-visible">
                                                    {[
                                                        { left: '22%', top: '34%', delay: 0 },
                                                        { left: '50%', top: '24%', delay: 180 },
                                                        { left: '78%', top: '34%', delay: 340 },
                                                    ].map((f, fireworkIndex) => {
                                                        return (
                                                            <div key={fireworkIndex} className="absolute w-1 h-1" style={{ left: f.left, top: f.top }}>
                                                                <span
                                                                    className="firework-ring absolute left-1/2 top-1/2 w-16 h-16 rounded-full border-2 border-amber-300/90"
                                                                    style={{ animationDelay: `${f.delay}ms` }}
                                                                />
                                                                <span
                                                                    className="firework-core absolute left-1/2 top-1/2 w-3 h-3 rounded-full bg-gradient-to-b from-amber-200 to-amber-500 shadow-[0_0_14px_rgba(251,191,36,0.9)]"
                                                                    style={{ animationDelay: `${f.delay + 30}ms` }}
                                                                />
                                                                {Array.from({ length: 12 }).map((_, sparkIndex) => (
                                                                    <span key={sparkIndex} className="absolute left-1/2 top-1/2" style={{ transform: `rotate(${sparkIndex * 30}deg)` }}>
                                                                        <span
                                                                            className={`firework-spark absolute left-1/2 top-1/2 w-1.5 h-3 rounded-full ${
                                                                                sparkIndex % 3 === 0 ? 'bg-amber-300' : sparkIndex % 3 === 1 ? 'bg-yellow-300' : 'bg-orange-400'
                                                                            } shadow-[0_0_8px_rgba(251,191,36,0.75)]`}
                                                                            style={{ animationDelay: `${f.delay + 50 + sparkIndex * 12}ms` }}
                                                                        />
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            <div className="flex-1 mt-1 relative z-10">
                                                <h3 className={`font-black ${isMuitoCompacto ? 'text-base' : 'text-lg'} ${isDestaque ? 'text-emerald-800' : 'text-gray-800'} leading-none`}>
                                                    {p.nome}
                                                </h3>
                                                <p className="text-[13px] text-gray-500 font-medium mt-0.5">{p.dias} dias de acesso</p>
                                            </div>

                                            <div className="text-right flex flex-col items-end mt-1 relative z-10">
                                                <div className={`${isMuitoCompacto ? 'text-lg' : 'text-2xl'} font-black ${isSelecionado ? 'text-amber-700' : 'text-gray-900'} leading-none`}>
                                                    {p.valor}
                                                </div>

                                                {isCarregando ? (
                                                    <div className="flex items-center gap-1.5 mt-1 text-amber-600">
                                                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Gerando...</span>
                                                    </div>
                                                ) : (
                                                    <div className={`font-bold mt-1 px-2 py-0.5 rounded-md backdrop-blur-sm ${isMuitoCompacto ? 'text-[10px]' : 'text-[11px]'} ${isSelecionado || isDestaque ? 'text-amber-700 bg-amber-50/85' : 'text-gray-400'}`}>
                                                        {p.microCopy}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="px-1 relative">
                            <div className={`flex items-center justify-center gap-4 ${isMuitoCompacto ? 'mb-3' : 'mb-4'}`}>
                                <div className="h-px bg-gray-200 flex-1"></div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">O QUE VOCE GANHA</h4>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>

                            <ul className={`space-y-3.5 ${isMuitoCompacto ? 'space-y-2.5' : ''}`}>
                                {[
                                    { titulo: 'Auto Preenchimento com IA ilimitado' },
                                    { titulo: 'Sem limite de itens no Carrinho' },
                                    { titulo: 'Historico das suas compras' },
                                    { titulo: 'Acompanhe variações de preço' },
                                ].map((item, index) => (
                                    <li key={index} className="flex items-center gap-3">
                                        <div className={`flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-[0_3px_8px_rgba(16,185,129,0.3)] ${isMuitoCompacto ? 'w-5 h-5' : 'w-6 h-6'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3.5} stroke="currentColor" className={`${isMuitoCompacto ? 'w-3 h-3' : 'w-3.5 h-3.5'}`}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                            </svg>
                                        </div>
                                        <span className={`font-bold text-gray-900 leading-tight ${isMuitoCompacto ? 'text-[13px]' : 'text-[14px]'}`}>{item.titulo}</span>
                                    </li>
                                ))}

                                {!isMuitoCompacto ? (
                                    <li className="mt-4 pt-1">
                                        <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 py-3 px-4 rounded-xl border border-amber-200/70 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/40"></div>
                                            <span className="relative z-10 flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 shadow-[0_3px_8px_rgba(245,158,11,0.35)] flex items-center justify-center">
                                                <span className="text-[13px] leading-none">✨</span>
                                            </span>
                                            <span className="text-[14px] text-amber-900 font-black tracking-tight relative z-10">
                                                Novas funcionalidades premium em breve
                                            </span>
                                        </div>
                                    </li>
                                ) : (
                                    <li className="flex items-center gap-3">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 shadow-[0_3px_8px_rgba(245,158,11,0.35)] flex items-center justify-center">
                                            <span className="text-[11px] leading-none">✨</span>
                                        </span>
                                        <span className="font-bold text-amber-700 text-[13px] leading-tight">Novas funcionalidades em breve</span>
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className={`text-center pb-1 ${isMuitoCompacto ? 'pt-4' : 'pt-6'}`}>
                            <button
                                onClick={aoFechar}
                                disabled={carregando !== null}
                                className="text-gray-400 text-[13px] font-medium active:text-gray-600 transition-colors underline decoration-gray-300 underline-offset-4 disabled:opacity-50"
                            >
                                Continuar na versao gratuita
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ModalPlano;
