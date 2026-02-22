import React, { useState, useEffect } from 'react';

// Atualizado para v7: Ajustes finos no enquadramento (zoom menor, caixa mais proporcional, margens respiráveis)
const CHAVE_TUTORIAL_FOTO_VISTO = 'sem_susto_tutorial_foto_v7';

interface PropsTutorialFoto {
    aoFechar: () => void;
}

/**
 * Tutorial visual de foto (Tela Única).
 * Cena ilustrativa realista.
 * Ensina que o zoom deve focar no rótulo completo (da marca ao peso) dentro do visor.
 */
export const TutorialFoto: React.FC<PropsTutorialFoto> = ({ aoFechar }) => {
    const finalizarTutorial = () => {
        localStorage.setItem(CHAVE_TUTORIAL_FOTO_VISTO, 'true');
        aoFechar();
    };

    return (
        <div className="fixed inset-0 z-[110] flex flex-col bg-gradient-to-b from-blue-600 to-blue-900">
            
            {/* Fundo decorativo sutil */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>

            <div className="relative flex-1 flex flex-col justify-between z-10 px-6 py-10 max-w-md mx-auto w-full">
                
                {/* Cabeçalho */}
                <div className="text-center animate-fade-in mt-2">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg backdrop-blur-sm">
                        <i className="fas fa-camera text-2xl text-white"></i>
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
                        <p className="text-white font-medium text-sm animate-text-instruction-sync">
                            <span className="text-green-400 font-bold">Enquadre o rótulo da frente</span> bem nítido!
                        </p>
                    </div>
                    
                    {/* Visor da Câmera Animado (com overflow-hidden para cortar o que sai da tela) */}
                    <div className="relative w-full max-w-[240px] aspect-[4/5] flex items-center justify-center rounded-2xl bg-black/40 overflow-hidden shadow-inner backdrop-blur-sm border border-white/10">
                        
                        {/* Marcadores de Foco da Câmera (Crosshairs) - Mais próximos da borda (top-3, left-3) */}
                        <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg border-white/50 animate-camera-frame-sync z-20"></div>
                        <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg border-white/50 animate-camera-frame-sync z-20"></div>
                        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg border-white/50 animate-camera-frame-sync z-20"></div>
                        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 rounded-br-lg border-white/50 animate-camera-frame-sync z-20"></div>

                        {/* =======================================================
                            CENA DO PRODUTO 
                            O zoom (scale) fará a caixa preencher o espaço ideal
                        ======================================================= */}
                        <div className="animate-product-focus-sync relative flex items-center justify-center z-10 w-full h-full">
                            
                            {/* CAIXA DE CEREAL REALISTA (Feita em CSS) - Altura reduzida de 260px para 245px */}
                            <div className="relative w-[180px] h-[245px] bg-gradient-to-br from-red-600 to-red-800 rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden border border-red-500">
                                
                                {/* Raio Amarelo de Fundo (Clip-Path) */}
                                <div 
                                    className="absolute top-[5%] left-0 w-full h-[80%] bg-[#FFD700]"
                                    style={{ clipPath: 'polygon(60% 0%, 100% 0%, 65% 45%, 90% 45%, 40% 100%, 55% 55%, 30% 55%)' }}
                                ></div>

                                {/* Selo Embalagem Econômica (Canto Esquerdo) */}
                                <div className="absolute top-2 left-2 bg-[#FFD700] px-1.5 py-1 rounded-sm shadow-sm">
                                    <p className="text-[#0d47a1] text-[6px] font-black leading-none text-center">
                                        EMBALAGEM<br/>ECONÔMICA
                                    </p>
                                </div>

                                {/* Selo Alto em Açúcar (Canto Direito) - Mais afastado da borda direita */}
                                <div className="absolute top-0 right-4 bg-white border border-black px-1.5 py-1 rounded-b-lg shadow-sm">
                                    <p className="text-black text-[5px] font-bold leading-none text-center">
                                        ALTO EM<br/>AÇÚCAR
                                    </p>
                                </div>

                                {/* NOME DO PRODUTO (Rótulo Principal que deve ser lido) - Subiu um pouquinho */}
                                <div className="absolute top-14 w-full text-center transform -rotate-3 z-10">
                                    <h2 className="text-[38px] font-black text-[#0d47a1] tracking-tighter drop-shadow-md leading-none" style={{ WebkitTextStroke: '1px white' }}>
                                        CEREAL
                                    </h2>
                                </div>

                                {/* Imagem Ilustrativa (Tigela vista de cima e Cereal) - Subiu um pouquinho */}
                                <div className="absolute bottom-11 left-1/2 -translate-x-1/2 w-28 h-28 flex justify-center items-center z-10">
                                    
                                    {/* Sombra da tigela */}
                                    <div className="absolute w-24 h-24 bg-black/30 rounded-full blur-md translate-y-2"></div>
                                    
                                    {/* Tigela Vermelha (Ângulo superior) */}
                                    <div className="relative w-20 h-20 bg-red-600 rounded-full shadow-lg border-[3px] border-red-500 flex items-center justify-center overflow-hidden z-10">
                                        {/* Leite (Fundo branco) */}
                                        <div className="absolute w-16 h-16 bg-white rounded-full shadow-inner opacity-90"></div>
                                        
                                        {/* Bolinhas de Cereal na Tigela espalhadas */}
                                        <div className="absolute top-2 left-3 w-4 h-4 bg-[#4e342e] rounded-full shadow-sm border border-[#3e2723]"></div>
                                        <div className="absolute top-3 right-3 w-5 h-5 bg-[#5d4037] rounded-full shadow-sm border border-[#3e2723]"></div>
                                        <div className="absolute bottom-3 left-4 w-4 h-4 bg-[#4e342e] rounded-full shadow-sm border border-[#3e2723]"></div>
                                        <div className="absolute bottom-2 right-4 w-5 h-5 bg-[#5d4037] rounded-full shadow-sm border border-[#3e2723]"></div>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#4e342e] rounded-full shadow-sm border border-[#3e2723]"></div>
                                    </div>

                                    {/* Bolinhas explodindo pra fora da tigela */}
                                    <div className="absolute -top-1 right-1 w-4 h-4 bg-[#5d4037] rounded-full shadow-lg border border-[#3e2723] z-20"></div>
                                    <div className="absolute -bottom-2 -left-1 w-3 h-3 bg-[#4e342e] rounded-full shadow-lg border border-[#3e2723] z-20"></div>
                                </div>

                                {/* Peso (Canto Inferior Direito) - Mais afastado das bordas */}
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
                                    <i className="fas fa-check text-3xl text-white"></i>
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
                            <i className="fas fa-check-circle text-green-400 text-lg"></i>
                            <span className="text-white/90 text-sm font-medium">Mostre a marca e o nome do produto</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <i className="fas fa-check-circle text-green-400 text-lg"></i>
                            <span className="text-white/90 text-sm font-medium">Garanta que o texto esteja legível</span>
                        </div>
                    </div>

                </div>

                {/* Botão de Ação Único com Animação Sincronizada */}
                <div className="mt-8 mb-4">
                    <button
                        onClick={finalizarTutorial}
                        className="w-full bg-green-500 text-white text-xl font-bold py-5 rounded-2xl shadow-[0_8px_30px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 animate-button-pulse-sync"
                    >
                        <span>Entendi, abrir câmera!</span>
                        <span className="text-2xl">📸</span>
                    </button>
                </div>

            </div>

            {/* Estilos para a história animada (Sequência de 6 segundos) */}
            <style>{`
                /* Fade inicial do componente */
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
                .animate-tips-fade-in { animation: fadeIn 0.8s ease-out forwards; animation-delay: 0.2s; opacity: 0; }

                /* TIMELINE DE 6 SEGUNDOS DO TUTORIAL DE FOTO */
                
                /* 1. Produto aproximando (0% a 40%) - Ajustado para encaixe perfeito */
                @keyframes productFocusSync {
                    /* Longe: Mostra a caixa toda menor e meio desfocada */
                    0%, 15% { transform: scale(0.65) rotate(-5deg) translateY(20px); filter: blur(3px); opacity: 0.85; }
                    
                    /* ZOOM IDEAL: A caixa cresce o suficiente para preencher o visor perfeitamente,
                       escala reduzida de 1.15 para 1.10 para evitar sobreposição nas quinas verdes,
                       e com pequeno translateY negativo para centralizar perfeitamente na vertical. */
                    35%, 65% { transform: scale(1.10) rotate(0deg) translateY(-2px); filter: blur(0px); opacity: 1; }
                    
                    /* Volta para longe */
                    80%, 100% { transform: scale(0.65) rotate(-5deg) translateY(20px); filter: blur(3px); opacity: 0.85; }
                }
                .animate-product-focus-sync { animation: productFocusSync 6s infinite cubic-bezier(0.25, 1, 0.5, 1); }

                /* 2. Cores da moldura da câmera (Branco -> Verde quando focado) */
                @keyframes cameraFrameSync {
                    0%, 30% { border-color: rgba(255,255,255,0.4); transform: scale(1.1); }
                    35%, 55% { border-color: #22c55e; transform: scale(1); } /* Verde: Foco travado! */
                    75%, 100% { border-color: rgba(255,255,255,0.4); transform: scale(1.1); }
                }
                .animate-camera-frame-sync { animation: cameraFrameSync 6s infinite ease-out; }

                /* 3. O Flash da Foto (Dispara aos 45%) */
                @keyframes cameraFlashSync {
                    0%, 43% { opacity: 0; }
                    45% { opacity: 1; } /* Flash! */
                    50%, 100% { opacity: 0; }
                }
                .animate-camera-flash-sync { animation: cameraFlashSync 6s infinite; }

                /* 4. Feedback de Sucesso (Aparece logo após o flash: 48% a 65%) */
                @keyframes photoSuccessSync {
                    0%, 47% { opacity: 0; transform: scale(0.8); }
                    49%, 60% { opacity: 1; transform: scale(1); }
                    65%, 100% { opacity: 0; transform: scale(1.1); }
                }
                .animate-photo-success-sync { animation: photoSuccessSync 6s infinite cubic-bezier(0.34, 1.56, 0.64, 1); }

                /* 5. Destaca o texto de instrução no momento do foco */
                @keyframes textInstructionSync {
                    0%, 30% { opacity: 0.7; transform: scale(0.98); }
                    35%, 60% { opacity: 1; transform: scale(1.02); text-shadow: 0 0 10px rgba(74, 222, 128, 0.3); }
                    75%, 100% { opacity: 0.7; transform: scale(0.98); }
                }
                .animate-text-instruction-sync { animation: textInstructionSync 6s infinite ease-in-out; }

                /* 6. Chamada de Atenção Sincronizada no Botão (Ocorre no final do loop, igual ao outro tutorial) */
                @keyframes buttonPulseSync {
                    0%, 82%, 100% { transform: scale(1); box-shadow: 0 8px 30px rgba(34,197,94,0.4); }
                    86%, 94% { transform: scale(1.03); box-shadow: 0 12px 35px rgba(34,197,94,0.6); }
                    90% { transform: scale(1); box-shadow: 0 8px 30px rgba(34,197,94,0.4); }
                }
                .animate-button-pulse-sync {
                    animation: buttonPulseSync 6s infinite;
                }
            `}</style>
        </div>
    );
};

/**
 * Hook para verificar se deve mostrar o tutorial de foto.
 */
export const useTutorialFotoPrimeiroUso = () => {
    const deveExibir = () => {
        return !localStorage.getItem(CHAVE_TUTORIAL_FOTO_VISTO);
    };

    const marcarComoVista = () => {
        localStorage.setItem(CHAVE_TUTORIAL_FOTO_VISTO, 'true');
    };

    return { deveExibir, marcarComoVista };
};