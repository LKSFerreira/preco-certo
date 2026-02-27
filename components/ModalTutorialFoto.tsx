import React, { useState, useEffect, useRef } from 'react';

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

    const [direcaoDescarte, setDirecaoDescarte] = useState(1);
    
    // Controle de Responsividade Dinâmica
    const [tamanhoTela, setTamanhoTela] = useState('grande');
    const containerRef = useRef<HTMLDivElement>(null);

    const finalizarTutorial = () => {
        localStorage.setItem(CHAVE_TUTORIAL_FOTO_VISTO, 'true');
        aoFechar();
    };

    // Monitora o tamanho da tela para reajustar o layout dinamicamente
    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                // O contentRect.height mede o espaço interno, descontando as bordas do simulador (12px top + 12px bottom = 24px)
                const height = entry.contentRect.height;
                
                // DISPOSITIVOS MUITO PEQUENOS (Android Básico - Inner Medido: ~616px)
                if (height <= 630) {
                    setTamanhoTela('muito-pequeno');
                }
                // NOVO: ISOLAMENTO APENAS PARA O IPHONE SE (Inner Medido: ~643px)
                else if (height <= 680) {
                    setTamanhoTela('iphone-se');
                }
                // DISPOSITIVOS PEQUENOS (Tela Custom - Inner Medido: ~686px)
                else if (height <= 710) {
                    setTamanhoTela('pequeno');
                } 
                // DISPOSITIVOS MÉDIOS (Entre 711px e 850px - Inner Medido: entre ~687px e ~826px)
                else if (height <= 820) {
                    setTamanhoTela('medio');
                } 
                // DISPOSITIVOS GRANDES (iPhone 14/15 Pro - Inner Medido: ~828px)
                else if (height <= 850) {
                    setTamanhoTela('grande');
                }
                // DISPOSITIVOS MUITO GRANDES (Pixel 8, iPhone 15 Pro Max - Inner Medido: > 890px)
                else {
                    setTamanhoTela('muito-grande');
                }
            }
        });

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const intervaloPrincipal = setInterval(() => {
            setDirecaoDescarte(Math.random() > 0.5 ? 1 : -1);
        }, VELOCIDADE_ANIMACAO_MS);

        return () => clearInterval(intervaloPrincipal);
    }, []);

    // Variáveis de layout baseadas no tamanho
    const isMuitoPequeno = tamanhoTela === 'muito-pequeno';
    const isIphoneSE = tamanhoTela === 'iphone-se';
    // isPequeno engloba o Tela Custom e herda as fontes já configuradas para o iPhone SE
    const isPequeno = tamanhoTela === 'pequeno' || isIphoneSE; 
    const isMedio = tamanhoTela === 'medio';
    const isGrande = tamanhoTela === 'grande';
    const isMuitoGrande = tamanhoTela === 'muito-grande';

    // A regra anterior mantida intacta: Pequenos usam os tamanhos do Médio
    const isCompacto = isPequeno || isMedio;

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-[110] flex flex-col bg-gradient-to-b from-blue-600 to-blue-900 font-sans overflow-x-hidden overflow-y-auto overscroll-contain"
            style={{
                '--duracao-animacao': `${VELOCIDADE_ANIMACAO_MS}ms`,
                // Ajuste proporcional isolado para o Android Básico (Muito Pequeno) - Valores aumentados para aproveitar o espaço
                '--zoom-foto': isMuitoPequeno ? 0.82 : isCompacto ? .92 : ZOOM_FOTO,
                '--start-scale': isMuitoPequeno ? 0.55 : isCompacto ? 0.60 : 0.65,
                '--descarte-x': `${direcaoDescarte * (isMuitoPequeno ? 180 : 200)}px`,
                '--descarte-rotacao': `${direcaoDescarte * 25}deg`
            } as React.CSSProperties}
        >

            {/* Fundo decorativo sutil */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>

            {/* Wrapper Principal com Flexbox flexível - Correção pontual de padding para isMedio para evitar esmagamento do card azul */}
            <div className={`relative h-full flex flex-col justify-between z-10 px-5 max-w-md mx-auto w-full transition-all ${isMuitoPequeno ? 'py-4 pt-6' : isIphoneSE ? 'py-4 pt-4' : isPequeno ? 'py-5 pt-6' : isMedio ? 'py-5 pt-8' : 'py-8 pt-10'}`}>

                {/* Cabeçalho */}
                <div className={`text-center flex-none animate-fade-in flex flex-col items-center ${isMuitoPequeno ? 'mb-1' : 'mb-2'}`}>
                    
                    {/* Fonte aumentada de 22px para 25px no Android Básico e para 36px (par) nos muito grandes */}
                    <h1 className={`text-white font-black tracking-tight transition-all ${isMuitoPequeno ? 'text-[25px] mb-0.5' : isCompacto ? 'text-[28px] mb-1' : isMuitoGrande ? 'text-[36px] mb-2' : 'text-3xl mb-2'}`}>
                        Dica de Ouro
                    </h1>
                    {/* Fonte aumentada de 13px para 14px no Android Básico e para 18px (par) nos muito grandes */}
                    <p className={`text-blue-50 transition-all ${isMuitoPequeno ? 'text-[14px]' : isCompacto ? 'text-[15px]' : isMuitoGrande ? 'text-[18px]' : 'text-base'}`}>
                        Para o app reconhecer rapidinho:
                    </p>
                </div>

                {/* Área da Animação Explicativa - Padding corrigido (p-4) para isMedio para evitar sobreposição interna */}
                <div className={`relative flex-1 min-h-0 w-full bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20 flex flex-col items-center justify-center shadow-2xl pointer-events-none transition-all ${isMuitoPequeno ? 'p-4 mt-2' : isPequeno ? 'p-5 mt-3' : isMedio ? 'p-4 mt-3' : 'p-6 mt-4'}`}>

                    {/* Texto de Instrução Animado - Padding superior (pt-3) adicionado isoladamente para o iPhone SE */}
                    <div className={`text-center flex-none flex flex-col items-center justify-center transition-all w-full px-4 ${isMuitoPequeno ? 'mb-2' : isIphoneSE ? 'pt-3 mb-2' : isCompacto ? 'mb-3' : 'mb-4'}`}>
                        {/* Fonte aumentada de 13px para 16px no Android Básico e aumentada para 18px (par) nos muito grandes */}
                        <p className={`text-white font-bold animate-text-instruction-sync leading-tight w-full ${isMuitoPequeno ? 'text-[16px]' : isPequeno ? 'text-[16px]' : isMedio ? 'text-sm' : isMuitoGrande ? 'text-[18px]' : 'text-base'}`}>
                            <span className="text-green-400 font-bold block uppercase tracking-wide">Enquadre o rótulo frontal</span>
                            <span className="block mt-0.5 opacity-90">Tire uma foto nítida!</span>
                        </p>
                    </div>

                    {/* Visor da Câmera Animado - Tamanho ajustado (max-w-[200px]) especificamente para isMedio não esmagar */}
                    <div className={`relative flex-none w-full aspect-[4/5] flex items-center justify-center rounded-2xl bg-black/40 overflow-hidden shadow-inner backdrop-blur-sm border border-white/10 transition-all ${isMuitoPequeno ? 'max-w-[190px]' : isPequeno ? 'max-w-[210px]' : isMedio ? 'max-w-[200px]' : 'max-w-[240px]'}`}>

                        {/* Marcadores de Foco */}
                        <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg border-white/50 animate-camera-frame-sync z-20"></div>
                        <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg border-white/50 animate-camera-frame-sync z-20"></div>
                        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg border-white/50 animate-camera-frame-sync z-20"></div>
                        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 rounded-br-lg border-white/50 animate-camera-frame-sync z-20"></div>

                        {/* Cena do Produto */}
                        <div className="animate-product-focus-sync relative flex items-center justify-center z-10 w-full h-full">
                            <div className="relative w-[180px] h-[245px] bg-gradient-to-br from-red-600 to-red-800 rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden border border-red-500">
                                <div className="absolute top-[5%] left-0 w-full h-[80%] bg-[#FFD700]" style={{ clipPath: 'polygon(60% 0%, 100% 0%, 65% 45%, 90% 45%, 40% 100%, 55% 55%, 30% 55%)' }}></div>
                                <div className="absolute top-2 left-2 bg-[#FFD700] px-1.5 py-1 rounded-sm shadow-sm"><p className="text-[#0d47a1] text-[6px] font-black leading-none text-center">EMBALAGEM<br />ECONÔMICA</p></div>
                                <div className="absolute top-0 right-4 bg-white border border-black px-1.5 py-1 rounded-b-lg shadow-sm"><p className="text-black text-[5px] font-bold leading-none text-center">ALTO EM<br />AÇÚCAR</p></div>
                                <div className="absolute top-14 w-full text-center transform -rotate-3 z-10"><h2 className="text-[38px] font-black text-[#0d47a1] tracking-tighter drop-shadow-md leading-none" style={{ WebkitTextStroke: '1px white' }}>CEREAL</h2></div>
                                <div className="absolute bottom-11 left-1/2 -translate-x-1/2 w-28 h-28 flex justify-center items-center z-10">
                                    <div className="absolute w-24 h-24 bg-black/30 rounded-full blur-md translate-y-2"></div>
                                    <div className="relative w-20 h-20 bg-red-600 rounded-full shadow-lg border-[3px] border-red-500 flex items-center justify-center overflow-hidden z-10">
                                        <div className="absolute w-16 h-16 bg-white rounded-full shadow-inner opacity-90"></div>
                                        <div className="absolute top-2 left-3 w-4 h-4 bg-[#4e342e] rounded-full shadow-sm border border-[#3e2723]"></div>
                                        <div className="absolute top-3 right-3 w-5 h-5 bg-[#5d4037] rounded-full shadow-sm border border-[#3e2723]"></div>
                                        <div className="absolute bottom-3 left-4 w-4 h-4 bg-[#4e342e] rounded-full shadow-sm border border-[#3e2723]"></div>
                                        <div className="absolute bottom-2 right-4 w-5 h-5 bg-[#5d4037] rounded-full shadow-sm border border-[#3e2723]"></div>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#4e342e] rounded-full shadow-sm border border-[#3e2723]"></div>
                                    </div>
                                </div>
                                <div className="absolute bottom-3 right-4"><p className="text-white text-[8px] font-black tracking-widest">770 g</p></div>
                            </div>
                        </div>

                        <div className="absolute inset-0 bg-white animate-camera-flash-sync z-30 pointer-events-none opacity-0"></div>

                        {/* Check de Sucesso */}
                        <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm animate-photo-success-sync z-40 opacity-0">
                            <div className="flex flex-col items-center">
                                {/* Círculo aumentado de 48px para 56px no Android Básico */}
                                <div className={`bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-600/50 mb-2 ${isMuitoPequeno ? 'w-[56px] h-[56px]' : 'w-16 h-16'}`}>
                                    <svg className={`text-white ${isMuitoPequeno ? 'w-8 h-8' : 'w-10 h-10'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span className={`text-white font-bold bg-green-700/90 rounded-full backdrop-blur-md shadow-lg ${isMuitoPequeno ? 'px-4 py-1 text-[12px]' : isMuitoGrande ? 'px-6 py-2 text-[16px]' : 'px-5 py-1.5 text-sm'}`}>
                                    Legível!
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Dicas Textuais - Padding inferior (pb-3) isolado para afastar do final da caixa no iPhone SE */}
                    <div className={`flex-none flex flex-col w-full animate-tips-fade-in transition-all ${isMuitoPequeno ? 'mt-3 gap-1.5' : isIphoneSE ? 'mt-3 gap-2 pb-3' : isCompacto ? 'mt-5 gap-2' : 'mt-8 gap-3'}`}>
                        <div className="flex items-center gap-2">
                            {/* Ícone e fonte aumentados no Android Básico */}
                            <svg className={`text-green-400 shrink-0 ${isMuitoPequeno ? 'w-[18px] h-[18px]' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            {/* Fonte ajustada para 18px (par) nos muito grandes */}
                            <span className={`text-white font-medium leading-tight ${isMuitoPequeno ? 'text-[14px]' : isPequeno ? 'text-[15px]' : isMedio ? 'text-sm' : isMuitoGrande ? 'text-[18px]' : 'text-base'}`}>Nome, marca e peso do produto</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className={`text-green-400 shrink-0 ${isMuitoPequeno ? 'w-[18px] h-[18px]' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            {/* Fonte ajustada para 18px (par) nos muito grandes */}
                            <span className={`text-white font-medium leading-tight ${isMuitoPequeno ? 'text-[16px]' : isPequeno ? 'text-[15px]' : isMedio ? 'text-sm' : isMuitoGrande ? 'text-[18px]' : 'text-base'}`}>Garanta que o texto esteja legível</span>
                        </div>
                    </div>

                </div>

                {/* Botão de Ação */}
                <div className={`flex-none transition-all ${isMuitoPequeno ? 'mt-3 mb-2' : 'mt-6 mb-4'}`}>
                    <button
                        onClick={finalizarTutorial}
                        // Botão e texto aumentados no Android Básico e para 22px/28px (par) nos muito grandes
                        className={`w-full bg-green-600 text-white font-bold rounded-2xl shadow-[0_8px_30px_rgba(22,163,74,0.4)] hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center animate-button-pulse-sync ${isMuitoPequeno ? 'py-[14px] text-[17px] gap-2' : isCompacto ? 'py-4 text-lg gap-2' : isMuitoGrande ? 'py-5 text-[22px] gap-3' : 'py-5 text-xl gap-3'}`}
                    >
                        <span>Entendi, abrir câmera!</span>
                        <span className={isMuitoPequeno ? 'text-[22px]' : isMuitoGrande ? 'text-[28px]' : 'text-2xl'}>📸</span>
                    </button>
                </div>

            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
                .animate-tips-fade-in { animation: fadeIn 0.8s ease-out forwards; animation-delay: 0.2s; opacity: 0; }
                
                @keyframes productFocusSync {
                    0%, 5% { transform: scale(var(--start-scale)) rotate(-5deg) translateY(20px) translateX(0); filter: blur(3px); opacity: 0; }
                    15%, 55% { transform: scale(var(--zoom-foto)) rotate(0deg) translateY(-2px) translateX(0); filter: blur(0px); opacity: 1; }
                    65%, 100% { transform: scale(var(--zoom-foto)) translateX(var(--descarte-x)) rotate(var(--descarte-rotacao)); opacity: 0; filter: blur(2px); }
                }
                .animate-product-focus-sync { animation: productFocusSync var(--duracao-animacao) infinite cubic-bezier(0.25, 1, 0.5, 1); }

                @keyframes cameraFrameSync {
                    0%, 30% { border-color: rgba(255,255,255,0.4); transform: scale(1.1); }
                    35%, 55% { border-color: #22c55e; transform: scale(1); }
                    75%, 100% { border-color: rgba(255,255,255,0.4); transform: scale(1.1); }
                }
                .animate-camera-frame-sync { animation: cameraFrameSync var(--duracao-animacao) infinite ease-out; }

                @keyframes cameraFlashSync { 0%, 43% { opacity: 0; } 45% { opacity: 1; } 50%, 100% { opacity: 0; } }
                .animate-camera-flash-sync { animation: cameraFlashSync var(--duracao-animacao) infinite; }

                @keyframes photoSuccessSync { 0%, 47% { opacity: 0; transform: scale(0.8); } 49%, 60% { opacity: 1; transform: scale(1); } 65%, 100% { opacity: 0; transform: scale(1.1); } }
                .animate-photo-success-sync { animation: photoSuccessSync var(--duracao-animacao) infinite cubic-bezier(0.34, 1.56, 0.64, 1); }

                @keyframes textInstructionSync { 0%, 30% { opacity: 0.7; transform: scale(0.98); } 35%, 60% { opacity: 1; transform: scale(1.02); } 75%, 100% { opacity: 0.7; transform: scale(0.98); } }
                .animate-text-instruction-sync { animation: textInstructionSync var(--duracao-animacao) infinite ease-in-out; }

                @keyframes buttonPulseSync {
                    0%, 75%, 100% { transform: scale(1); box-shadow: 0 8px 30px rgba(22,163,74,0.4); background-color: #16a34a; }
                    85% { transform: scale(1.04); box-shadow: 0 15px 35px rgba(22,163,74,0.7); background-color: #15803d; }
                }
                .animate-button-pulse-sync { animation: buttonPulseSync var(--duracao-animacao) infinite ease-in-out; }
            `}</style>
        </div>
    );
};

export default ModalTutorialFoto;
