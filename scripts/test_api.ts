
// Script de teste de integração para a API de Produtos
// import { fetch } from 'undici'; // Fetch para Node.js (se necessário, ou global)

const API_URL = 'http://localhost:3000/api';
const CODIGO_TESTE = '2820520021372'; // EAN de teste

async function teste() {
    console.log('🚀 Iniciando Testes de Integração API Produtos...');

    // 1. Teste de Validação (Zod) - Deve falhar
    console.log('\n🔸 Teste 1: Validação de Schema (Esperado: 400)');
    try {
        const res = await fetch(`${API_URL}/produtos/${CODIGO_TESTE}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: 'Invalido' }) // Campo errado, sem descricao
        });
        console.log(`Status: ${res.status}`);
        if (res.status === 400) console.log('✅ Passou (400 Bad Request)');
        else console.error('❌ Falhou');
        console.log(await res.json());
    } catch (e) { console.error(e); }

    // 2. Teste de Salvamento (Sucesso)
    console.log('\n🔸 Teste 2: Salvar Produto Válido (Esperado: 200)');
    try {
        const res = await fetch(`${API_URL}/produtos/${CODIGO_TESTE}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                descricao: 'Produto de Teste Automatizado',
                marca: 'Sem Susto Inc',
                tamanho: '1kg',
                preco_estimado: 10.50,
                imagem: ''
            })
        });
        console.log(`Status: ${res.status}`);
        if (res.status === 200) {
            console.log('✅ Passou (200 OK)');
            const json = await res.json();
            console.log('Retorno:', json);
        } else {
            console.error('❌ Falhou');
            console.log(await res.text());
        }
    } catch (e) { console.error(e); }

    // 3. Teste de Leitura
    console.log('\n🔸 Teste 3: Ler Produto Salvo (Esperado: 200)');
    try {
        const res = await fetch(`${API_URL}/produtos/${CODIGO_TESTE}`);
        console.log(`Status: ${res.status}`);
        if (res.status === 200) {
            const json: any = await res.json();
            if (json.codigo_barras === CODIGO_TESTE) console.log('✅ Passou (Dados Corretos)');
            else console.error('❌ Falhou (Dados Incorretos)');
        } else {
            console.error('❌ Falhou');
        }
    } catch (e) { console.error(e); }
}

teste();
