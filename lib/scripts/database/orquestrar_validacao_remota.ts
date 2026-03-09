import { fileURLToPath } from 'node:url';
import { obterAmbienteOperacionalServidor } from '@/infra/ambiente/server';
import { aplicarMigrations } from './aplicar_migrations';
import { carregarCatalogoInicial } from './carregar_catalogo_inicial';
import { validarBancoRemoto } from './validar_banco_remoto';

const __filename = fileURLToPath(import.meta.url);

interface ResumoOrquestracao {
  ambiente: string;
  migrationsAplicadas: number;
  migrationsPuladas: number;
  registrosLidos: number;
  registrosInseridos: number;
  lotesProcessados: number;
  migrationsEsperadas: number;
  migrationsAplicadasNoBanco: number;
  totalProdutosEsperado: number;
  totalProdutosNoBanco: number;
  gtinValidado: string;
}

export async function orquestrarValidacaoRemota(): Promise<ResumoOrquestracao> {
  const ambiente = obterAmbienteOperacionalServidor();

  console.info('🧭 Iniciando orquestração da validação remota...');
  console.info(`🌍 APP_ENV=${ambiente}`);

  console.info('\n== Etapa 1/3: migrations ==');
  const resumoMigrations = await aplicarMigrations();

  console.info('\n== Etapa 2/3: carga_inicial ==');
  const resumoCargaInicial = await carregarCatalogoInicial();

  console.info('\n== Etapa 3/3: validacao ==');
  const resumoValidacao = await validarBancoRemoto();

  return {
    ambiente,
    migrationsAplicadas: resumoMigrations.migrationsAplicadas,
    migrationsPuladas: resumoMigrations.migrationsPuladas,
    registrosLidos: resumoCargaInicial.registrosLidos,
    registrosInseridos: resumoCargaInicial.registrosInseridos,
    lotesProcessados: resumoCargaInicial.lotesProcessados,
    migrationsEsperadas: resumoValidacao.migrationsEsperadas,
    migrationsAplicadasNoBanco: resumoValidacao.migrationsAplicadas,
    totalProdutosEsperado: resumoValidacao.totalProdutosEsperado,
    totalProdutosNoBanco: resumoValidacao.totalProdutosNoBanco,
    gtinValidado: resumoValidacao.gtinValidado
  };
}

async function main(): Promise<void> {
  const resumo = await orquestrarValidacaoRemota();

  console.info('\n📋 Resumo final da orquestração:');
  console.info(`  🌍 Ambiente: ${resumo.ambiente}`);
  console.info(
    `  🚀 Migrations: aplicadas agora ${resumo.migrationsAplicadas}, puladas ${resumo.migrationsPuladas}`
  );
  console.info(
    `  🧱 Schema final: ${resumo.migrationsAplicadasNoBanco}/${resumo.migrationsEsperadas} migrations registradas`
  );
  console.info(
    `  📦 Carga inicial: lidos ${resumo.registrosLidos}, inseridos ${resumo.registrosInseridos}, lotes ${resumo.lotesProcessados}`
  );
  console.info(
    `  🗃️  Catálogo no banco: ${resumo.totalProdutosNoBanco} registros (mínimo esperado: ${resumo.totalProdutosEsperado})`
  );
  console.info(`  🔎 GTIN validado: ${resumo.gtinValidado}`);
  console.info('\n✅ Orquestração concluída com sucesso.');
}

if (process.argv[1] === __filename) {
  main().catch((erro) => {
    console.error('\n❌ Falha na orquestração da validação remota:', erro);
    process.exit(1);
  });
}
