import React, { useState, useEffect } from 'react';
import { StatusPagamento } from '../services/pagamento/tipos';
import { fabricaPagamento } from '../services/pagamento/fabrica';

interface PropsModalPagamento {
    pagamento_id: string;
    qr_code: string;
    copia_e_cola: string;
    aoFechar: () => void;
    aoSucesso: () => void;
}

const ModalPagamento: React.FC<PropsModalPagamento> = ({
    pagamento_id, qr_code, copia_e_cola, aoFechar, aoSucesso
}) => {
    const [status, setStatus] = useState<StatusPagamento>('pendente');
    const [copiado, setCopiado] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        if (!pagamento_id) return;

        const timeout_limite = Date.now() + 15 * 60 * 1000; // 15 minutos de expiração PIX
        const servico = fabricaPagamento.obterProvedor();

        const interval_id = setInterval(async () => {
            // Condição de parada: Timeout
            if (Date.now() > timeout_limite) {
                clearInterval(interval_id);
                setStatus('expirado');
                return;
            }

            try {
                const novo_status = await servico.consultarStatus(pagamento_id);

                if (novo_status === 'aprovado') {
                    clearInterval(interval_id);
                    setStatus('aprovado');
                    setTimeout(aoSucesso, 1500); // Aguarda animação de check
                } else if (novo_status === 'falha') {
                    clearInterval(interval_id);
                    setStatus('falha');
                }
            } catch (e) {
                console.error('Erro ao consultar polling:', e);
            }
        }, 5000); // Polling a cada 5 segundos

        // Limpeza obrigatória do intervalo (Break Condition 1: Unmount)
        return () => clearInterval(interval_id);
    }, [pagamento_id, aoSucesso]);

    const copiarPix = () => {
        navigator.clipboard.writeText(copia_e_cola);
        setCopiado(true);
        if (navigator.vibrate) navigator.vibrate(50);
        setTimeout(() => setCopiado(false), 2000);
    };

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 animate-fade-in backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">

                {/* Header */}
                <div className="p-5 text-center bg-gray-50 border-b border-gray-100 relative">
                    <button onClick={aoFechar} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="w-12 h-12 bg-verde-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-verde-600">
                            <path d="M4.5 3.75a3 3 0 0 0-3 3v.75h21v-.75a3 3 0 0 0-3-3h-15Z" />
                            <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-7.5Zm-18 3.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="font-black text-gray-900 leading-tight">Pagamento PIX</h2>
                    <p className="text-[11px] text-gray-500 font-medium uppercase tracking-widest mt-1">Aguardando confirmação</p>
                </div>

                {/* Status Area */}
                <div className="p-6 flex flex-col items-center">
                    {status === 'aprovado' ? (
                        <div className="flex flex-col items-center animate-bounce-in py-8">
                            <div className="w-20 h-20 bg-verde-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-verde-200">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-10 h-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                            </div>
                            <p className="font-bold text-verde-700 text-lg">PAGAMENTO APROVADO!</p>
                            <p className="text-xs text-verde-600 opacity-70">Liberação imediata liberada...</p>
                        </div>
                    ) : status === 'expirado' ? (
                        <div className="text-center py-8">
                            <p className="text-red-500 font-bold mb-2">PAGAMENTO EXPIRADO</p>
                            <p className="text-xs text-gray-500 mb-4 px-4">O tempo para pagamento via PIX esgotou. Gere um novo código para continuar.</p>
                            <button onClick={aoFechar} className="bg-gray-900 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider active:scale-95 transition-all">Tentar Novamente</button>
                        </div>
                    ) : (
                        <>
                            <div className="bg-gray-50 p-3 rounded-2xl border-2 border-dashed border-gray-200 mb-6 relative group">
                                <img src={qr_code} alt="QR Code PIX" className={`w-48 h-48 mix-blend-multiply transition-opacity ${status === 'pendente' ? 'opacity-100' : 'opacity-20'}`} />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-black/80 text-white text-[10px] px-3 py-1 rounded-full font-black">QR CODE VÁLIDO</div>
                                </div>
                            </div>

                            <button
                                onClick={copiarPix}
                                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-sm transition-all active:scale-95 shadow-lg shadow-black/5
                            ${copiado ? 'bg-green-100 text-green-700 border-2 border-green-200' : 'bg-verde-700 text-white border-2 border-verde-700 hover:bg-verde-800'}
                        `}
                            >
                                {copiado ? (
                                    <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg> CÓDIGO COPIADO!</>
                                ) : (
                                    <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg> PIX COPIA E COLA</>
                                )}
                            </button>
                        </>
                    )}
                </div>

                {/* Footer Info */}
                <div className="px-6 py-4 bg-gray-50 text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center border-t border-gray-100">
                    Liberação instantânea pelo sistema
                </div>
            </div>
        </div>
    );
};

export default ModalPagamento;
