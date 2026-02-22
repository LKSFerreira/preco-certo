import React, { useState, useEffect } from 'react';

import { useTutorialFotoPrimeiroUso, CHAVE_TUTORIAL_FOTO_VISTO } from '../hooks/useTutorialFoto';

// Configuração da velocidade da animação (em milissegundos). 
const VELOCIDADE_ANIMACAO_MS = 6000;

// Configuração do zoom que o produto dá ao se aproximar para a foto.
const ZOOM_FOTO = 1.10;

interface PropsTutorialFoto {
    aoFechar: () => void;
}

/**
 * Tutorial visual de foto (Tela Única).
 * Cena ilustrativa realista.
 * Ensina que o zoom deve focar no rótulo completo (da marca ao peso) dentro do visor.
 */
export const ModalTutorialFoto: React.FC<PropsTutorialFoto> = ({ aoFechar }) => {
    // Estado para controlar a direção do descarte: 1 para direita, -1 para esquerda
    const [direcaoDescarte, setDirecaoDescarte] = useState(1);

    const finalizarTutorial = () => {
        localStorage.setItem(CHAVE_TUTORIAL_FOTO_VISTO, 'true');
        aoFechar();
    };

    // Efeito para sortear a direção do descarte a cada ciclo de animação
    useEffect(() => {
        const intervaloPrincipal = setInterval(() => {
            setDirecaoDescarte(Math.random() > 0.5 ? 1 : -1);
        }, VELOCIDADE_ANIMACAO_MS);

        return () => clearInterval(intervaloPrincipal);
    }, []);

    return (
        <div
            className="fixed inset-0 z-[110] flex flex-col bg-gradient-to-b from-blue-600 to-blue-900 font-sans"
            style={{
                '--duracao-animacao': `${VELOCIDADE_ANIMACAO_MS}ms`,
                '--zoom-foto': ZOOM_FOTO,
                // Passamos a direção do descarte para o CSS ler
                '--descarte-x': `${direcaoDescarte * 200}px`,
                '--descarte-rotacao': `${direcaoDescarte * 25}deg`
            } as React.CSSProperties}
        >

            {/* Fundo decorativo sutil */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>

            <div className="relative flex-1 flex flex-col justify-between z-10 px-6 py-10 max-w-md mx-auto w-full">

                {/* Cabeçalho */}
                <div className="text-center animate-fade-in mt-2">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg backdrop-blur-sm">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <h1 className="text-white text-3xl font-black tracking-tight mb-2">
                        Dica de Ouro
                    </h1>
                    <p className="text-blue-200 text-base">
                        Para o app reconhecer rapidinho:
                    </p>
                </div>

                {/* Área da Animação Explicativa (Não clicável) */}
                <div className="relative w-full aspect-[3/4] bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20 flex flex-col items-center justify-center p-6 shadow-2xl pointer-events-none mt-4">

                    {/* Texto de Instrução Animado */}
                    <div className="mb-6 text-center h-12 flex items-center justify-center">
                        <p className="text-white font-bold text-md animate-text-instruction-sync">
                            <span className="text-green-400 font-bold">Enquadre o rótulo da frente</span> bem nítido!
                        </p>
                    </div>

                    {/* Visor da Câmera Animado (com overflow-hidden para cortar o que sai da tela) */}
                    <div className="relative w-full max-w-[240px] aspect-[4/5] flex items-center justify-center rounded-2xl bg-black/40 overflow-hidden shadow-inner backdrop-blur-sm border border-white/10">

                        {/* Marcadores de Foco da Câmera (Crosshairs) */}
                        <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg border-white/50 animate-camera-frame-sync z-20"></div>
                        <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg border-white/50 animate-camera-frame-sync z-20"></div>
                        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg border-white/50 animate-camera-frame-sync z-20"></div>
                        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 rounded-br-lg border-white/50 animate-camera-frame-sync z-20"></div>

                        {/* =======================================================
                            CENA DO PRODUTO 
                            O zoom (scale) fará a caixa preencher o espaço ideal
                            e depois ela será descartada usando as variáveis CSS
                        ======================================================= */}
                        <div className="animate-product-focus-sync relative flex items-center justify-center z-10 w-full h-full">

                            {/* CAIXA DE CEREAL REALISTA */}
                            <div className="relative w-[180px] h-[245px] bg-gradient-to-br from-red-600 to-red-800 rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden border border-red-500">

                                {/* Raio Amarelo de Fundo (Clip-Path) */}
                                <div
                                    className="absolute top-[5%] left-0 w-full h-[80%] bg-[#FFD700]"
                                    style={{ clipPath: 'polygon(60% 0%, 100% 0%, 65% 45%, 90% 45%, 40% 100%, 55% 55%, 30% 55%)' }}
                                ></div>

                                {/* Selo Embalagem Econômica */}
                                <div className="absolute top-2 left-2 bg-[#FFD700] px-1.5 py-1 rounded-sm shadow-sm">
                                    <p className="text-[#0d47a1] text-[6px] font-black leading-none text-center">
                                        EMBALAGEM<br />ECONÔMICA
                                    </p>
                                </div>

                                {/* Selo Alto em Açúcar */}
                                <div className="absolute top-0 right-4 bg-white border border-black px-1.5 py-1 rounded-b-lg shadow-sm">
                                    <p className="text-black text-[5px] font-bold leading-none text-center">
                                        ALTO EM<br />AÇÚCAR
                                    </p>
                                </div>

                                {/* NOME DO PRODUTO */}
                                <div className="absolute top-14 w-full text-center transform -rotate-3 z-10">
                                    <h2 className="text-[38px] font-black text-[#0d47a1] tracking-tighter drop-shadow-md leading-none" style={{ WebkitTextStroke: '1px white' }}>
                                        CEREAL
                                    </h2>
                                </div>

                                {/* Imagem Ilustrativa */}
                                <div className="absolute bottom-11 left-1/2 -translate-x-1/2 w-28 h-28 flex justify-center items-center z-10">
                                    {/* Sombra da tigela */}
                                    <div className="absolute w-24 h-24 bg-black/30 rounded-full blur-md translate-y-2"></div>

                                    {/* Tigela Vermelha */}
                                    <div className="relative w-20 h-20 bg-red-600 rounded-full shadow-lg border-[3px] border-red-500 flex items-center justify-center overflow-hidden z-10">
                                        {/* Leite */}
                                        <div className="absolute w-16 h-16 bg-white rounded-full shadow-inner opacity-90"></div>

                                        {/* Bolinhas de Cereal na Tigela espalhadas */}
                                        <div className="absolute top-2 left-3 w-4 h-4 bg-[#4e342e] rounded-full shadow-sm border border-[#3e2723]"></div>
                                        <div className="absolute top-3 right-3 w-5 h-5 bg-[#5d4037] rounded-full shadow-sm border border-[#3e2723]"></div>
                                        <div className="absolute bottom-3 left-4 w-4 h-4 bg-[#4e342e] rounded-full shadow-sm border border-[#3e2723]"></div>
                                        <div className="absolute bottom-2 right-4 w-5 h-5 bg-[#5d4037] rounded-full shadow-sm border border-[#3e2723]"></div>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#4e342e] rounded-full shadow-sm border border-[#3e2723]"></div>
                                    </div>

                                    {/* Bolinhas explodindo pra fora */}
                                    <div className="absolute -top-1 right-1 w-4 h-4 bg-[#5d4037] rounded-full shadow-lg border border-[#3e2723] z-20"></div>
                                    <div className="absolute -bottom-2 -left-1 w-3 h-3 bg-[#4e342e] rounded-full shadow-lg border border-[#3e2723] z-20"></div>
                                </div>

                                {/* Peso */}
                                <div className="absolute bottom-3 right-4">
                                    <p className="text-white text-[8px] font-black tracking-widest">770 g</p>
                                </div>
                            </div>
                        </div>

                        {/* Efeito de Flash Fotográfico */}
                        <div className="absolute inset-0 bg-white animate-camera-flash-sync z-30 pointer-events-none opacity-0"></div>

                        {/* Check de Foto Perfeita */}
                        <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm animate-photo-success-sync z-40 opacity-0">
                            <div className="flex flex-col items-center">
                                <div className="bg-green-500 rounded-full w-16 h-16 flex items-center justify-center shadow-lg shadow-green-500/50 mb-2">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span className="text-white font-bold bg-green-600/90 px-5 py-1.5 rounded-full text-sm backdrop-blur-md shadow-lg">
                                    Rótulo Legível!
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Dicas Textuais de Reforço Positivo */}
                    <div className="flex flex-col gap-3 w-full mt-8 animate-tips-fade-in">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            <span className="text-white/90 text-md font-medium">Mostre a marca e o nome do produto</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            <span className="text-white/90 text-md font-medium">Garanta que o texto esteja legível</span>
                        </div>
                    </div>

                </div>

                {/* Botão de Ação Único com Animação Sincronizada */}
                <div className="mt-8 mb-4">
                    <button
                        onClick={finalizarTutorial}
                        className="w-full bg-green-500 text-white text-xl font-bold py-5 rounded-2xl shadow-[0_8px_30px_rgba(34,197,94,0.4)] hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-3 animate-button-pulse-sync"
                    >
                        <span>Entendi, abrir câmera!</span>
                        <span className="text-2xl">📸</span>
                    </button>
                </div>

            </div>

            {/* Estilos para a história animada controlada pela variável CSS --duracao-animacao */}
            <style>{`
                /* Fade inicial do componente */
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
                .animate-tips-fade-in { animation: fadeIn 0.8s ease-out forwards; animation-delay: 0.2s; opacity: 0; }
                
                /* 1. Produto aproximando e descarte aleatório */
                @keyframes productFocusSync {
                    /* Nasce invisível e menor no fundo para esconder o reset */
                    0%, 5% { transform: scale(0.65) rotate(-5deg) translateY(20px) translateX(0); filter: blur(3px); opacity: 0; }
                    
                    /* ZOOM IDEAL: A caixa cresce usando a variável e estabiliza para o flash */
                    15%, 55% { transform: scale(var(--zoom-foto)) rotate(0deg) translateY(-2px) translateX(0); filter: blur(0px); opacity: 1; }
                    
                    /* DESCARTE: Jogada para fora (swipe) na direção decidida pelo React após o sucesso */
                    65%, 100% { transform: scale(var(--zoom-foto)) translateX(var(--descarte-x)) rotate(var(--descarte-rotacao)); opacity: 0; filter: blur(2px); }
                }
                .animate-product-focus-sync { animation: productFocusSync var(--duracao-animacao) infinite cubic-bezier(0.25, 1, 0.5, 1); }

                /* 2. Cores da moldura da câmera (Branco -> Verde quando focado) */
                @keyframes cameraFrameSync {
                    0%, 30% { border-color: rgba(255,255,255,0.4); transform: scale(1.1); }
                    35%, 55% { border-color: #22c55e; transform: scale(1); } /* Verde: Foco travado! */
                    75%, 100% { border-color: rgba(255,255,255,0.4); transform: scale(1.1); }
                }
                .animate-camera-frame-sync { animation: cameraFrameSync var(--duracao-animacao) infinite ease-out; }

                /* 3. O Flash da Foto (Dispara aos 45%) */
                @keyframes cameraFlashSync {
                    0%, 43% { opacity: 0; }
                    45% { opacity: 1; } /* Flash! */
                    50%, 100% { opacity: 0; }
                }
                .animate-camera-flash-sync { animation: cameraFlashSync var(--duracao-animacao) infinite; }

                /* 4. Feedback de Sucesso (Aparece logo após o flash: 48% a 65%) */
                @keyframes photoSuccessSync {
                    0%, 47% { opacity: 0; transform: scale(0.8); }
                    49%, 60% { opacity: 1; transform: scale(1); }
                    65%, 100% { opacity: 0; transform: scale(1.1); }
                }
                .animate-photo-success-sync { animation: photoSuccessSync var(--duracao-animacao) infinite cubic-bezier(0.34, 1.56, 0.64, 1); }

                /* 5. Destaca o texto de instrução no momento do foco */
                @keyframes textInstructionSync {
                    0%, 30% { opacity: 0.7; transform: scale(0.98); }
                    35%, 60% { opacity: 1; transform: scale(1.02); text-shadow: 0 0 10px rgba(74, 222, 128, 0.3); }
                    75%, 100% { opacity: 0.7; transform: scale(0.98); }
                }
                .animate-text-instruction-sync { animation: textInstructionSync var(--duracao-animacao) infinite ease-in-out; }

                /* 6. PULSO ÚNICO DO BOTÃO: Apenas 1 "hit" fluído (75% a 95%) */
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
 * Componente principal (Preview)
 */
export default function AppPrincipal() {
    const { deveExibir, marcarComoVista } = useTutorialFotoPrimeiroUso();
    const [visivel, setVisivel] = useState(deveExibir());

    const fechar = () => {
        marcarComoVista();
        setVisivel(false);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Simulador: Tela Foto Rótulo</h2>
                <p className="text-slate-600 mb-6">O modal da foto deve estar sendo exibido agora.</p>
                <button
                    onClick={() => {
                        localStorage.removeItem(CHAVE_TUTORIAL_FOTO_VISTO);
                        window.location.reload();
                    }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:bg-blue-700"
                >
                    Resetar / Ver Tutorial Novamente
                </button>
            </div>

            {visivel && <ModalTutorialFoto aoFechar={fechar} />}
        </div>
    );
}