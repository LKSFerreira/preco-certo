
// Script de 'Pentest' (Teste de Penetração) Simulado
const API_URL = 'http://localhost:3000/api';
const TARGET_ID = '9999999999999';

async function attack() {
    console.log('🏴‍☠️ INICIANDO MODO HACKER: Tentando quebrar a API...\n');

    // 1. Teste de SQL Injection
    console.log('💉 [Ataque 1] Tentativa de SQL Injection');
    const payloadSQL = {
        descricao: "Produto '; DROP TABLE produtos; --",
        marca: "Hacker Inc",
        tamanho: "1kg"
    };
    await sendRequest('POST', `/produtos/${TARGET_ID}`, payloadSQL, 'SQL Injection');

    // 2. Teste de XSS (Cross Site Scripting)
    console.log('\n🎭 [Ataque 2] Tentativa de Stored XSS');
    const payloadXSS = {
        descricao: "<script>alert('pwned')</script>",
        marca: "<img src=x onerror=alert(1)>",
        tamanho: "1kg"
    };
    await sendRequest('POST', `/produtos/${TARGET_ID}`, payloadXSS, 'XSS Payload');

    // 3. Teste de Lixo / Payload Inválido
    console.log('\n🗑️ [Ataque 3] Fuzzing com dados inválidos');
    const payloadLixo = {
        descricao: "", // Vazio deve falhar
        marca: 12345,  // Tipo errado
        extra_field: "eu nao deveria existir" // Campo extra
    };
    await sendRequest('POST', `/produtos/${TARGET_ID}`, payloadLixo, 'Invalid Data');

    // 4. Teste de Rate Limit (Flood)
    console.log('\n🌊 [Ataque 4] Flood Attack (Rate Limit Check)');
    console.log('   Disparando 15 requisições em paralelo...');
z
    const promises = [];
    for (let i = 0; i < 15; i++) {
        promises.push(sendRequest('POST', `/produtos/${TARGET_ID}`, {
            descricao: `Flood ${i}`,
            marca: "Bot",
            tamanho: "1un"
        }, `Req #${i + 1}`, true));
    }

    await Promise.all(promises);
}

async function sendRequest(method, endpoint, body, testName, silent = false) {
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const status = res.status;
        const data = await res.json().catch(() => ({}));

        if (!silent) {
            console.log(`   Status: ${status}`);
            if (status === 200) console.log(`   ⚠️  Resultado: SUCESSO (O ataque passou ou foi sanitizado?)`);
            else if (status === 400) console.log(`   🛡️  Resultado: BLOQUEADO (Validação Zod disparou)`);
            else if (status === 500) console.log(`   ❌  Resultado: ERRO 500 (Potencial falha no servidor)`);
            else if (status === 429) console.log(`   🛑  Resultado: RATE LIMITED (Escudo de flood ativo)`);

            console.log(`   Resposta:`, JSON.stringify(data).substring(0, 100) + '...');
        } else {
            // Log simplificado para o flood
            if (status === 429) process.stdout.write('🛑 ');
            else if (status === 200) process.stdout.write('✅ ');
            else process.stdout.write('❓ ');
        }
    } catch (e) {
        console.error(`   ❌ Falha na conexão: ${e.message}`);
    }
}

attack();
