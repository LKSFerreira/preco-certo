import React, { useState, useEffect } from 'react';

const CHAVE_TUTORIAL_VISTO = 'preco_certo_tutorial_v1';

interface PropsModalTutorial {
  aoFechar: () => void;
}

/**
 * Tutorial visual de primeiro acesso.
 * 
 * Foco em elementos visuais com mínimo texto.
 * Usuários ignoram texto - absorvem imagens e ícones.
 */
export const ModalTutorial: React.FC<PropsModalTutorial> = ({ aoFechar }) => {
  const [slideAtual, setSlideAtual] = useState(0);
  const totalSlides = 2;

  const avancar = () => {
    if (slideAtual < totalSlides - 1) {
      setSlideAtual(prev => prev + 1);
    } else {
      finalizarTutorial();
    }
  };

  const voltar = () => {
    if (slideAtual > 0) {
      setSlideAtual(prev => prev - 1);
    }
  };

  const finalizarTutorial = () => {
    localStorage.setItem(CHAVE_TUTORIAL_VISTO, 'true');
    aoFechar();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      {/* Camada de desfoque sobre o app */}
      <div className="absolute inset-0 bg-gradient-to-b from-verde-600/95 to-verde-800/95 backdrop-blur-sm"></div>
      
      {/* Conteúdo do tutorial */}
      <div className="relative flex-1 flex flex-col z-10">
      
      {/* Botão Pular - sempre visível */}
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={finalizarTutorial}
          className="text-white font-bold px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 transition-colors text-sm shadow-lg"
        >
          Pular
        </button>
      </div>

      {/* Área do Slide */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        
        {/* Slide 1: Scanner de Código de Barras */}
        {slideAtual === 0 && (
          <div className="flex flex-col items-center text-center animate-fade-in max-w-sm">
            
            {/* Ilustração visual do scanner - formato retangular horizontal */}
            <div className="relative w-72 h-40 mb-6">
              {/* Moldura do visor */}
              <div className="absolute inset-0 border-4 border-white/30 rounded-2xl">
                {/* Cantos destacados */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
              </div>
              
              {/* Linha de scan animada */}
              <div className="absolute left-4 right-4 top-1/2 h-1 bg-red-400 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
              
              {/* Código de barras estilizado - altura uniforme, larguras variadas */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-[2px]">
                {[2,1,3,1,2,1,1,3,1,2,1,3,2,1,1,2,3,1,2,1,3,1,2].map((w, i) => (
                  <div 
                    key={i} 
                    className="bg-white h-16 rounded-sm" 
                    style={{ width: `${w * 2}px` }}
                  ></div>
                ))}
              </div>
              
              {/* Setas indicando centralização */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-white text-2xl animate-bounce-right">
                <i className="fas fa-chevron-right"></i>
              </div>
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-white text-2xl animate-bounce-left">
                <i className="fas fa-chevron-left"></i>
              </div>
            </div>
            
            {/* Ícone de check animado */}
            <div className="flex items-center gap-3 bg-white/20 px-6 py-3 rounded-full mb-4">
              <i className="fas fa-barcode text-white text-2xl"></i>
              <i className="fas fa-arrow-right text-white/50"></i>
              <i className="fas fa-bullseye text-white text-2xl"></i>
            </div>
            
            {/* Texto mínimo */}
            <p className="text-white/80 text-lg font-medium">
              Centralize o código
            </p>
          </div>
        )}

        {/* Slide 2: Foto para OCR */}
        {slideAtual === 1 && (
          <div className="flex flex-col items-center text-center animate-fade-in max-w-sm">
            
            {/* Comparação visual: foto ruim vs foto boa */}
            <div className="flex gap-4 mb-6">
              
              {/* Foto ruim */}
              <div className="relative">
                <div className="w-28 h-36 bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden border-4 border-red-400/50">
                  {/* Rótulo borrado/escuro */}
                  <div className="w-16 h-20 bg-gray-600 rounded blur-sm opacity-50"></div>
                </div>
                {/* X vermelho */}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <i className="fas fa-times text-white"></i>
                </div>
              </div>
              
              {/* Seta */}
              <div className="flex items-center text-white/50">
                <i className="fas fa-arrow-right text-xl"></i>
              </div>
              
              {/* Foto boa */}
              <div className="relative">
                <div className="w-28 h-36 bg-white rounded-xl flex flex-col items-center justify-center overflow-hidden border-4 border-verde-400 p-2">
                  {/* Rótulo nítido estilizado */}
                  <div className="w-full h-4 bg-blue-500 rounded-sm mb-1"></div>
                  <div className="w-3/4 h-2 bg-gray-300 rounded-sm mb-1"></div>
                  <div className="w-1/2 h-2 bg-gray-300 rounded-sm mb-2"></div>
                  <div className="w-full h-3 bg-verde-500 rounded-sm"></div>
                  <div className="w-2/3 h-2 bg-gray-200 rounded-sm mt-1"></div>
                </div>
                {/* Check verde */}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-verde-500 rounded-full flex items-center justify-center shadow-lg">
                  <i className="fas fa-check text-white"></i>
                </div>
                {/* Ícone de sol (iluminação) */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                  <i className="fas fa-sun text-yellow-800 text-xs"></i>
                </div>
              </div>
            </div>
            
            {/* Ícones indicando o que fazer */}
            <div className="flex items-center gap-4 bg-white/20 px-6 py-3 rounded-full mb-4">
              <div className="flex flex-col items-center">
                <i className="fas fa-sun text-yellow-300 text-xl mb-1"></i>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="flex flex-col items-center">
                <i className="fas fa-expand text-white text-xl mb-1"></i>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="flex flex-col items-center">
                <i className="fas fa-hand-paper text-white text-xl mb-1"></i>
              </div>
            </div>
            
            {/* Texto mínimo */}
            <p className="text-white/80 text-lg font-medium">
              Foto legível do produto
            </p>
          </div>
        )}
      </div>

      {/* Navegação inferior - mais próxima do centro */}
      <div className="p-6 pb-8">
        {/* Indicadores de progresso */}
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div 
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === slideAtual 
                  ? 'w-8 bg-white' 
                  : 'w-2 bg-white/30'
              }`}
            ></div>
          ))}
        </div>
        
        {/* Botões de navegação */}
        <div className="flex gap-3">
          {slideAtual > 0 && (
            <button 
              onClick={voltar}
              className="w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <i className="fas fa-arrow-left text-white text-xl"></i>
            </button>
          )}
          
          <button 
            onClick={avancar}
            className="flex-1 h-14 bg-verde-500 text-white font-bold rounded-full flex items-center justify-center gap-2 shadow-lg hover:bg-verde-600 active:scale-95 transition-all"
          >
            {slideAtual === totalSlides - 1 ? (
              <>
                <i className="fas fa-check"></i>
                <span>Começar</span>
              </>
            ) : (
              <>
                <span>Próximo</span>
                <i className="fas fa-arrow-right"></i>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Estilos para animações customizadas */}
      <style>{`
        @keyframes bounce-right {
          0%, 100% { transform: translateY(-50%) translateX(0); }
          50% { transform: translateY(-50%) translateX(4px); }
        }
        @keyframes bounce-left {
          0%, 100% { transform: translateY(-50%) translateX(0); }
          50% { transform: translateY(-50%) translateX(-4px); }
        }
        .animate-bounce-right { animation: bounce-right 1s infinite; }
        .animate-bounce-left { animation: bounce-left 1s infinite; }
      `}</style>
      </div>
    </div>
  );
};

/**
 * Hook para verificar se deve mostrar o tutorial.
 */
export const useTutorialPrimeiroAcesso = () => {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    const jaVisto = localStorage.getItem(CHAVE_TUTORIAL_VISTO);
    if (!jaVisto) {
      setMostrar(true);
    }
  }, []);

  const fechar = () => setMostrar(false);

  return { mostrar, fechar };
};
