import React, { useState, useEffect } from 'react';
import { useRepositorios } from '../contextos/ContextoRepositorios';
import { TelaApp } from '../types';

interface PropsAtivacaoToken {
    tokenObrigatorioUrl?: string | null;
    aoVoltar: () => void;
    aoIrParaDashboard: () => void;
}

export function TelaAtivarToken({ tokenObrigatorioUrl, aoVoltar, aoIrParaDashboard }: PropsAtivacaoToken) {
    const { premium } = useRepositorios();
    const [token, setToken] = useState(tokenObrigatorioUrl || '');
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
            // Fingerprint Mockado (Avançado no futuro: pegar Canvas ou lib fpjs)
            const mockFingerprint = typeof navigator !== 'undefined' ? `${navigator.userAgent}-${navigator.language}` : `dispositivo-${Date.now()}`;

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
                // ⚠️ OFUSCAÇÃO SHA-256 CLIENT-SIDE ⚠️
                // Criptografa OBRIGATORIAMENTE antes de setalo e joga fora a variavel 'Token' enviada pelo form
                await premium.salvarTokenHash(token.toUpperCase());
                premium.salvarDiasRestantes(data.dias_restantes);

                setDiasAtivados(data.dias_restantes);
                setStatus('SUCESSO');
                setToken(''); // Limpa o token visualmente da memoria tambem
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative">

                {/* Fechar Topo Direito */}
                <button
                    onClick={aoVoltar}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
                >
                    <i className="fas fa-times"></i>
                </button>

                <div className="p-6">
                    {/* Header Estilizado */}
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 bg-amarelo-100 text-amarelo-600 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm">
                            <i className="fas fa-gem"></i>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Ativar Acesso Premium</h2>
                        <p className="text-sm text-gray-500 mt-1">Insira seu token para liberar os super poderes do Sem Susto.</p>
                    </div>


                    {/* Corpo */}
                    {status === 'SUCESSO' ? (
                        <div className="text-center animate-scale-up space-y-4">
                            <div className="w-16 h-16 bg-verde-100 text-verde-600 rounded-full flex items-center justify-center text-3xl mx-auto">
                                <i className="fas fa-check"></i>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Tudo Certo!</h3>
                                <p className="text-sm text-gray-600 mt-2">
                                    O seu Sem Susto foi ativado com sucesso! Você tem <b>{diasAtivados} dias</b> de Premium garantidos neste dispositivo.
                                </p>
                            </div>
                            <button
                                onClick={aoIrParaDashboard}
                                className="w-full bg-verde-600 text-white font-bold py-3 mt-4 rounded-xl hover:bg-verde-700 active:scale-95 transition-all"
                            >
                                <i className="fas fa-magic mr-2"></i> Usar Sem Susto Premium
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Token de Ativação</label>
                                <input
                                    type="text"
                                    autoComplete="off"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                                    placeholder="SEM-SUSTO-123ABCD"
                                    disabled={status === 'CARREGANDO'}
                                    className={`w-full px-4 py-3 rounded-xl border-2 text-center text-lg font-mono font-bold tracking-widest outline-none transition-colors uppercase ${status === 'ERRO' ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-200 focus:border-amarelo-500 bg-gray-50'}`}
                                />
                            </div>

                            {status === 'ERRO' && (
                                <p className="text-xs text-red-500 text-center font-medium animate-shake">
                                    <i className="fas fa-exclamation-triangle mr-1"></i> {mensagemErro}
                                </p>
                            )}

                            <div className="pt-2">
                                <button
                                    onClick={dispararAtivacao}
                                    disabled={status === 'CARREGANDO' || token.length < 16}
                                    className="w-full bg-amarelo-500 text-gray-900 font-bold py-3 pt-4 pb-4 rounded-xl shadow-lg hover:bg-amarelo-400 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {status === 'CARREGANDO' ? (
                                        <><i className="fas fa-spinner fa-spin text-lg"></i> Confirmando...</>
                                    ) : (
                                        <><i className="fas fa-key text-lg"></i> Validar e Ativar Premium</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Secundário */}
                {status !== 'SUCESSO' && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-[11px] text-gray-400 max-w-[200px]">
                            Lembre-se: O token é pessoal e garante o limite de IA.
                        </p>
                        <button onClick={aoVoltar} className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors">Voltar</button>
                    </div>
                )}
            </div>
        </div>
    );
}
