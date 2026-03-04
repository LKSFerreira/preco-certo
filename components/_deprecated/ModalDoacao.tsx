/**
 * @deprecated Desde 04/03/2026
 *
 * Componente substituído pelo fluxo de monetização premium (ModalPlano + ModalPagamento).
 * O botão ❤️ do header agora abre ModalPlano em vez desta modal.
 *
 * Mantido em `_deprecated/` para referência histórica.
 * Para restaurar, mover de volta para `components/` e reconectar no App.tsx.
 */
import React, { useState } from 'react';
// O navegador exige caminhos relativos iniciando com ./ ou ../ para módulos locais
import dadosPix from '../chave_pix/chave_pix.json' with { type: 'json' };

interface PropsModalDoacao {
  aoFechar: () => void;
}

const ModalDoacao: React.FC<PropsModalDoacao> = ({ aoFechar }) => {
  const [copiado, setCopiado] = useState<string | null>(null);

  const copiarTexto = (texto: string, tipo: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(tipo);

    // Feedback tátil
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);

    setTimeout(() => setCopiado(null), 2000);
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-80 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-verde-700 to-verde-500 p-4 text-white text-center relative">
          <button
            onClick={aoFechar}
            className="absolute top-3 right-3 text-white/80 hover:text-white p-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="mb-2 bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8 animate-pulse text-red-500"
            >
              <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
            </svg>
          </div>
          <h2 className="font-bold text-lg">Gostou do App?</h2>
          <p className="text-xs text-white opacity-90 px-4">
            O Sem Susto é gratuito. Se ele te ajuda a economizar, considere fazer uma doação de
            qualquer valor!
          </p>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="border-2 border-dashed border-gray-300 p-2 rounded-lg bg-gray-50 mb-2">
              {dadosPix.qrcode_base64 && dadosPix.qrcode_base64.length > 50 ? (
                <img
                  src={dadosPix.qrcode_base64}
                  alt="QR Code Pix"
                  className="w-40 h-40 object-contain"
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center text-center text-xs text-gray-400">
                  QR Code Placeholder
                  <br />
                  (Configure no JSON)
                </div>
              )}
            </div>
            <p className="text-xs text-gray-700 font-medium">
              Escaneie o QR Code no app do seu banco
            </p>
          </div>

          <div className="border-t border-gray-100 my-1"></div>

          {/* Botões de Cópia */}
          <div className="flex flex-col gap-3">
            {/* Pix Copia e Cola */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-700 tracking-wider">
                Pix Copia e Cola
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={dadosPix.copia_e_cola_pix}
                  className="flex-1 bg-gray-100 text-xs text-gray-800 p-2 rounded border border-gray-200 truncate font-mono"
                />
                <button
                  onClick={() => copiarTexto(dadosPix.copia_e_cola_pix, 'copia')}
                  className={`px-3 py-2 rounded text-xs font-bold transition-all w-24 flex items-center justify-center gap-1
                    ${copiado === 'copia' ? 'bg-green-100 text-green-700' : 'bg-verde-700 text-white hover:bg-verde-700'}
                  `}
                >
                  {copiado === 'copia' ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>{' '}
                      Copiado
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                        />
                      </svg>{' '}
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Chave Aleatória/Email/CPF */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-700 tracking-wider">
                Chave Pix
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={dadosPix.chave_aleatoria_pix}
                  className="flex-1 bg-gray-100 text-xs text-gray-800 p-2 rounded border border-gray-200 truncate font-mono"
                />
                <button
                  onClick={() => copiarTexto(dadosPix.chave_aleatoria_pix, 'chave')}
                  className={`px-3 py-2 rounded text-xs font-bold transition-all w-24 flex items-center justify-center gap-1
                    ${copiado === 'chave' ? 'bg-green-100 text-green-700' : 'bg-verde-700 text-white hover:bg-verde-700'}
                  `}
                >
                  {copiado === 'chave' ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>{' '}
                      Copiado
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                        />
                      </svg>{' '}
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Link Nubank */}
            {dadosPix.link_nubank && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Link para Doação
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={dadosPix.link_nubank}
                    className="flex-1 bg-gray-100 text-xs text-gray-600 p-2 rounded border border-gray-200 truncate font-mono"
                  />
                  <button
                    onClick={() => copiarTexto(dadosPix.link_nubank, 'nubank')}
                    className={`px-3 py-2 rounded text-xs font-bold transition-all w-24 flex items-center justify-center gap-1
                      ${copiado === 'nubank' ? 'bg-green-100 text-green-700' : 'bg-purple-600 text-white hover:bg-purple-700'}
                    `}
                  >
                    {copiado === 'nubank' ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>{' '}
                        Copiado
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                          />
                        </svg>{' '}
                        Copiar
                      </>
                    )}
                  </button>
                  <a
                    href={dadosPix.link_nubank}
                    target="_blank"
                    className="px-3 py-2 rounded text-xs font-bold transition-all bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center w-10 border border-gray-200"
                    title="Abrir Link"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-3 text-center">
          <button
            onClick={aoFechar}
            className="text-gray-700 text-sm font-semibold hover:text-gray-900 underline"
          >
            Talvez depois
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDoacao;
