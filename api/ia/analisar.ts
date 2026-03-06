import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validarAcessoPremium } from '../_lib/auth.js';

/**
 * Proxy serverless para a API Groq (Meta Llama).
 *
 * **Por que existe:** A chave da API Groq NUNCA deve estar no frontend.
 * Este proxy recebe a imagem/texto do browser, chama a Groq server-side,
 * e retorna o resultado. A chave fica segura no servidor.
 *
 * **Uso:** POST /api/ia/analisar
 * **Body:** { "tipo": "imagem" | "texto", "conteudo": "base64 ou texto" }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ erro: 'Método não permitido' });
    }

    // A chave fica no servidor — SEM prefixo VITE_
    const groqToken = process.env.GROQ_TOKEN;

    if (!groqToken) {
        return res.status(500).json({ erro: 'Chave Groq não configurada no servidor' });
    }

    const { tipo, conteudo } = req.body || {};

    if (!tipo || !conteudo) {
        return res.status(400).json({ erro: 'Campos "tipo" e "conteudo" são obrigatórios' });
    }

    if (!['imagem', 'texto'].includes(tipo)) {
        return res.status(400).json({ erro: 'Tipo deve ser "imagem" ou "texto"' });
    }

    // Validação Premium (Protegendo a API)
    const tokenHash = req.headers['x-premium-token'] as string;

    if (tokenHash) {
        const isPremium = await validarAcessoPremium(tokenHash);
        if (!isPremium) {
            return res.status(403).json({ erro: 'Token Premium inválido ou expirado.' });
        }
    }
    // Obs: Usuários Free (tokenHash undefined) passam direto pois o bloqueio de cota de 10 chamadas
    // está atualmente implementado de forma Statefull no cliente/localstorage.
    // Em produção estrita, o ideal é o Tracking por IP aqui mesmo no Backend.

    // Modelos Groq (Free Tier)
    const MODELO_VISION = 'meta-llama/llama-4-scout-17b-16e-instruct';
    const MODELO_TEXTO = 'llama-3.1-8b-instant';

    try {
        let messages: any[];
        let modelo: string;

        if (tipo === 'imagem') {
            // Análise de rótulo via visão computacional
            modelo = MODELO_VISION;

            const dataUri = conteudo.startsWith('data:')
                ? conteudo
                : `data:image/jpeg;base64,${conteudo}`;

            messages = [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Analise este rótulo de produto. Extraia Nome, Marca e Tamanho/Peso.
Responda EXCLUSIVAMENTE um JSON puro, sem markdown, no formato:
{ "descricao": "...", "marca": "...", "tamanho": "..." }

Regras:
1. descricao: Nome completo e claro do produto.
2. marca: Marca do fabricante (ex: Coca-Cola, Nestlé).
3. tamanho: Peso/Volume com unidade (ex: 350ml, 1kg).

IMPORTANTE: Se não encontrar a informação, retorne string vazia "". NÃO invente, NÃO coloque "Não informado", "N/A" ou "Sem nome".`,
                        },
                        {
                            type: 'image_url',
                            image_url: { url: dataUri },
                        },
                    ],
                },
            ];
        } else {
            // Padronização de texto via LLM
            modelo = MODELO_TEXTO;

            messages = [
                {
                    role: 'user',
                    content: `Analise o seguinte texto de produto: "${conteudo}".

Tarefa: Padronizar e extrair Nome Completo, Marca e Tamanho.

REGRAS CRÍTICAS:
1. descricao: Nome COMPLETO do produto (ex: "Nescau 2.0", não apenas "2.0").
   - Sempre inclua o nome comercial completo.
   - Remova códigos estranhos e caracteres especiais.
   - Use Title Case.
2. marca: APENAS a marca do fabricante (ex: "Nestlé", "Coca-Cola").
   - NÃO inclua o nome do produto na marca.
   - Se houver vírgula, pegue apenas a primeira parte que é a marca real.
   - Se não encontrar marca, retorne string vazia "".
3. tamanho: Peso/Volume padronizado (ex: 2 L, 500 g, 350 mL, 1 kg, 3 uni, 2 cx, 5 pct, 7 pç).

IMPORTANTE: Se não encontrar a informação, retorne string vazia "". NÃO invente, NÃO coloque "Não informado", "N/A" ou "Sem nome".

EXEMPLOS:
- "NESCAU 2.0 CEREAL MATINAL NESTLE 400G" → { "descricao": "Nescau 2.0 Cereal Matinal", "marca": "Nestlé", "tamanho": "400g" }
- "COCA COLA LT 350ML" → { "descricao": "Coca Cola Lata", "marca": "Coca-Cola", "tamanho": "350ml" }
- "CERVEJA SKOL LATA 350ML FARDO 12 UN" → { "descricao": "Cerveja Skol Lata", "marca": "Skol", "tamanho": "12 uni" }
- "SABONETE DOVE ORIGINAL 90G LEVE 6 PAGUE 5" → { "descricao": "Sabonete Original", "marca": "Dove", "tamanho": "6 uni" }
- "PAPEL HIGIENICO NEVE FOLHA DUPLA 30M 12 UNIDADES" → { "descricao": "Papel Higiênico Folha Dupla", "marca": "Neve", "tamanho": "12 uni" }
- "CAIXA DE BOMBOM GAROTO 250G" → { "descricao": "Caixa de Bombom", "marca": "Garoto", "tamanho": "250 g" }
- "ARROZ TIO JOAO TIPO 1 PACOTE 5KG" → { "descricao": "Arroz Tipo 1", "marca": "Tio João", "tamanho": "5 kg" }

SEM PREAMBULO. APENAS JSON:
{ "descricao": "...", "marca": "...", "tamanho": "..." }`,
                },
            ];
        }

        // Chama a API Groq server-side (chave segura)
        const resposta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${groqToken}`,
            },
            body: JSON.stringify({
                model: modelo,
                messages,
                temperature: 0.1,
                max_tokens: 1024,
                ...(tipo === 'texto' ? { response_format: { type: 'json_object' } } : {}),
            }),
        });

        if (!resposta.ok) {
            const erroBody = await resposta.text();
            console.error('🚨 [Proxy IA] Groq retornou erro:', resposta.status, erroBody);
            return res.status(resposta.status).json({ erro: 'Erro na API de IA' });
        }

        const dados = await resposta.json();
        const textoResposta = dados.choices?.[0]?.message?.content;

        if (!textoResposta) {
            return res.status(500).json({ erro: 'Resposta vazia da IA' });
        }

        // Extrai JSON da resposta (pode vir com markdown ao redor)
        const jsonMatch = textoResposta.match(/\{[\s\S]*\}/);
        const jsonLimpo = jsonMatch ? jsonMatch[0] : textoResposta;

        try {
            const dadosExtraidos = JSON.parse(jsonLimpo);
            return res.status(200).json(dadosExtraidos);
        } catch {
            // Se não conseguiu parsear, retorna o texto bruto
            return res.status(200).json({ texto_bruto: textoResposta });
        }
    } catch (erro: any) {
        console.error('🚨 [Proxy IA] Erro:', erro.message);
        return res.status(500).json({ erro: 'Erro interno no proxy de IA' });
    }
}
