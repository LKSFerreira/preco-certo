import React, { useState } from 'react';

/**
 * Número do WhatsApp do desenvolvedor para contato.
 * Formato: código do país + DDD + número (sem espaços ou traços)
 */
const WHATSAPP_DESENVOLVEDOR = '5517996510506';

interface PropsModalContato {
    aoFechar: () => void;
}

/**
 * Modal de contato via WhatsApp.
 *
 * Permite que o usuário envie uma mensagem diretamente para o desenvolvedor
 * através do WhatsApp, usando a API de links wa.me.
 *
 * **Exemplo:**
 *
 * .. code-block:: tsx
 *
 *     <ModalContato aoFechar={() => setMostrar(false)} />
 */
const ModalContato: React.FC<PropsModalContato> = ({ aoFechar }) => {
    const [nome, setNome] = useState('');
    const [mensagem, setMensagem] = useState('');

    /**
     * Abre o WhatsApp com a mensagem formatada.
     * Usa o link wa.me que funciona em mobile e desktop.
     */
    const enviarMensagem = () => {
        // Monta a mensagem com identificação
        const textoCompleto = `Olá! Meu nome é ${nome}.\n\n${mensagem}`;

        // Codifica para URL
        const textoEncoded = encodeURIComponent(textoCompleto);

        // Abre o WhatsApp (funciona em mobile e web)
        window.open(`https://wa.me/${WHATSAPP_DESENVOLVEDOR}?text=${textoEncoded}`, '_blank');

        // Feedback tátil
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50);
        }

        aoFechar();
    };

    // Validação: ambos os campos são obrigatórios
    const formularioValido = nome.trim().length > 0 && mensagem.trim().length > 0;

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-80 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative">

                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-500 p-4 text-white text-center relative">
                    <button
                        onClick={aoFechar}
                        className="absolute top-3 right-3 text-white/80 hover:text-white p-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="mb-2 bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                    </div>
                    <h2 className="font-bold text-lg">Fale Conosco</h2>
                    <p className="text-xs text-green-100 px-4">
                        Dúvidas, sugestões ou feedback? Manda uma mensagem!
                    </p>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col gap-4">

                    {/* Campo Nome */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            Seu Nome *
                        </label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Como podemos te chamar?"
                            className="bg-gray-50 text-sm text-gray-700 p-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
                        />
                    </div>

                    {/* Campo Mensagem */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            Mensagem *
                        </label>
                        <textarea
                            value={mensagem}
                            onChange={(e) => setMensagem(e.target.value)}
                            placeholder="Escreva sua mensagem aqui..."
                            rows={4}
                            className="bg-gray-50 text-sm text-gray-700 p-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Botão Enviar */}
                    <button
                        onClick={enviarMensagem}
                        disabled={!formularioValido}
                        className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all
              ${formularioValido
                                ? 'bg-green-600 hover:bg-green-700 active:scale-95'
                                : 'bg-gray-300 cursor-not-allowed'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        Abrir WhatsApp
                    </button>

                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-3 text-center">
                    <button onClick={aoFechar} className="text-gray-500 text-sm font-semibold hover:text-gray-800">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalContato;
