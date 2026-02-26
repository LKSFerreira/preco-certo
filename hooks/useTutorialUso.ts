import { useState, useEffect } from 'react';

export const CHAVE_TUTORIAL_VISTO = 'sem_susto_tutorial_v9';

/**
 * Hook para verificar se deve mostrar o tutorial.
 */
export const useTutorialPrimeiroAcesso = () => {
    const [mostrar, setMostrar] = useState(false);

    const tentarMostrar = () => {
        const jaVisto = localStorage.getItem(CHAVE_TUTORIAL_VISTO);
        if (!jaVisto) {
            setMostrar(true);
            return true;
        }
        return false;
    };

    const fechar = () => setMostrar(false);

    const marcarComoVisto = () => {
        localStorage.setItem(CHAVE_TUTORIAL_VISTO, 'true');
        fechar();
    };

    return { mostrar, fechar, tentarMostrar, marcarComoVisto };
};
