import express from 'express';
import type { Request, Response } from 'express';
import os from 'os';

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
const PORT = process.env.PORT || 3000;

// Middleware para parse do JSON
app.use(express.json({ limit: '10mb' }));

// Middleware de CORS Manual (Dinâmico para Local + Rede)
app.use((req, res, next) => {
    const origin = req.headers.origin;

    // Definição de origens permitidas (Regex)
    const allowedOrigins = [
        /^http:\/\/localhost:\d+$/, // localhost em qualquer porta (dev)
        /^http:\/\/127\.0\.0\.1:\d+$/, // loopback
        /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/, // Rede local (192.168.x.x)
        /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}:\d+$/, // Docker/Rede Privada (172.16-31.x.x)
        /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/, // Rede interna (10.x.x.x)
        /^https:\/\/www\.semsusto\.app$/ // Produção (apenas referência, quem barra é o Vercel)
    ];

    if (origin) {
        const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));

        if (isAllowed) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, PATCH, DELETE, POST, PUT');
            res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-API-Secret');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
    }

    // Trata preflight request (OPTIONS) imediatamente
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    next();
});

// Middleware de Log
app.use((req, res, next) => {
    console.log(`[API Local] ${req.method} ${req.url} | Origin: ${req.headers.origin || 'N/A'}`);
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

// Inicia Servidor
app.listen(PORT, '0.0.0.0', () => {
    const hostIp = process.env.HOST_IP || 'Não detectado';

    // Banner Estético (ANSI)
    setTimeout(() => {
        const hostUrl = `http://localhost:${PORT}`;
        const mobileUrl = `http://${hostIp}:${PORT}`;

        // Descobre IP nativo da rede Docker interna
        let internalIp = '';
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            const iface = interfaces[name]?.find((i) => i.family === 'IPv4' && !i.internal);
            if (iface) {
                internalIp = iface.address;
                break;
            }
        }
        const networkUrl = `http://${internalIp}:${PORT} (Internal)`;
        const statusMsg = 'Pronto para receber conexões!';

        // Largura interna exata da caixa (quantidade de '═')
        const INNER_WIDTH = 64;

        // Função para calcular o espaçamento exato ignorando as cores ANSI
        const formatRow = (icon, label, text, colorCode) => {
            // Fixa um tamanho para a coluna da esquerda (ícone + label) ex: 16 caracteres
            const prefix = `  ${icon} ${label}:`.padEnd(16, ' ');
            // O texto da URL preenche exatamente o espaço que falta para bater na parede (64 - 16 = 48)
            const content = text.padEnd(INNER_WIDTH - 16, ' ');

            // Retorna a linha montada já com as bordas em Ciano e o texto colorido
            return `        \x1b[1;36m║\x1b[0m${colorCode}${prefix}\x1b[0m${content}\x1b[1;36m║\x1b[0m`;
        };

        // Geração das bordas retas (repete o caractere 64 vezes)
        const borderTop = `        \x1b[1;36m╔${'═'.repeat(INNER_WIDTH)}╗\x1b[0m`;
        const borderMiddle = `        \x1b[1;36m╠${'═'.repeat(INNER_WIDTH)}╣\x1b[0m`;
        const borderBottom = `        \x1b[1;36m╚${'═'.repeat(INNER_WIDTH)}╝\x1b[0m`;

        // Preenche o título até encostar na parede direita
        const titleText = `  🚀 SEM SUSTO - API LOCAL / BACKEND`.padEnd(INNER_WIDTH, ' ');

        // Impressão no console sem misturar recuos de código
        console.log(`\n${borderTop}`);
        console.log(`        \x1b[1;36m║\x1b[0m\x1b[1;35m${titleText}\x1b[0m\x1b[1;36m║\x1b[0m`);
        console.log(borderMiddle);
        console.log(formatRow('💻', 'Host', hostUrl, '\x1b[1;32m'));
        console.log(formatRow('📱', 'Mobile', mobileUrl, '\x1b[1;33m'));
        console.log(formatRow('🌐', 'Network', networkUrl, '\x1b[1;34m'));
        console.log(borderMiddle);
        console.log(formatRow('🟢', 'Status', statusMsg, '\x1b[1;37m'));
        console.log(`${borderBottom}\n`);

        console.log('        Endpoints mapeados via adapter:');
        console.log('        - POST /api/ia/analisar');
        console.log('        - GET  /api/cosmos/gtin/:codigo');
        console.log('        - POST /api/tokens/gerar');
        console.log('        - POST /api/tokens/ativar');
        console.log('        - GET  /api/tokens/consultar');
        console.log('        - ALL  /api/produtos/:codigo\n');
    }, 500);
});
