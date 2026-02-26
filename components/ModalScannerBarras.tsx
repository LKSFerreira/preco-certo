import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface PropsScanner {
  aoLerCodigo: (codigo: string) => void;
  aoCancelar: () => void;
  simularErroAtivo?: boolean;
  tipoErroSimulado?: 'permissao' | 'hardware' | 'tecnico';
}

const ModalScannerBarras: React.FC<PropsScanner> = ({
  aoLerCodigo,
  aoCancelar,
  simularErroAtivo = false,
  tipoErroSimulado = 'permissao'
}) => {
  const [codigoManual, setCodigoManual] = useState('');
  const [statusCamera, setStatusCamera] = useState<'iniciando' | 'ativa' | 'erro'>('iniciando');
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [detalheErro, setDetalheErro] = useState<'permissao' | 'hardware' | 'tecnico'>('permissao');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerMountingRef = useRef(false);
  const scannerAtivoRef = useRef(false);
  const refInputManual = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Controle de Responsividade DinÃ¢mica
  const [tamanhoTela, setTamanhoTela] = useState<'normal' | 'compacto' | 'muito-compacto'>('normal');

  // Monitora o tamanho real do container para ajustar a UI
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const height = entry.contentRect.height;
        if (height < 600) {
          setTamanhoTela('muito-compacto');
        } else if (height < 700) {
          setTamanhoTela('compacto');
        } else {
          setTamanhoTela('normal');
        }
      }
    });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const isMuitoCompacto = tamanhoTela === 'muito-compacto';
  const isCompacto = tamanhoTela !== 'normal';

  useEffect(() => {
    const elementoId = 'leitor-codigo-barras';

    const iniciarScanner = async () => {
      if (scannerMountingRef.current) return;
      scannerMountingRef.current = true;

      try {
        if (simularErroAtivo) {
          if (tipoErroSimulado === 'permissao') throw new Error('NotAllowedError: Permission denied.');
          if (tipoErroSimulado === 'hardware') throw new Error('NotFoundError: No camera found.');
          if (tipoErroSimulado === 'tecnico') throw new Error('HardwareError: Camera is busy or defective.');
        }

        const container = document.getElementById(elementoId);
        if (container) container.innerHTML = '';

        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch (e) { }
        }

        const scanner = new Html5Qrcode(elementoId);
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: isMuitoCompacto 
            ? { width: 200, height: 120 } 
            : isCompacto 
              ? { width: 230, height: 140 } 
              : { width: 250, height: 150 },
          aspectRatio: 1.0,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
        };

        await scanner.start(
          { facingMode: 'environment' },
          config,
          codigoDecodificado => {
            try {
              if (navigator.vibrate) navigator.vibrate(200);
            } catch (e) { }

            scanner.pause(true);
            scannerAtivoRef.current = false;
            aoLerCodigo(codigoDecodificado);
          },
          _erro => { }
        );

        scannerAtivoRef.current = true;
        setStatusCamera('ativa');
      } catch (erro) {
        setStatusCamera('erro');
        const msg = erro instanceof Error ? erro.message : String(erro);

        if (msg.includes('Permission') || msg.includes('NotAllowedError')) {
          setMensagemErro('Acesso à câmera negado.');
          setDetalheErro('permissao');
        } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
          setMensagemErro('Câmera não encontrada.');
          setDetalheErro('hardware');
        } else {
          setMensagemErro('Erro ao acessar câmera.');
          setDetalheErro('tecnico');
        }

        scannerRef.current = null;
      } finally {
        scannerMountingRef.current = false;
      }
    };

    const timeoutId = setTimeout(iniciarScanner, 100);

    return () => {
      clearTimeout(timeoutId);
      scannerMountingRef.current = false;
      if (scannerRef.current && scannerAtivoRef.current) {
        scannerAtivoRef.current = false;
        scannerRef.current.stop().catch(() => { });
      }
      scannerRef.current = null;
    };
  }, [aoLerCodigo, simularErroAtivo, tipoErroSimulado, isCompacto, isMuitoCompacto]);

  useEffect(() => {
    if (statusCamera === 'erro') {
      const timer = setTimeout(() => {
        refInputManual.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [statusCamera]);

  const lidarComEnvioManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigoManual.trim().length > 0) {
      aoLerCodigo(codigoManual.trim());
    }
  };

  const fecharScanner = () => {
    if (scannerRef.current && scannerAtivoRef.current) {
      scannerAtivoRef.current = false;
      scannerRef.current
        .stop()
        .catch(() => { })
        .finally(() => {
          scannerRef.current = null;
          aoCancelar();
        });
    } else {
      scannerRef.current = null;
      aoCancelar();
    }
  };

  return (
    <div ref={containerRef} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex flex-col justify-center items-center p-4 transition-all duration-300">
      <div className={`w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl relative flex flex-col ${isMuitoCompacto ? 'max-h-[98vh]' : 'max-h-[90vh]'}`}>
        <div className={`bg-slate-900/95 text-white ${isMuitoCompacto ? 'p-2' : 'p-4'} flex justify-between items-center shrink-0 border-b border-slate-800`}>
          <h3 className={`font-bold ${isMuitoCompacto ? 'text-base' : 'text-lg'}`}>
            <div className="flex items-center">
              <div className="flex items-center justify-center">
                <span className="font-medium">Scanner</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 36 24"
                  fill="currentColor"
                  className={`${isMuitoCompacto ? 'w-6 h-6' : 'w-8 h-8'} ml-4`}>
                  <path d="M2 4h2v16H2zm3.5 0h1v16h-1zM8 4h3v16H8zm4.5 0h1.5v16h-1.5zm3 0h2.5v16h-2.5zm4 0h1v16h-1zm2.5 0h2v16h-2zm3.5 0h3v16h-3zm4.5 0h1v16h-1zm2.5 0h1.5v16h-1.5z" />
                </svg>
              </div>
            </div>
          </h3>
          <button onClick={fecharScanner} className="text-gray-400 hover:text-white p-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`${isMuitoCompacto ? 'w-4 h-4' : 'w-5 h-5'}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={`bg-slate-950 relative grow flex items-center justify-center overflow-hidden ${isMuitoCompacto ? 'min-h-[200px]' : 'min-h-[300px]'}`}>
          <div id="leitor-codigo-barras" className="w-full h-full opacity-90 mix-blend-screen"></div>

          {statusCamera === 'iniciando' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-slate-900/80 backdrop-blur-sm">
              <div className="animate-pulse mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${isMuitoCompacto ? 'w-8 h-8' : 'w-12 h-12'} text-gray-400`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                </svg>
              </div>
              <p className={`${isMuitoCompacto ? 'text-xs' : 'text-sm'} text-gray-300`}>Iniciando câmera...</p>
            </div>
          )}

          {statusCamera === 'erro' && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-slate-900/80 backdrop-blur-md ${isMuitoCompacto ? 'p-3' : 'p-6'} text-center border-t border-slate-800/50`}>
              <div className={`${isMuitoCompacto ? 'w-12 h-12 mb-4' : 'w-16 h-16 mb-6'} relative mx-auto`}>
                <style>{`
                  @keyframes animCameraSeq {
                    0%, 15% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
                    25%, 75% { opacity: 0; transform: scale(1.1) translateY(-10px); filter: blur(4px); }
                    85%, 100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
                  }
                  @keyframes animIconSeq {
                    0%, 15% { opacity: 1; transform: translate(0, 0) scale(1); }
                    25% { opacity: 1; transform: translate(-22px, -22px) scale(2.6); }
                    30% { opacity: 1; transform: translate(-22px, -22px) scale(3.1); }
                    35% { opacity: 1; transform: translate(-22px, -22px) scale(2.6); }
                    40% { opacity: 1; transform: translate(-22px, -22px) scale(3.1); }
                    45%, 75% { opacity: 1; transform: translate(-22px, -22px) scale(2.6); }
                    85%, 100% { opacity: 1; transform: translate(0, 0) scale(1); }
                  }
                  .anim-cam-seq { animation: animCameraSeq 6s infinite cubic-bezier(0.4, 0, 0.2, 1); }
                  .anim-icon-seq { animation: animIconSeq 6s infinite cubic-bezier(0.4, 0, 0.2, 1); }
                `}</style>

                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="absolute inset-0 w-full h-full text-slate-300 anim-cam-seq drop-shadow-md">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                </svg>

                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center anim-icon-seq shadow-xl border-2 border-slate-900">
                  {detalheErro === 'permissao' && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  )}

                  {detalheErro === 'hardware' && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  )}

                  {detalheErro === 'tecnico' && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
                    </svg>
                  )}
                </div>
              </div>

              <p className={`font-bold mb-1 ${isMuitoCompacto ? 'text-base' : 'text-lg'} whitespace-pre-line`}>{mensagemErro}</p>
              <p className={`${isMuitoCompacto ? 'text-[10px]' : 'text-sm'} text-gray-400 mb-5 px-4`}>
                {detalheErro === 'permissao'
                  ? 'Verifique as configurações de privacidade do seu navegador.'
                  : 'Certifique-se que o dispositivo não está sendo usado por outro app.'}
              </p>

              <button
                onClick={fecharScanner}
                className={`flex items-center gap-2 text-gray-400 hover:text-white transition-colors ${isMuitoCompacto ? 'py-1.5 px-4' : 'py-2.5 px-6'} rounded-full border border-gray-700 active:bg-gray-800`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                <span className={`font-bold ${isMuitoCompacto ? 'text-[10px]' : 'text-xs'} uppercase tracking-widest`}>Voltar</span>
              </button>
            </div>
          )}
        </div>

        <div className={`${isMuitoCompacto ? 'p-2' : 'p-4'} bg-gray-100 shrink-0 border-t border-gray-200`}>
          <form onSubmit={lidarComEnvioManual} className="flex gap-2">
            <input
              ref={refInputManual}
              type="tel"
              inputMode="numeric"
              value={codigoManual}
              onChange={e => setCodigoManual(e.target.value)}
              placeholder="Digite o código..."
              className={`flex-1 min-w-0 ${isMuitoCompacto ? 'p-2 text-base' : 'p-3 text-lg'} bg-white border border-gray-300 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-green-700 outline-none shadow-sm`}
            />
            <button
              type="submit"
              className={`bg-green-700 text-white ${isMuitoCompacto ? 'px-4' : 'px-6'} rounded-xl font-bold hover:bg-green-800 transition-colors shadow-sm`}
            >
              OK
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalScannerBarras;

