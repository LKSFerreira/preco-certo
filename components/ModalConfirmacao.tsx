import React from 'react';

interface PropsModalConfirmacao {
  titulo: string;
  mensagem: string;
  textoBotaoConfirmar?: string;
  textoBotaoCancelar?: string;
  corBotaoConfirmar?: 'vermelho' | 'verde' | 'azul';
  aoConfirmar: () => void;
  aoCancelar: () => void;
}

/**
 * Modal de confirmação reutilizável para substituir window.confirm.
 * 
 * Oferece uma experiência visual consistente com o restante do app,
 * com animações suaves e cores personalizáveis.
 * 
 * **Exemplo:**
 * 
 * .. code-block:: tsx
 * 
 *     <ModalConfirmacao
 *       titulo="Esvaziar Carrinho"
 *       mensagem="Tem certeza que deseja remover todos os itens?"
 *       textoBotaoConfirmar="Esvaziar"
 *       corBotaoConfirmar="vermelho"
 *       aoConfirmar={executarEsvaziamento}
 *       aoCancelar={() => setMostrarModal(false)}
 *     />
 */
export const ModalConfirmacao: React.FC<PropsModalConfirmacao> = ({
  titulo,
  mensagem,
  textoBotaoConfirmar = 'Confirmar',
  textoBotaoCancelar = 'Cancelar',
  corBotaoConfirmar = 'vermelho',
  aoConfirmar,
  aoCancelar
}) => {
  // Mapeamento de cores para classes Tailwind
  const coresBotao = {
    vermelho: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
    verde: 'bg-verde-600 hover:bg-verde-700 active:bg-verde-800',
    azul: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay escuro com animação de fade */}
      <div 
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={aoCancelar}
      />
      
      {/* Card do modal com animação de slide */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">
        {/* Cabeçalho */}
        <div className="p-5 pb-3">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <i className="fas fa-exclamation-circle text-yellow-500"></i>
            {titulo}
          </h2>
        </div>
        
        {/* Mensagem */}
        <div className="px-5 pb-5">
          <p className="text-gray-600">{mensagem}</p>
        </div>
        
        {/* Botões */}
        <div className="flex border-t border-gray-100">
          <button
            onClick={aoCancelar}
            className="flex-1 py-4 font-semibold text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            {textoBotaoCancelar}
          </button>
          <button
            onClick={aoConfirmar}
            className={`flex-1 py-4 font-bold text-white transition-colors ${coresBotao[corBotaoConfirmar]}`}
          >
            {textoBotaoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};
