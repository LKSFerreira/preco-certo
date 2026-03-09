const URL_ALVO = process.env.CORS_TEST_URL || 'http://localhost:3000/api/health';

interface CasoTesteCors {
  descricao: string;
  origin: string;
  permitido: boolean;
}

const CASOS_TESTE: CasoTesteCors[] = [
  {
    descricao: 'localhost deve ser permitido no backend local',
    origin: 'http://localhost:5173',
    permitido: true
  },
  {
    descricao: 'origem externa deve ser bloqueada',
    origin: 'https://malicious-site.com',
    permitido: false
  }
];

async function validarCasoTeste(casoTeste: CasoTesteCors): Promise<void> {
  const resposta = await fetch(URL_ALVO, {
    method: 'GET',
    headers: {
      Origin: casoTeste.origin
    }
  });

  const cabecalhoAllowOrigin = resposta.headers.get('access-control-allow-origin');

  console.info(`\n--- ${casoTeste.descricao} ---`);
  console.info(`Origin: ${casoTeste.origin}`);
  console.info(`Status Code: ${resposta.status}`);
  console.info(`Access-Control-Allow-Origin: ${cabecalhoAllowOrigin || 'NÃO PRESENTE'}`);

  if (casoTeste.permitido && cabecalhoAllowOrigin !== casoTeste.origin) {
    throw new Error(`Origem deveria ser permitida: ${casoTeste.origin}`);
  }

  if (!casoTeste.permitido && cabecalhoAllowOrigin) {
    throw new Error(`Origem deveria ser bloqueada, mas recebeu ${cabecalhoAllowOrigin}`);
  }
}

async function main(): Promise<void> {
  for (const casoTeste of CASOS_TESTE) {
    await validarCasoTeste(casoTeste);
  }

  console.info('\n✅ Verificação manual de CORS concluída com sucesso.');
}

main().catch((erro) => {
  console.error('\n❌ Falha na verificação manual de CORS:', erro);
  process.exit(1);
});
