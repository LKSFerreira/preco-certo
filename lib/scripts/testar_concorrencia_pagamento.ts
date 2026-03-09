import { Pool } from 'pg';

type PlanoId = 'plano_cafe' | 'plano_lanche' | 'plano_apoiador';

type RespostaPix = {
  pagamento_id: string;
  status: string;
  modo_confirmacao?: 'automatico' | 'manual';
};

type RespostaStatus = {
  pagamento_id: string;
  status: string;
};

type RespostaConfirmacao = {
  status: number;
  body: Record<string, unknown>;
};

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';
const DATABASE_URL = process.env.DATABASE_URL;
const planoId = (process.argv[2] as PlanoId | undefined) || 'plano_apoiador';

if (!DATABASE_URL) {
  console.error('Erro: DATABASE_URL não definida.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const resposta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(`Falha em ${url}: ${resposta.status} ${erro}`);
  }

  return resposta.json() as Promise<T>;
}

async function getJson<T>(url: string): Promise<T> {
  const resposta = await fetch(url);

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(`Falha em ${url}: ${resposta.status} ${erro}`);
  }

  return resposta.json() as Promise<T>;
}

async function obterPagamentoAprovado(): Promise<string> {
  console.log(`Buscando pagamento mockado aprovado para o plano ${planoId}...`);

  for (let tentativa = 1; tentativa <= 6; tentativa += 1) {
    const pix = await postJson<RespostaPix>(`${API_BASE}/pagamentos/pix`, {
      plano_id: planoId,
    });

    const status = await getJson<RespostaStatus>(
      `${API_BASE}/pagamentos/status?id=${encodeURIComponent(pix.pagamento_id)}`
    );

    console.log(
      `Tentativa ${tentativa}: pagamento_id=${pix.pagamento_id} status=${status.status}`
    );

    if (status.status === 'aprovado') {
      return pix.pagamento_id;
    }
  }

  throw new Error('Não foi possível obter um pagamento mockado aprovado.');
}

async function confirmarPagamentoEmParalelo(pagamentoId: string): Promise<RespostaConfirmacao[]> {
  const payload = {
    pagamento_id: pagamentoId,
    plano_id: planoId,
  };

  const requisicao = async (): Promise<RespostaConfirmacao> => {
    const resposta = await fetch(`${API_BASE}/pagamentos/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return {
      status: resposta.status,
      body: (await resposta.json()) as Record<string, unknown>,
    };
  };

  return Promise.all([requisicao(), requisicao()]);
}

async function contarTokens(pagamentoId: string): Promise<number> {
  const resultado = await pool.query(
    'SELECT COUNT(*)::int AS total FROM tokens WHERE pagamento_id = $1',
    [pagamentoId]
  );

  return resultado.rows[0]?.total ?? 0;
}

async function main() {
  try {
    const pagamentoId = await obterPagamentoAprovado();
    console.log(`\nPagamento aprovado selecionado: ${pagamentoId}`);

    const respostas = await confirmarPagamentoEmParalelo(pagamentoId);
    console.log('\nRespostas das confirmações em paralelo:');
    console.log(JSON.stringify(respostas, null, 2));

    const totalTokens = await contarTokens(pagamentoId);
    console.log(`\nTotal de tokens persistidos para ${pagamentoId}: ${totalTokens}`);

    const houveErroInterno = respostas.some((resposta) => resposta.status >= 500);
    const quantidadeCreated = respostas.filter((resposta) => resposta.status === 201).length;
    const quantidadeOk = respostas.filter((resposta) => resposta.status === 200).length;

    if (houveErroInterno) {
      throw new Error('Teste falhou: houve resposta 500 no fluxo concorrente.');
    }

    if (totalTokens !== 1) {
      throw new Error(`Teste falhou: esperado 1 token persistido, encontrado ${totalTokens}.`);
    }

    if (quantidadeCreated < 1) {
      throw new Error('Teste falhou: nenhuma confirmação retornou 201.');
    }

    if (quantidadeCreated > 1) {
      throw new Error('Teste falhou: mais de uma confirmação retornou 201.');
    }

    if (quantidadeOk < 1) {
      throw new Error('Teste falhou: nenhuma confirmação retornou 200 token_existente.');
    }

    console.log('\nTeste concluído com sucesso: idempotência concorrente validada.');
  } finally {
    await pool.end();
  }
}

main().catch((erro) => {
  console.error('\nErro no teste de concorrência:', erro);
  process.exit(1);
});
