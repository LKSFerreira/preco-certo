import React, { useRef, useState } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { comprimirImagemBase64 } from '../services/utilitarios';

interface Props {
  imagem: string;
  aoConfirmar: (imagemRecortadaBase64: string) => void;
  aoCancelar: () => void;
}

export const ModalRecorte: React.FC<Props> = ({ imagem, aoConfirmar, aoCancelar }) => {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [processando, setProcessando] = useState(false);
  const [erroRecorte, setErroRecorte] = useState<string | null>(null);

  const finalizarRecorte = async () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    setProcessando(true);
    setErroRecorte(null);

    try {
      // Mantemos limite de resolucao para reduzir picos de memoria em celulares.
      const canvas = cropper.getCroppedCanvas({
        maxWidth: 1024,
        maxHeight: 1024,
        imageSmoothingQuality: 'high',
      });

      if (!canvas) {
        throw new Error('Falha ao gerar canvas do recorte');
      }

      const base64Bruto = canvas.toDataURL('image/jpeg', 0.9);
      const base64Comprimido = await comprimirImagemBase64(base64Bruto, 0.7, 400);
      aoConfirmar(base64Comprimido);
    } catch (erroProcessamento) {
      console.error('Erro ao processar recorte da imagem:', erroProcessamento);
      setErroRecorte('Nao foi possivel processar a foto neste dispositivo. Tente novamente com outra imagem.');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[60] bg-black bg-opacity-95 flex flex-col animate-fade-in">
      <div className="flex-1 relative bg-black flex items-center justify-center p-4">
        <Cropper
          src={imagem}
          style={{ height: '100%', width: '100%' }}
          initialAspectRatio={0}
          aspectRatio={NaN}
          guides={true}
          viewMode={1}
          dragMode="move"
          responsive={true}
          autoCropArea={0.8}
          checkOrientation={false}
          ref={cropperRef}
          background={false}
          className="max-h-[77vh]"
        />
      </div>

      <div className="bg-white p-4 pb-8 rounded-t-2xl shadow-2xl flex flex-col gap-3 animate-slide-up shrink-0 relative z-[70]">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto" />

        {erroRecorte && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-xs font-medium">
            {erroRecorte}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={aoCancelar}
            disabled={processando}
            className="w-14 items-center justify-center font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl active:scale-95 transition-transform flex"
            aria-label="Cancelar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={finalizarRecorte}
            disabled={processando}
            className="flex-1 py-3.5 font-bold text-white bg-verde-700 rounded-xl shadow-lg hover:bg-verde-700 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            {processando ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            )}
            <span>CONFIRMAR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
