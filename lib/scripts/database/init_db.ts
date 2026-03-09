import { fileURLToPath } from 'node:url';
import { obterAmbienteOperacionalServidor } from '@/infra/ambiente/server';
import { aplicarMigrations } from './aplicar_migrations';
import { carregarCatalogoInicial } from './carregar_catalogo_inicial';
import { normalizarBooleano } from './_comum';
import { resetarBancoLocal } from './reset_banco_local';

const __filename = fileURLToPath(import.meta.url);

interface ResumoInicializacaoBanco {
  ambiente: string;
  resetExecutado: boolean;
  migrationsAplicadas: number;
  migrationsPuladas: number;
  registrosLidos: number;
  registrosInseridos: number;
  lotesProcessados: number;
}

export async function inicializarBanco(): Promise<ResumoInicializacaoBanco> {
  const ambiente = obterAmbienteOperacionalServidor();
  const deveResetarBanco = normalizarBooleano(process.env.INIT_DB_RESETAR_BANCO, false);
  const deveImportarDados = normalizarBooleano(process.env.INIT_DB_IMPORTAR_DADOS, ambiente === 'local');

  console.info(`🌍 APP_ENV=${ambiente}`);
  console.info(`📥 INIT_DB_IMPORTAR_DADOS=${String(deveImportarDados)}`);
  console.info(`🧨 INIT_DB_RESETAR_BANCO=${String(deveResetarBanco)}`);

  if (deveResetarBanco) {
    await resetarBancoLocal();
  }

  const resumoMigrations = await aplicarMigrations();

  if (!deveImportarDados) {
    console.info('ℹ️ Importação de dados desativada para este ambiente.');

    return {
      ambiente,
      resetExecutado: deveResetarBanco,
      migrationsAplicadas: resumoMigrations.migrationsAplicadas,
      migrationsPuladas: resumoMigrations.migrationsPuladas,
      registrosLidos: 0,
      registrosInseridos: 0,
      lotesProcessados: 0
    };
  }

  const resumoCargaInicial = await carregarCatalogoInicial();

  return {
    ambiente,
    resetExecutado: deveResetarBanco,
    migrationsAplicadas: resumoMigrations.migrationsAplicadas,
    migrationsPuladas: resumoMigrations.migrationsPuladas,
    registrosLidos: resumoCargaInicial.registrosLidos,
    registrosInseridos: resumoCargaInicial.registrosInseridos,
    lotesProcessados: resumoCargaInicial.lotesProcessados
  };
}

async function main(): Promise<void> {
  const resumo = await inicializarBanco();

  console.info('\n🎉 Inicialização do banco concluída.');
  console.info(`  🌍 Ambiente: ${resumo.ambiente}`);
  console.info(`  🧨 Reset executado: ${resumo.resetExecutado ? 'sim' : 'não'}`);
  console.info(
    `  🚀 Migrations: aplicadas ${resumo.migrationsAplicadas}, puladas ${resumo.migrationsPuladas}`
  );
  console.info(
    `  📦 Carga inicial: lidos ${resumo.registrosLidos}, inseridos ${resumo.registrosInseridos}, lotes ${resumo.lotesProcessados}`
  );
}

if (process.argv[1] === __filename) {
  main().catch((erro) => {
    console.error('❌ Erro na inicialização do banco:', erro);
    process.exit(1);
  });
}
