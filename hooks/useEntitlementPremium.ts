import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRepositorios } from '../contextos/ContextoRepositorios';
import type { EstadoPremiumCacheado } from '../repositorios/premium';

const TTL_VALIDACAO_PREMIUM_MS = 5 * 60 * 1000;

const ESTADO_GRATUITO: EstadoPremiumCacheado = {
  ativo: false,
  plano: null,
  diasRestantes: 0,
  expiraEm: null,
  ultimaValidacaoEm: null
};

function cachePremiumAindaValido(estadoPremium: EstadoPremiumCacheado): boolean {
  if (!estadoPremium.ativo || !estadoPremium.ultimaValidacaoEm) {
    return false;
  }

  if (Date.now() - estadoPremium.ultimaValidacaoEm > TTL_VALIDACAO_PREMIUM_MS) {
    return false;
  }

  if (!estadoPremium.expiraEm) {
    return true;
  }

  return new Date(estadoPremium.expiraEm).getTime() > Date.now();
}

function tokenPremiumAindaValido(estadoPremium: EstadoPremiumCacheado): boolean {
  if (!estadoPremium.ativo) {
    return false;
  }

  if (!estadoPremium.expiraEm) {
    return estadoPremium.diasRestantes > 0;
  }

  return new Date(estadoPremium.expiraEm).getTime() > Date.now();
}

export function useEntitlementPremium() {
  const { premium } = useRepositorios();
  const [estadoPremium, setEstadoPremium] = useState<EstadoPremiumCacheado>(() =>
    premium.obterEstadoPremium()
  );
  const [carregandoPremium, setCarregandoPremium] = useState(false);

  const aplicarEstadoGratuito = useCallback(() => {
    premium.limparAcesso();
    setEstadoPremium(ESTADO_GRATUITO);
    return ESTADO_GRATUITO;
  }, [premium]);

  const revalidarEstadoPremium = useCallback(
    async (forcar = false): Promise<EstadoPremiumCacheado> => {
      const tokenHash = premium.obterTokenHash();
      const estadoCacheado = premium.obterEstadoPremium();

      if (!tokenHash) {
        return aplicarEstadoGratuito();
      }

      if (!forcar && cachePremiumAindaValido(estadoCacheado)) {
        setEstadoPremium(estadoCacheado);
        return estadoCacheado;
      }

      setCarregandoPremium(true);

      try {
        const resposta = await fetch('/api/tokens/consultar', {
          method: 'GET',
          headers: {
            'X-Premium-Token': tokenHash
          }
        });

        if (!resposta.ok) {
          if ([400, 404, 410].includes(resposta.status)) {
            return aplicarEstadoGratuito();
          }

          throw new Error(`Falha ao consultar premium: ${resposta.status}`);
        }

        const dados = await resposta.json();
        const premiumAtivo = dados.status === 'ativo' || dados.status === 'valido';

        if (!premiumAtivo) {
          return aplicarEstadoGratuito();
        }

        const novoEstado: EstadoPremiumCacheado = {
          ativo: true,
          plano: typeof dados.plano === 'string' ? dados.plano : null,
          diasRestantes: Number(dados.dias_restantes || 0),
          expiraEm: typeof dados.expira_em === 'string' ? dados.expira_em : null,
          ultimaValidacaoEm: Date.now()
        };

        premium.salvarEstadoPremium(novoEstado);
        setEstadoPremium(novoEstado);
        return novoEstado;
      } catch (erro) {
        console.warn('⚠️ [Premium] Falha ao revalidar estado premium. Mantendo cache local se ainda válido.', erro);

        if (tokenPremiumAindaValido(estadoCacheado)) {
          setEstadoPremium(estadoCacheado);
          return estadoCacheado;
        }

        return aplicarEstadoGratuito();
      } finally {
        setCarregandoPremium(false);
      }
    },
    [aplicarEstadoGratuito, premium]
  );

  useEffect(() => {
    const estadoInicial = premium.obterEstadoPremium();

    if (!tokenPremiumAindaValido(estadoInicial)) {
      setEstadoPremium(ESTADO_GRATUITO);
      return;
    }

    setEstadoPremium(estadoInicial);
  }, [premium]);

  useEffect(() => {
    void revalidarEstadoPremium(false);
  }, [revalidarEstadoPremium]);

  useEffect(() => {
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === 'visible') {
        void revalidarEstadoPremium(false);
      }
    };

    document.addEventListener('visibilitychange', aoMudarVisibilidade);
    return () => {
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
    };
  }, [revalidarEstadoPremium]);

  return useMemo(
    () => ({
      estadoPremium,
      premiumAtivo: tokenPremiumAindaValido(estadoPremium),
      carregandoPremium,
      revalidarEstadoPremium
    }),
    [carregandoPremium, estadoPremium, revalidarEstadoPremium]
  );
}
