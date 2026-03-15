import { fileURLToPath } from 'node:url';
import { criarPoolDatabase, obterClienteComRetry } from './_comum';

const __filename = fileURLToPath(import.meta.url);

async function testarConexao(): Promise<void> {
  const pool = criarPoolDatabase();
  console.info('🔎 Iniciando teste de conexão com o banco de dados...');

  try {
    // Usamos um timeout menor no retry do comum para não ficar pendurado muito tempo em erro de senha/host
    const cliente = await obterClienteComRetry(pool, 5, 2000);
    
    try {
      // Faz um ping real no banco para confirmar a engine e a saúde
      const resultado = await cliente.query<{ version: string }>('SELECT version()');
      
      console.info('\n✅ Sucesso! Conexão estabelecida e operante.');
      console.info(`📌 Versão do Banco: ${resultado.rows[0]?.version}`);
      
    } finally {
      cliente.release();
    }

  } catch (erro: any) {
    console.error('\n❌ Falha grave ao tentar conectar no banco de dados.\n');
    
    // Análise semântica do erro para devolver feedback legível ao usuário
    const mensagemErro = erro.cause?.message || erro.message || '';
    const codigoErro = erro.cause?.code || '';

    if (codigoErro === 'ENOTFOUND' || mensagemErro.includes('getaddrinfo')) {
      console.error('💡 Diagnóstico: O servidor (host) não foi encontrado.');
      console.error('   👉 Verifique se a URL no .env está digitada corretamente e se não há quebras de linha.');
    } else if (codigoErro === 'ECONNREFUSED') {
      console.error('💡 Diagnóstico: Conexão recusada pela porta.');
      console.error('   👉 Verifique se o banco está ligado (Docker) ou se o Supabase terminou de provisionar e a porta está correta.');
    } else if (mensagemErro.includes('password authentication failed')) {
      console.error('💡 Diagnóstico: Senha ou usuário incorretos.');
      console.error('   👉 Verifique se a senha na string DATABASE_URL do .env confere com a que você gerou no Supabase.');
    } else if (mensagemErro.includes('timeout')) {
      console.error('💡 Diagnóstico: Timeout de rede.');
      console.error('   👉 O servidor não respondeu a tempo. Pode ser restrição de rede (ex: rede local bloqueando porta 6543) ou banco suspenso no Supabase.');
    } else {
      console.error('💡 Diagnóstico não mapeado. Detalhes originais abaixo:');
      console.error(erro);
    }
    
    process.exit(1);
    
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === __filename) {
  testarConexao().catch((erro) => {
    console.error('Erro não tratado:', erro);
    process.exit(1);
  });
}
