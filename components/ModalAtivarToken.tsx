import React, { useState, useEffect } from 'react';
import { useRepositorios } from '../contextos/ContextoRepositorios';

// =======================================================
// 💎 COMPONENTE: Quantum Core (UX Premium c/ Efeito Rainbow)
// =======================================================
const QuantumCore = ({ status }: { status: 'IDLE' | 'CARREGANDO' | 'SUCESSO' | 'ERRO' }) => {
    // Configurações visuais ultra-premium adaptadas para Fundo Claro (bg-white)
    const themes = {
        IDLE: {
            gradient: 'bg-gradient-to-tr from-slate-500 to-slate-400',
            glow: 'rgba(100, 116, 139, 0.4)', // Sombra mais escura para aparecer no branco
            ringColor: 'stroke-slate-300',
            scale: 'scale-90',
            speed: '10s',
            icon: null,
            pulseClass: ''
        },
        CARREGANDO: {
            gradient: 'bg-gradient-to-tr from-rose-500 via-purple-500 to-cyan-500 animate-rainbow-hue',
            glow: 'rgba(168, 85, 247, 0.5)',
            ringColor: 'stroke-purple-400',
            scale: 'scale-100',
            speed: '1.2s',
            icon: null,
            pulseClass: 'animate-pulse-fast'
        },
        SUCESSO: {
            gradient: 'bg-gradient-to-tr from-rose-500 via-yellow-400 to-emerald-500 animate-rainbow-hue-slow',
            glow: 'rgba(16, 185, 129, 0.5)',
            ringColor: 'stroke-emerald-400',
            scale: 'scale-110',
            speed: '6s',
            icon: 'CHECK',
            pulseClass: ''
        },
        ERRO: {
            gradient: 'bg-gradient-to-tr from-rose-500 to-red-600',
            glow: 'rgba(225, 29, 72, 0.5)',
            ringColor: 'stroke-red-400',
            scale: 'scale-90',
            speed: '0s',
            icon: 'CROSS',
            pulseClass: 'animate-shake'
        }
    };

    const theme = themes[status];

    return (
        <div className="relative flex items-center justify-center w-40 h-40">

            {/* ONDA DE CHOQUE */}
            {status === 'SUCESSO' && <Shockwave />}

            {/* EXPLOSÃO DE PARTÍCULAS (Confetes) */}
            {status === 'SUCESSO' && <ParticleBurst />}

            {/* ANÉIS ORBITAIS (SVG) */}
            <div className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${theme.scale}`}>
                <svg className="w-full h-full animate-spin-slow" viewBox="0 0 160 160" style={{ animationDuration: theme.speed }}>
                    {/* Anel Externo Tracejado */}
                    <circle
                        cx="80" cy="80" r="75"
                        fill="none"
                        className={`transition-colors duration-700 ${theme.ringColor}`}
                        strokeWidth="1"
                        strokeDasharray="4 8"
                        opacity="0.6"
                    />
                    {/* Anel Intermediário com "Cauda de Cometa" */}
                    <circle
                        cx="80" cy="80" r="60"
                        fill="none"
                        className={`transition-colors duration-700 ${theme.ringColor}`}
                        strokeWidth="2"
                        strokeDasharray="80 180"
                        strokeLinecap="round"
                    />
                </svg>
            </div>

            {/* ANEL INTERNO REVERSO */}
            <div className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${theme.scale}`}>
                <svg className="w-full h-full animate-spin-reverse" viewBox="0 0 160 160" style={{ animationDuration: theme.speed }}>
                    <circle
                        cx="80" cy="80" r="48"
                        fill="none"
                        className={`transition-colors duration-700 ${theme.ringColor}`}
                        strokeWidth="1.5"
                        strokeDasharray="40 120"
                        strokeLinecap="round"
                        opacity="0.8"
                    />
                </svg>
            </div>

            {/* NÚCLEO CENTRAL (Glassmorphism + Gradiente Fluido com Rainbow) */}
            <div className={`relative flex items-center justify-center w-20 h-20 rounded-full ${theme.gradient} transition-all duration-700 ease-out z-10 ${theme.scale} ${theme.pulseClass}`}
                style={{
                    boxShadow: `0 0 30px ${theme.glow}, inset 0 0 15px rgba(255,255,255,0.4)`,
                }}>

                {/* Reflexo de Vidro Interno */}
                <div className="absolute inset-1 rounded-full bg-gradient-to-b from-white/40 to-transparent opacity-50 pointer-events-none"></div>

                {/* ÍCONES DESENHADOS DINAMICAMENTE */}
                <div className="z-20 text-white">
                    {theme.icon === 'CHECK' && (
                        <svg className="w-10 h-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path className="animate-draw-check" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    {theme.icon === 'CROSS' && (
                        <svg className="w-10 h-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path className="animate-draw-cross" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    {status === 'CARREGANDO' && (
                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Componentes Auxiliares de Efeito
const Shockwave = () => (
    <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
        {/* Usando emerald em vez de white para aparecer no fundo branco do Modal */}
        <div className="w-20 h-20 rounded-full border-4 border-emerald-400 absolute opacity-0"
            style={{ animation: 'shockwave-anim 0.8s ease-out forwards' }}>
        </div>
    </div>
);

const ParticleBurst = () => {
    const colors = ['bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-cyan-400', 'bg-violet-400', 'bg-fuchsia-400'];
    const particles = Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * 22.5) * (Math.PI / 180);
        const distance = 70 + Math.random() * 40;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const size = 5 + Math.random() * 6;
        const color = colors[i % colors.length];
        return { id: i, x, y, size, delay: Math.random() * 0.15, color };
    });

    return (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            {particles.map(p => (
                <div key={p.id} className={`absolute rounded-full ${p.color}`}
                    style={{
                        width: `${p.size}px`, height: `${p.size}px`,
                        boxShadow: '0 0 8px currentColor',
                        animation: `particle-anim-${p.id} 1s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
                        animationDelay: `${p.delay}s`,
                        opacity: 0
                    }}>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes particle-anim-${p.id} {
                            0% { transform: translate(0, 0) scale(0); opacity: 1; }
                            70% { transform: translate(${p.x}px, ${p.y}px) scale(1); opacity: 1; }
                            100% { transform: translate(${p.x * 1.2}px, ${p.y * 1.2}px) scale(0); opacity: 0; }
                        }
                    `}} />
                </div>
            ))}
        </div>
    );
};

// =======================================================
// 🖥️ COMPONENTE PRINCIPAL: Tela Ativar Token
// =======================================================
interface PropsAtivacaoToken {
    tokenObrigatorioUrl?: string | null;
    aoVoltar: () => void;
    aoIrParaDashboard: () => void;
}

const ModalAtivarToken: React.FC<PropsAtivacaoToken> = ({ tokenObrigatorioUrl, aoVoltar, aoIrParaDashboard }) => {
    const { premium } = useRepositorios();
    const [token, setToken] = useState(tokenObrigatorioUrl || 'SEM-SUSTO-');
    const [status, setStatus] = useState<'IDLE' | 'CARREGANDO' | 'SUCESSO' | 'ERRO'>('IDLE');
    const [mensagemErro, setMensagemErro] = useState('');
    const [diasAtivados, setDiasAtivados] = useState(0);

    // Se chegou o token por URL prop, preenche sozinho e permite que o usuario só aperte "Ativar"
    useEffect(() => {
        if (tokenObrigatorioUrl) {
            setToken(tokenObrigatorioUrl);
        }
    }, [tokenObrigatorioUrl]);

    // Função que acessa a API de Backend sem usar as lógicas de tela (Puro Fetch)
    async function dispararAtivacao() {
        if (!token.trim()) {
            setMensagemErro('Digite seu token de ativação válido.');
            setStatus('ERRO');
            return;
        }

        if (!token.toUpperCase().startsWith('SEM-SUSTO-')) {
            setMensagemErro('O token deve começar com "SEM-SUSTO-". Verifique se copiou corretamente.');
            setStatus('ERRO');
            return;
        }

        setStatus('CARREGANDO');
        setMensagemErro('');

        try {
            const rawFingerprint = typeof navigator !== 'undefined' ? `${navigator.userAgent}-${navigator.language}` : `dispositivo-${Date.now()}`;
            const mockFingerprint = rawFingerprint.substring(0, 255);

            const resposta = await fetch('/api/tokens/ativar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token.toUpperCase(), fingerprint: mockFingerprint }),
            });

            const data = await resposta.json();

            if (!resposta.ok) {
                setStatus('ERRO');
                setMensagemErro(data.erro || 'Erro desconhecido ao ativar plano.');
                return;
            }

            if (data.status === 'ativo' || data.status === 'valido') {
                await premium.salvarTokenHash(token.toUpperCase());
                premium.salvarDiasRestantes(data.dias_restantes);

                setDiasAtivados(data.dias_restantes);
                setStatus('SUCESSO');
                setToken('SEM-SUSTO-'); // Mantém o prefixo limpo após sucesso para UX consistente
            } else {
                setStatus('ERRO');
                setMensagemErro('Este token parece inativo ou não disponível.');
            }
        } catch (erro) {
            console.error('🚨 [Premium UI] Falha de comunicação de ativação:', erro);
            setStatus('ERRO');
            setMensagemErro('Falha de conexão com o servidor. Verifique sua internet.');
        }
    }

    return (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative">

                {/* Fechar Topo Direito - Mais no canto e refinado */}
                <button
                    onClick={aoVoltar}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition-colors w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 z-10"
                    aria-label="Fechar"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-6">
                    {/* Header Estilizado e Mágico */}
                    <div className="flex flex-col items-center text-center">
                        {status === 'SUCESSO' ? (
                            <h2 className="text-2xl font-bold text-emerald-600 mt-2">Acesso Premium ativado</h2>
                        ) : status === 'ERRO' ? (
                            <h2 className="text-2xl font-bold text-red-600 mt-2">Falha no Acesso Premium</h2>
                        ) : (
                            <h2 className="text-2xl font-bold text-gray-800 mt-2">Ativar Acesso Premium</h2>
                        )}

                        {status !== 'SUCESSO' && (
                            <p className="text-sm text-gray-500 mt-2">Insira o token para liberar novas funcionalidades.</p>
                        )}

                        {/* Div do Núcleo com transição fluida de altura e MAIS ESPAÇAMENTO (Respiro) */}
                        <div className={`flex items-center justify-center transition-all duration-700 ease-out z-20 w-full ${status === 'IDLE' || status === 'ERRO'
                            ? 'h-24 mt-6 mb-4 sm:mt-10 sm:mb-6' // Margens menores em telas curtas
                            : status === 'CARREGANDO'
                                ? 'h-40 mt-8 mb-6 sm:h-48 sm:mt-12 sm:mb-8'
                                : 'h-36 mt-8 mb-8 sm:h-40 sm:mt-12 sm:mb-10'
                            }`}>
                            <QuantumCore status={status} />
                        </div>
                    </div>

                    {/* Corpo */}
                    {status === 'SUCESSO' ? (
                        <div className="text-center animate-scale-up space-y-4 sm:space-y-6">
                            <div className="mt-2">
                                <p className="text-lg text-gray-800 font-medium">
                                    Parabéns! <i className="fas fa-heart text-red-500 animate-pulse text-xl inline-block mx-1"></i> sua conta foi ativada.
                                </p>
                                <p className="text-base text-gray-600 mt-2">
                                    Você tem <b className="text-emerald-600 text-xl">{diasAtivados} dias</b> de Premium.
                                </p>
                            </div>

                            <button
                                onClick={aoIrParaDashboard}
                                className="w-full relative group cursor-pointer rounded-xl overflow-hidden p-[3px] transition-all active:scale-95 shadow-xl mt-4 sm:mt-6"
                            >
                                {/* Premium Gradient Layer para o botão Acessar */}
                                <div className="absolute inset-[-500%] bg-[conic-gradient(from_0deg,#10b981,#059669,#06b6d4,#34d399,#10b981)]" style={{ animation: 'border-spin 3s linear infinite' }}></div>

                                <div className="relative w-full h-full rounded-[9px] flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white z-10 transition-colors">
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-[9px]"></div>
                                    <span className="relative z-10 font-bold text-lg uppercase tracking-wide">
                                        Acessar
                                    </span>
                                </div>
                            </button>
                        </div>
                    ) : status === 'CARREGANDO' ? (
                        // 🌟 Animação Incrível de Validação da Chave 🌟
                        <div className="flex items-center justify-center py-4">
                            {/* O Núcleo Quântico é a única estrela do carregamento */}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <label className="block text-xs font-semibold text-gray-600 uppercase">Token de Ativação</label>
                                </div>
                                <div
                                    className={`relative flex items-center w-full py-3 rounded-xl border-2 transition-colors cursor-text ${status === 'ERRO' ? 'border-red-300 bg-red-50' : 'border-gray-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 bg-white shadow-sm'}`}
                                    onClick={() => document.getElementById('token-input')?.focus()}
                                >
                                    {/* Conteúdo Centralizado Fluido */}
                                    <div className="flex w-full items-center justify-center pl-2 pr-10 sm:pr-14">
                                        <span className={`text-base sm:text-lg font-mono font-bold tracking-wider uppercase select-none ${status === 'ERRO' ? 'text-red-600' : 'text-gray-800'}`}>
                                            SEM-SUSTO-
                                        </span>
                                        <input
                                            id="token-input"
                                            type="text"
                                            autoComplete="off"
                                            value={token.replace('SEM-SUSTO-', '')}
                                            maxLength={7}
                                            onChange={(e) => {
                                                const rawSuffix = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                                setToken('SEM-SUSTO-' + rawSuffix.substring(0, 7));
                                            }}
                                            onPaste={(e) => {
                                                e.preventDefault();
                                                const text = e.clipboardData.getData('text').toUpperCase().trim();
                                                let suffix = text;
                                                if (text.startsWith('SEM-SUSTO-')) {
                                                    suffix = text.substring(10);
                                                }
                                                suffix = suffix.replace(/[^A-Z0-9]/g, '');
                                                if (suffix) {
                                                    setToken(('SEM-SUSTO-' + suffix).substring(0, 17));
                                                }
                                            }}
                                            placeholder="123ABCD"
                                            disabled={status === 'CARREGANDO'}
                                            className={`bg-transparent text-base sm:text-lg font-mono font-bold tracking-widest outline-none uppercase placeholder-gray-300 w-24 sm:w-32 ${status === 'ERRO' ? 'text-red-600 focus:text-red-600' : 'text-gray-800 focus:text-gray-800'}`}
                                        />
                                    </div>

                                    {/* Botão de Colar Overlay (Visível se Token for só SEM-SUSTO-) */}
                                    {token === 'SEM-SUSTO-' && status !== 'CARREGANDO' && (
                                        <button
                                            type="button"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                    const text = await navigator.clipboard.readText();
                                                    if (text) {
                                                        const cleanText = text.toUpperCase().trim();
                                                        let suffix = cleanText;
                                                        if (cleanText.startsWith('SEM-SUSTO-')) {
                                                            suffix = cleanText.substring(10);
                                                        }
                                                        suffix = suffix.replace(/[^A-Z0-9]/g, '');
                                                        if (suffix) {
                                                            setToken(('SEM-SUSTO-' + suffix).substring(0, 17));
                                                        }
                                                    }
                                                } catch (err) {
                                                    console.error('Falha ao colar da área de transferência', err);
                                                }
                                            }}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-indigo-50 text-indigo-600 font-bold text-[10px] sm:text-xs py-1.5 px-2 sm:px-3 rounded-lg flex items-center gap-1 transition-colors border border-gray-200 z-10"
                                            title="Colar da Área de Transferência"
                                        >
                                            <i className="fas fa-paste"></i> Colar
                                        </button>
                                    )}
                                </div>
                            </div>

                            {status === 'ERRO' && (
                                <div className="flex flex-col items-center gap-1 animate-shake mt-2 sm:mt-4">
                                    <p className="text-xs sm:text-sm text-red-600 text-center font-bold flex items-center justify-center gap-2">
                                        <i className="fas fa-exclamation-triangle text-base"></i> {mensagemErro || "Token inválido."}
                                    </p>
                                    <p className="text-[10px] sm:text-sm text-gray-500 text-center font-medium mt-1">
                                        Tente novamente ou utilize outro código.
                                    </p>
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    onClick={() => {
                                        if (status === 'ERRO') {
                                            setStatus('IDLE');
                                            setToken('SEM-SUSTO-');
                                        } else {
                                            dispararAtivacao();
                                        }
                                    }}
                                    disabled={status === 'CARREGANDO' || (status !== 'ERRO' && token.length < 16)}
                                    className="w-full relative group cursor-pointer rounded-lg overflow-hidden p-[3px] transition-all active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed shadow-lg"
                                >
                                    {/* Gradient Layer */}
                                    {status !== 'CARREGANDO' && token.length >= 16 && (
                                        <div
                                            className="absolute inset-[-500%] bg-[conic-gradient(from_0deg,#ff0000,#ff8800,#ffff00,#00ff00,#0000ff,#8800ff,#ff0000)]"
                                            style={{ animation: 'border-spin 3s linear infinite' }}
                                        ></div>
                                    )}

                                    {/* Content Layer adaptada para o estado de Erro */}
                                    <div className="relative w-full h-full rounded-[5px] flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white z-10 transition-colors">
                                        {status === 'ERRO' ? (
                                            <>
                                                <i className="fas fa-redo text-lg"></i>
                                                <span className="font-bold text-sm uppercase tracking-wide">Tentar Novamente</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-key text-lg"></i>
                                                <span className="font-bold text-sm uppercase tracking-wide">Ativar Premium</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Secundário Destacado */}
                {status !== 'SUCESSO' && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-[11px] text-gray-400 max-w-[200px]">
                            O token é pessoal e intransferível,<br />
                            com limite de dispositivos.
                        </p>
                        <button onClick={aoVoltar} className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors py-2 px-3 rounded hover:bg-gray-200">
                            Voltar
                        </button>
                    </div>
                )}

                {/* CSS Consolidado de Animações do Quantum Core e da Tela Original */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    /* --- Animações Quantum Core --- */
                    @keyframes rainbow-hue {
                        0% { filter: hue-rotate(0deg) saturate(1.5); }
                        100% { filter: hue-rotate(360deg) saturate(1.5); }
                    }
                    .animate-rainbow-hue { animation: rainbow-hue 1.5s linear infinite; }
                    .animate-rainbow-hue-slow { animation: rainbow-hue 4s linear infinite; }

                    @keyframes spin-slow {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes spin-reverse {
                        from { transform: rotate(360deg); }
                        to { transform: rotate(0deg); }
                    }
                    .animate-spin-slow { animation: spin-slow linear infinite; }
                    .animate-spin-reverse { animation: spin-reverse linear infinite; }
                    
                    @keyframes pulse-fast {
                        0%, 100% { transform: scale(1); filter: brightness(1); }
                        50% { transform: scale(1.05); filter: brightness(1.1); }
                    }
                    .animate-pulse-fast { animation: pulse-fast 1s ease-in-out infinite; }

                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        20%, 60% { transform: translateX(-5px); }
                        40%, 80% { transform: translateX(5px); }
                    }
                    .animate-shake { animation: shake 0.4s ease-in-out; }

                    @keyframes draw {
                        from { stroke-dasharray: 100; stroke-dashoffset: 100; }
                        to { stroke-dasharray: 100; stroke-dashoffset: 0; }
                    }
                    .animate-draw-check { animation: draw 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                    .animate-draw-cross { animation: draw 0.4s ease-out forwards; }

                    @keyframes shockwave-anim {
                        0% { transform: scale(1); opacity: 0.8; border-width: 8px; filter: hue-rotate(0deg); }
                        100% { transform: scale(3.5); opacity: 0; border-width: 0px; filter: hue-rotate(180deg); }
                    }

                    /* --- Animações Originais da Tela --- */
                    @keyframes border-spin {
                        100% { transform: rotate(360deg); }
                    }
                `}} />
            </div>
        </div>
    );
};

export default ModalAtivarToken;