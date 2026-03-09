const fs = require('fs');
const path = require('path');

const filesToFix = [
    ".metadocs/feat/plano_implementacao_postgres_producao.md",
    ".metadocs/roadmap_supabase_prontidao_producao.md",
    ".metadocs/walkthrough/idempotencia_confirmacao_pagamento.md",
    ".metadocs/walkthrough/refatoracao_auditoria_telemetria.md",
    ".metadocs/historico.md"
];

const dictionary = {
    "implementacao": "implementação",
    "producao": "produção",
    "confirmacao": "confirmação",
    "confirmacoes": "confirmações",
    "solucao": "solução",
    "analise": "análise",
    "unica": "única",
    "unico": "único",
    "concluido": "concluído",
    "concluida": "concluída",
    "concluidas": "concluídas",
    "acao": "ação",
    "acoes": "ações",
    "atualizacao": "atualização",
    "nao": "não",
    "ja": "já",
    "ate": "até",
    "idempotencia": "idempotência",
    "concorrencia": "concorrência",
    "estrategia": "estratégia",
    "governanca": "governança",
    "validacao": "validação",
    "operacao": "operação",
    "observacao": "observação",
    "configuracao": "configuração",
    "verificacao": "verificação",
    "decisao": "decisão",
    "decisoes": "decisões",
    "criacao": "criação",
    "exibicao": "exibição",
    "padrao": "padrão",
    "padroes": "padrões",
    "usuario": "usuário",
    "usuarios": "usuários",
    "codigo": "código",
    "codigos": "códigos",
    "historico": "histórico",
    "logica": "lógica",
    "obrigatorio": "obrigatório",
    "obrigatoria": "obrigatória",
    "invalido": "inválido",
    "automatica": "automática",
    "automatico": "automático",
    "tecnico": "técnico",
    "tecnica": "técnica",
    "tecnicas": "técnicas",
    "relatorio": "relatório",
    "cenario": "cenário",
    "cenarios": "cenários",
    "dominio": "domínio",
    "necessario": "necessário",
    "necessaria": "necessária",
    "tambem": "também",
    "sera": "será",
    "sao": "são",
    "estao": "estão",
    "integracao": "integração",
    "separacao": "separação",
    "prontidao": "prontidão",
    "visao": "visão",
    "funcoes": "funções",
    "funcao": "função",
    "recomendacao": "recomendação",
    "migracao": "migração",
    "comunicacao": "comunicação",
    "execucao": "execução",
    "aprovacao": "aprovação",
    "solicitacao": "solicitação",
    "explicitas": "explícitas",
    "explicito": "explícito",
    "anonimizacao": "anonimização",
    "modulo": "módulo",
    "modulos": "módulos"
};

const wordsPattern = new RegExp(`\\b(${Object.keys(dictionary).join('|')})\\b`, 'gi');

for (const filepath of filesToFix) {
    // When running inside docker, the root is /app
    const fullPath = path.join('/app', filepath);
    if (!fs.existsSync(fullPath)) {
        console.log(`Skipping missing file: ${fullPath}`);
        continue;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    content = content.replace(wordsPattern, (match) => {
        const lowerMatch = match.toLowerCase();
        const replacement = dictionary[lowerMatch];
        if (!replacement) return match;

        if (match === match.toUpperCase()) {
            return replacement.toUpperCase();
        } else if (match[0] === match[0].toUpperCase()) {
            return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        return replacement;
    });

    content = content.replace(/\bpos-/gi, (match) => match[0] === 'P' ? 'Pós-' : 'pós-')
                     .replace(/\bpre-/gi, (match) => match[0] === 'P' ? 'Pré-' : 'pré-');

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed accents in ${filepath}`);
}
