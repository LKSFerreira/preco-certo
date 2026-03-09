const API_URL = 'http://localhost:3000/api';
const TARGET_ID = '9999999999999';

async function atacarApi(): Promise<void> {
  console.log('🏴‍☠️ INICIANDO MODO HACKER: Tentando quebrar a API...\n');

  console.log('💉 [Ataque 1] Tentativa de SQL Injection');
  await enviarRequisicao(
    'POST',
    `/produtos/${TARGET_ID}`,
    {
      descricao: "Produto '; DROP TABLE produtos; --",
      marca: 'Hacker Inc',
      tamanho: '1kg'
    },
    'SQL Injection'
  );

  console.log('\n🎭 [Ataque 2] Tentativa de Stored XSS');
  await enviarRequisicao(
    'POST',
    `/produtos/${TARGET_ID}`,
    {
      descricao: "<script>alert('pwned')</script>",
      marca: '<img src=x onerror=alert(1)>',
      tamanho: '1kg'
    },
    'XSS Payload'
  );

  console.log('\n🗑️ [Ataque 3] Fuzzing com dados inválidos');
  await enviarRequisicao(
    'POST',
    `/produtos/${TARGET_ID}`,
    {
      descricao: '',
      marca: 12345,
      extra_field: 'eu nao deveria existir'
    },
    'Invalid Data'
  );

  console.log('\n🌊 [Ataque 4] Flood Attack (Rate Limit Check)');
  console.log('   Disparando 15 requisições em paralelo...');

  const requisicoesParalelas = Array.from({ length: 15 }, (_, indiceAtual) =>
    enviarRequisicao(
      'POST',
      `/produtos/${TARGET_ID}`,
      {
        descricao: `Flood ${indiceAtual}`,
        marca: 'Bot',
        tamanho: '1un'
      },
      `Req #${indiceAtual + 1}`,
      true
    )
  );

  await Promise.all(requisicoesParalelas);
}

async function enviarRequisicao(
  metodo: string,
  endpoint: string,
  body: Record<string, unknown>,
  nomeTeste: string,
  silencioso = false
): Promise<void> {
  try {
    const resposta = await fetch(`${API_URL}${endpoint}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const status = resposta.status;
    const dados = await resposta.json().catch(() => ({}));

    if (!silencioso) {
      console.log(`   Status: ${status}`);

      if (status === 200) {
        console.log(`   ⚠️ Resultado: SUCESSO (${nomeTeste})`);
      } else if (status === 400) {
        console.log('   🛡️ Resultado: BLOQUEADO (Validação Zod disparou)');
      } else if (status === 500) {
        console.log('   ❌ Resultado: ERRO 500 (Potencial falha no servidor)');
      } else if (status === 429) {
        console.log('   🛑 Resultado: RATE LIMITED (Escudo de flood ativo)');
      }

      console.log('   Resposta:', `${JSON.stringify(dados).substring(0, 100)}...`);
      return;
    }

    if (status === 429) {
      process.stdout.write('🛑 ');
    } else if (status === 200) {
      process.stdout.write('✅ ');
    } else {
      process.stdout.write('❓ ');
    }
  } catch (erro) {
    const mensagemErro = erro instanceof Error ? erro.message : String(erro);
    console.error(`   ❌ Falha na conexão: ${mensagemErro}`);
  }
}

atacarApi().catch((erro) => {
  console.error('❌ Erro fatal no teste manual de segurança:', erro);
  process.exit(1);
});
