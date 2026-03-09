import express from 'express';
import os from 'os';
import type { Request, Response } from 'express';

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
// @ts-ignore
import pixHandler from '../api/pagamentos/pix';
// @ts-ignore
import pixStatusHandler from '../api/pagamentos/status';
// @ts-ignore
import confirmarPagamentoHandler from '../api/pagamentos/confirmar';
// @ts-ignore
import solicitarAprovacaoManualHandler from '../api/pagamentos/manual/solicitar';
// @ts-ignore
import aprovarPagamentoManualHandler from '../api/pagamentos/manual/aprovar';

const app = express();
const PORTA = Number(process.env.PORT || 3000);
const contadorPollingStatus = new Map<string, number>();
const ultimoLogPollingStatus = new Map<string, number>();
const JANELA_LOG_POLLING_MS = 5000;

app.use(express.json({ limit: '10mb' }));

app.use((requisicao, resposta, proximo) => {
  const origem = requisicao.headers.origin;
  const origensPermitidas = [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,
    /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}:\d+$/,
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/,
    /^https:\/\/www\.semsusto\.app$/
  ];

  if (origem) {
    const origemPermitida = origensPermitidas.some((padrao) => padrao.test(origem));

    if (origemPermitida) {
      resposta.setHeader('Access-Control-Allow-Origin', origem);
      resposta.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, PATCH, DELETE, POST, PUT');
      resposta.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-API-Secret'
      );
      resposta.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }

  if (requisicao.method === 'OPTIONS') {
    resposta.status(200).end();
    return;
  }

  proximo();
});

app.use((requisicao, resposta, proximo) => {
  const origem = requisicao.headers.origin || 'N/A';

  if (requisicao.method === 'GET' && requisicao.path === '/api/pagamentos/status') {
    const idQuery = typeof requisicao.query.id === 'string' ? requisicao.query.id : '';
    let pagamentoId = idQuery;

    if (!pagamentoId) {
      try {
        const url = new URL(requisicao.url, 'http://localhost');
        pagamentoId = url.searchParams.get('id') || 'sem-id';
      } catch {
        pagamentoId = 'sem-id';
      }
    }

    const chave = pagamentoId || 'sem-id';
    const total = (contadorPollingStatus.get(chave) || 0) + 1;
    contadorPollingStatus.set(chave, total);

    const agora = Date.now();
    const ultimoLog = ultimoLogPollingStatus.get(chave) || 0;
    const deveLogar = total === 1 || agora - ultimoLog >= JANELA_LOG_POLLING_MS;

    if (deveLogar) {
      console.log(
        `[API Local] GET /api/pagamentos/status?id=${chave} | polling x${total} | Origin: ${origem}`
      );
      ultimoLogPollingStatus.set(chave, agora);
    }

    proximo();
    return;
  }

  console.log(`[API Local] ${requisicao.method} ${requisicao.url} | Origin: ${origem}`);
  proximo();
});

const adaptarHandler =
  (handler: (req: Request, res: Response) => Promise<unknown>) =>
  async (requisicao: Request, resposta: Response) => {
    try {
      await handler(requisicao, resposta);
    } catch (erro) {
      console.error('[API Local] Erro não tratado no handler:', erro);

      if (!resposta.headersSent) {
        resposta.status(500).json({ erro: 'Erro interno no servidor local' });
      }
    }
  };

app.post('/api/ia/analisar', adaptarHandler(analisarHandler));

app.get('/api/cosmos/gtin/:codigo', (requisicao, resposta) => {
  requisicao.query.codigo = requisicao.params.codigo;
  return adaptarHandler(cosmosHandler)(requisicao, resposta);
});

app.post('/api/tokens/gerar', adaptarHandler(gerarTokenHandler));
app.post('/api/tokens/ativar', adaptarHandler(ativarTokenHandler));
app.get('/api/tokens/consultar', adaptarHandler(consultarTokenHandler));

app.all('/api/produtos/:codigo', (requisicao, resposta) => {
  requisicao.query.codigo = requisicao.params.codigo;
  return adaptarHandler(produtosHandler)(requisicao, resposta);
});

app.post('/api/pagamentos/pix', adaptarHandler(pixHandler));
app.get('/api/pagamentos/status', adaptarHandler(pixStatusHandler));
app.post('/api/pagamentos/confirmar', adaptarHandler(confirmarPagamentoHandler));
app.post('/api/pagamentos/manual/solicitar', adaptarHandler(solicitarAprovacaoManualHandler));
app.post('/api/pagamentos/manual/aprovar', adaptarHandler(aprovarPagamentoManualHandler));

app.get('/api/health', (_requisicao, resposta) => {
  resposta.json({ status: 'ok', ambiente: 'local-server' });
});

function descobrirIpInterno(): string {
  const interfaces = os.networkInterfaces();

  for (const nomeInterface of Object.keys(interfaces)) {
    const interfaceIpv4 = interfaces[nomeInterface]?.find(
      (detalheInterface) => detalheInterface.family === 'IPv4' && !detalheInterface.internal
    );

    if (interfaceIpv4) {
      return interfaceIpv4.address;
    }
  }

  return 'não detectado';
}

function formatarLinhaBanner(
  icone: string,
  rotulo: string,
  texto: string,
  codigoCorAnsi: string,
  larguraInterna: number
): string {
  const prefixo = `  ${icone} ${rotulo}:`.padEnd(16, ' ');
  const conteudo = texto.padEnd(larguraInterna - 16, ' ');
  return `        \x1b[1;36m║\x1b[0m${codigoCorAnsi}${prefixo}\x1b[0m${conteudo}\x1b[1;36m║\x1b[0m`;
}

function imprimirBannerInicial(): void {
  const hostIp = process.env.HOST_IP || 'não detectado';
  const hostUrl = `http://localhost:${PORTA}`;
  const mobileUrl = `http://${hostIp}:${PORTA}`;
  const networkUrl = `http://${descobrirIpInterno()}:${PORTA} (Internal)`;
  const larguraInterna = 64;
  const bordaSuperior = `        \x1b[1;36m╔${'═'.repeat(larguraInterna)}╗\x1b[0m`;
  const bordaMeio = `        \x1b[1;36m╠${'═'.repeat(larguraInterna)}╣\x1b[0m`;
  const bordaInferior = `        \x1b[1;36m╚${'═'.repeat(larguraInterna)}╝\x1b[0m`;
  const titulo = '  🚀 SEM SUSTO - API LOCAL / BACKEND'.padEnd(larguraInterna, ' ');

  console.log(`\n${bordaSuperior}`);
  console.log(`        \x1b[1;36m║\x1b[0m\x1b[1;35m${titulo}\x1b[0m\x1b[1;36m║\x1b[0m`);
  console.log(bordaMeio);
  console.log(formatarLinhaBanner('💻', 'Host', hostUrl, '\x1b[1;32m', larguraInterna));
  console.log(formatarLinhaBanner('📱', 'Mobile', mobileUrl, '\x1b[1;33m', larguraInterna));
  console.log(formatarLinhaBanner('🌐', 'Network', networkUrl, '\x1b[1;34m', larguraInterna));
  console.log(bordaMeio);
  console.log(
    formatarLinhaBanner(
      '🟢',
      'Status',
      'Pronto para receber conexões!',
      '\x1b[1;37m',
      larguraInterna
    )
  );
  console.log(`${bordaInferior}\n`);
  console.log('        Endpoints mapeados via adapter:');
  console.log('        - POST /api/ia/analisar');
  console.log('        - GET  /api/cosmos/gtin/:codigo');
  console.log('        - POST /api/tokens/gerar');
  console.log('        - POST /api/tokens/ativar');
  console.log('        - GET  /api/tokens/consultar');
  console.log('        - ALL  /api/produtos/:codigo');
  console.log('        - POST /api/pagamentos/pix');
  console.log('        - GET  /api/pagamentos/status');
  console.log('        - POST /api/pagamentos/confirmar');
  console.log('        - POST /api/pagamentos/manual/solicitar');
  console.log('        - POST /api/pagamentos/manual/aprovar\n');
}

app.listen(PORTA, '0.0.0.0', () => {
  setTimeout(() => {
    imprimirBannerInicial();
  }, 500);
});
