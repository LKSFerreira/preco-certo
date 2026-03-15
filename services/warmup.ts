/**
 * Serviço de Warm-up (Despertador) para APIs Serverless.
 *
 * Finalidade: Mitigar o atraso de "Cold Start" na Vercel enviando uma
 * requisição silenciosa no momento em que o usuário clica em "Ler Código".
 */

const CHAVE_TIMESTAMP = 'sem_susto_ultimo_warmup';
const INTERVALO_10_MIN_MS = 10 * 60 * 1000;

/**
 * Dispara uma requisição leve para "acordar" as serverless functions.
 * Endpoints GET recebem HEAD; endpoints POST recebem POST com body vazio.
 */
export async function acordarAPIsSilenciosamente() {
    // 1. Verifica se o recurso está desabilitado via Variável de Ambiente
    // No Vite, variáveis sem prefixo VITE_ não são expostas ao frontend.
    // Assumimos que o usuário configurou VITE_COLD_START_API.
    if (import.meta.env.VITE_COLD_START_API === 'false') {
        return;
    }

    // 2. Controle de Throttle: Só dispara se passou 10 min desde a última vez
    const agora = Date.now();
    const ultimoWarmup = localStorage.getItem(CHAVE_TIMESTAMP);

    if (ultimoWarmup && (agora - parseInt(ultimoWarmup)) < INTERVALO_10_MIN_MS) {
        // Já está "quente" ou já tentamos recentemente
        return;
    }

    // 3. Execução: Dispara pings para os endpoints críticos
    // Usamos Promise.allSettled para não travar se um falhar
    console.log('⏰ [WARMUP] Acordando APIs serverless para evitar Cold Start...');

    localStorage.setItem(CHAVE_TIMESTAMP, agora.toString());

    try {
        const endpoints = [
            { url: '/api/ia/analisar', method: 'POST' },
            { url: '/api/cosmos/gtin/000000000000001', method: 'HEAD' },
        ];

        await Promise.allSettled(
            endpoints.map(({ url, method }) =>
                fetch(url, { method, cache: 'no-store' })
                    .catch(() => {/* silencia erros de rede no ping */ })
            )
        );

        console.log('✅ [WARMUP] APIs notificadas.');
    } catch (erro) {
        // Warmup nunca deve quebrar a experiência do usuário
        console.warn('⚠️ [WARMUP] Falha ao enviar sinal de despertar.', erro);
    }
}
