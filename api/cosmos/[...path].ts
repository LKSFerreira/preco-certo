import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Proxy para API Bluesoft Cosmos.
 *
 * Resolve problema de CORS em produção, fazendo a requisição
 * server-side e retornando para o frontend.
 *
 * Uso: /api/cosmos/gtins/7891910000197.json
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extrai o path após /api/cosmos/
  const { path } = req.query;
  const pathSegments = Array.isArray(path) ? path : [path];
  const cosmosPath = pathSegments.join('/');

  // Token vem das variáveis de ambiente da Vercel
  const cosmosToken = process.env.VITE_COSMOS_TOKEN;

  if (!cosmosToken) {
    return res.status(500).json({ error: 'Token COSMOS não configurado' });
  }

  try {
    const response = await fetch(`https://api.cosmos.bluesoft.com.br/${cosmosPath}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Cosmos-API-Request',
        'Content-Type': 'application/json',
        'X-Cosmos-Token': cosmosToken,
      },
    });

    // Repassa status code
    if (!response.ok) {
      return res.status(response.status).json({
        error: `API Cosmos retornou ${response.status}`,
      });
    }

    const data = await response.json();

    // Define headers CORS para permitir qualquer origem
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[Proxy Cosmos] Erro:', error.message);
    return res.status(500).json({ error: 'Falha ao consultar API Cosmos' });
  }
}
