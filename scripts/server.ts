import express from 'express';
import type { Request, Response } from 'express';

// Importa os handlers da API
// @ts-ignore
import analisarHandler from '../api/ia/analisar';
// @ts-ignore
import cosmosHandler from '../api/cosmos/gtin/[codigo]';
// @ts-ignore
import gerarTokenHandler from '../api/tokens/gerar';
// @ts-ignore
import ativarTokenHandler from '../api/tokens/ativar';
// @ts-ignore
import consultarTokenHandler from '../api/tokens/consultar';
// @ts-ignore
import produtosHandler from '../api/produtos/[codigo]';

const app = express();
const PORT = 3000;

// Middleware para parse do JSON
app.use(express.json({ limit: '10mb' }));

// Middleware de Log
app.use((req, res, next) => {
    console.log(`[API Local] ${req.method} ${req.url}`);
    next();
});

// Wrapper para adaptar Express (req, res) para Vercel (req, res)
// O VercelRequest é compatível com express.Request, mas o VercelResponse adiciona helpers
const adapter = (handler: any) => async (req: Request, res: Response) => {
    try {
        await handler(req, res);
    } catch (erro) {
        console.error('[API Local] Erro não tratado no handler:', erro);
        if (!res.headersSent) {
            res.status(500).json({ erro: 'Erro interno no servidor local' });
        }
    }
};

// --- ROTAS (Mapeamento Manual) ---

// IA
app.post('/api/ia/analisar', adapter(analisarHandler));

// Cosmos (Dynamic Route: /api/cosmos/gtin/:codigo)
app.get('/api/cosmos/gtin/:codigo', (req, res) => {
    // Injeta o query param 'codigo' na query string também, 
    // pois alguns handlers podem ler de req.query ou req.params
    req.query.codigo = req.params.codigo;
    return adapter(cosmosHandler)(req, res);
});

// Tokens
app.post('/api/tokens/gerar', adapter(gerarTokenHandler));
app.post('/api/tokens/ativar', adapter(ativarTokenHandler));
app.get('/api/tokens/consultar', adapter(consultarTokenHandler));

// Produtos (CRUD Seguro)
app.all('/api/produtos/:codigo', (req, res) => {
    // Garante que o parametro da URL chegue na query (padrão Vercel)
    req.query.codigo = req.params.codigo;
    return adapter(produtosHandler)(req, res);
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', ambiente: 'local-server' });
});

console.log('Produtos Handler:', produtosHandler);

// Inicia Servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 Servidor API Local rodando!
   URL: http://localhost:${PORT}
   
   Endpoints mapeados:
   - POST /api/ia/analisar
   - GET  /api/cosmos/gtin/:codigo
   - POST /api/tokens/gerar
   - POST /api/tokens/ativar
   - GET  /api/tokens/consultar
   - ALL  /api/produtos/:codigo
`);
});
