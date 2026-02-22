import { useState, useEffect } from 'react';

export const CHAVE_TUTORIAL_FOTO_VISTO = 'sem_susto_tutorial_foto_v8';

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
