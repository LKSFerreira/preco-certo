import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy, useRef } from 'react';
import { Produto, ItemCarrinho, ItemCarrinhoExpandido, TelaApp, Compra } from './types';
import { IMAGEM_PADRAO, LIMITE_ITENS_DISTINTOS_CARRINHO_GRATUITO } from './constants';
import { formatarMoeda } from './services/utilitarios';
const ScannerCodigo = lazy(() => import('./components/ModalScannerBarras'));
import ModalLoadingCarrinho from './components/ModalLoadingCarrinho';
const ModalFormularioProduto = lazy(() => import('./components/ModalFormularioProduto'));
import DebugConsole from './components/DebugConsole';

const ModalContato = lazy(() => import('./components/ModalContato'));
const ModalBloqueio = lazy(() => import('./components/ModalBloqueio'));
const ModalConfirmacao = lazy(() => import('./components/ModalConfirmacao'));
const ModalTutorialUso = lazy(() => import('./components/ModalTutorialUso'));
const ModalAtivarToken = lazy(() => import('./components/ModalAtivarToken'));
const ModalHistoricoCompras = lazy(() => import('./components/ModalHistoricoCompras'));
const ModalPlano = lazy(() => import('./components/ModalPlano'));
const ModalPagamento = lazy(() => import('./components/ModalPagamento'));
const ModalPagamentoAprovado = lazy(() => import('./components/ModalPagamentoAprovado'));
import { useTutorialPrimeiroAcesso } from './hooks/useTutorialUso';
import { apiGerarPix } from './services/api-pagamento';
import { RespostaCriacaoPagamento, PlanoID } from './services/pagamento/tipos';
import { useRepositorios } from './contextos/ContextoRepositorios';
import BannerInstalarApp from './components/BannerInstalarApp';
import { useEntitlementPremium } from './hooks/useEntitlementPremium';


export default function App() {
  // --- Acesso aos repositórios via contexto ---
  const { produtos: repositorioProdutos, carrinho: repositorioCarrinho, historico: repositorioHistorico } = useRepositorios();
  const { estadoPremium, premiumAtivo, revalidarEstadoPremium } = useEntitlementPremium();

  // --- Tutorial de primeiro acesso ---
  const { mostrar: mostrarTutorial, tentarMostrar, marcarComoVisto: marcarTutorialComoVisto } = useTutorialPrimeiroAcesso();

  // --- Estados ---
  const [telaAtual, setTelaAtual] = useState<TelaApp>('DASHBOARD');

  // Catálogo: produtos completos (descricao, marca, imagem, preco...)
  const [catalogo, setCatalogo] = useState<Record<string, Produto>>({});

  // Carrinho: apenas referências (codigo_barras + quantidade)
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  // Flag para indicar se os dados foram carregados
  const [carregado, setCarregado] = useState(false);

  // Estado para fluxo de cadastro/adição
  const [codigoLido, setCodigoLido] = useState<string | null>(null);
  const [dadosPrePreenchidos, setDadosPrePreenchidos] = useState<Partial<Produto> | null>(null);

  // Flag para diferenciar Novo Produto (soma +1) de Edição (atualiza dados)
  const [modoEdicao, setModoEdicao] = useState(false);


  const [mostrarContato, setMostrarContato] = useState(false);
  const [mostrarConfirmacaoEsvaziar, setMostrarConfirmacaoEsvaziar] = useState(false);
  const [mostrarConfirmacaoFinalizar, setMostrarConfirmacaoFinalizar] = useState(false);

  // Estado para feedback visual durante busca em cascata
  const [etapaBusca, setEtapaBusca] = useState<string | null>(null);

  // Estados Premium
  const [mostrarAtivarToken, setMostrarAtivarToken] = useState(false);
  const [deepLinkToken, setDeepLinkToken] = useState<string | null>(null);
  const [mostrarHistoricoCompras, setMostrarHistoricoCompras] = useState(false);
  const [historicoCompras, setHistoricoCompras] = useState<Compra[]>([]);
  const [carregandoHistoricoCompras, setCarregandoHistoricoCompras] = useState(false);
  const [mostrarBloqueioCarrinhoPremium, setMostrarBloqueioCarrinhoPremium] = useState(false);

  // Estados de Pagamento (Monetização)
  const [mostrarModalPlano, setMostrarModalPlano] = useState(false);
  const [mostrarModalPagamento, setMostrarModalPagamento] = useState(false);
  const [dadosPagamento, setDadosPagamento] = useState<RespostaCriacaoPagamento | null>(null);
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoID | null>(null);

  // Estados de Pagamento Aprovado (Token gerado)
  const [mostrarModalAprovado, setMostrarModalAprovado] = useState(false);
  const [tokenGerado, setTokenGerado] = useState<string | null>(null);
  const [diasAtivadosGerado, setDiasAtivadosGerado] = useState(0);
  const [nomePlanoGerado, setNomePlanoGerado] = useState('');
  const confirmacoesPagamentoEmAndamento = useRef<Set<string>>(new Set());

  // Controle de continuidade após tutorial
  const [acaoPendenteTutorial, setAcaoPendenteTutorial] = useState<(() => void) | null>(null);

  // --- Efeitos (Carregamento inicial) ---

  /**
   * Verifica se há um Token de Ativação Premium na URL (Deep Link)
   */
  useEffect(() => {
    // Busca na Rota (Deep Link limpo) Ex: /ativar/SEM-SUSTO-123
    const path = window.location.pathname;
    const matchRoute = path.match(/^\/ativar\/([A-Z0-9-]+)$/i);

    const tokenUrl = matchRoute ? matchRoute[1] : null;

    if (tokenUrl) {
      setDeepLinkToken(tokenUrl.toUpperCase());
      setMostrarAtivarToken(true);
    }

    // Redirecionamento 404 (Fallback Visual)
    // Se a URL contém qualquer caminho que não seja a Home limpa ('/'), ele corrige a barra de endereços
    if (path !== '/') {
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  /**
   * Carrega dados do repositório ao iniciar o app.
   *
   * Limpa localStorage para garantir experiência de "primeiro acesso"
   * durante fase de validação com usuários.
   */
  useEffect(() => {
    /* 
    // DEBUG controlado: simula primeiro acesso no máximo 1x a cada 5 minutos
    const CHAVE_DEBUG_ULTIMA_LIMPEZA = 'sem_susto_debug_ultima_limpeza_localstorage';
    const INTERVALO_MINIMO_LIMPEZA_MS = 5 * 60 * 1000;

    try {
      const agora = Date.now();
      const ultimaLimpezaTexto = localStorage.getItem(CHAVE_DEBUG_ULTIMA_LIMPEZA);
      const ultimaLimpeza = ultimaLimpezaTexto ? Number(ultimaLimpezaTexto) : 0;
      const tempoDesdeUltimaLimpeza = agora - ultimaLimpeza;

      if (
        import.meta.env.DEV &&
        import.meta.env.VITE_DEBUG_RESET_LOCALSTORAGE === 'true' &&
        (!ultimaLimpeza || Number.isNaN(ultimaLimpeza) || tempoDesdeUltimaLimpeza >= INTERVALO_MINIMO_LIMPEZA_MS)
      ) {
        localStorage.clear();
        localStorage.setItem(CHAVE_DEBUG_ULTIMA_LIMPEZA, String(agora));
        console.log('🧹 localStorage limpo (debug com throttle de 5 minutos)');
      } else if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_RESET_LOCALSTORAGE === 'true') {
        const segundosRestantes = Math.ceil((INTERVALO_MINIMO_LIMPEZA_MS - tempoDesdeUltimaLimpeza) / 1000);
        console.log(`⏱️ limpeza de debug ignorada; nova limpeza disponível em ~${segundosRestantes}s`);
      }
    } catch (erroLimpeza) {
      console.warn('⚠️ Falha ao executar limpeza debug com throttle:', erroLimpeza);
    } 
    */

    const carregarDados = async () => {
      try {
        // Carrega catálogo (converte array para objeto indexado)
        const listaProdutos = await repositorioProdutos.listarTodos();
        const catalogoCarregado: Record<string, Produto> = {};
        listaProdutos.forEach(produto => {
          catalogoCarregado[produto.codigo_barras] = produto;
        });
        setCatalogo(catalogoCarregado);

        // Carrega carrinho (agora são apenas referências)
        const itensCarrinho = await repositorioCarrinho.obterItens();
        setCarrinho(itensCarrinho);

        setCarregado(true);
      } catch (erro) {
        console.error('🚨 Erro ao carregar dados:', erro);
        setCarregado(true);
      }
    };

    carregarDados();
  }, [repositorioProdutos, repositorioCarrinho]);

  useEffect(() => {
    if (!premiumAtivo && mostrarHistoricoCompras) {
      setMostrarHistoricoCompras(false);
    }
  }, [mostrarHistoricoCompras, premiumAtivo]);

  useEffect(() => {
    if (!mostrarHistoricoCompras || !premiumAtivo) {
      return;
    }

    let cancelado = false;
    setCarregandoHistoricoCompras(true);

    const carregarHistoricoCompras = async () => {
      try {
        const compras = await repositorioHistorico.listarTodas();

        if (!cancelado) {
          setHistoricoCompras(compras);
        }
      } catch (erro) {
        console.error('🚨 Erro ao carregar histórico de compras:', erro);

        if (!cancelado) {
          setHistoricoCompras([]);
        }
      } finally {
        if (!cancelado) {
          setCarregandoHistoricoCompras(false);
        }
      }
    };

    void carregarHistoricoCompras();

    return () => {
      cancelado = true;
    };
  }, [mostrarHistoricoCompras, premiumAtivo, repositorioHistorico]);

  const abrirHistoricoPremium = useCallback(() => {
    // Dispara revalidação em background, mas decide a abertura com base no estado atual (fluido)
    void revalidarEstadoPremium(false);

    if (premiumAtivo) {
      setMostrarHistoricoCompras(true);
      return;
    }

    setMostrarModalPlano(true);
  }, [premiumAtivo, revalidarEstadoPremium]);

  const solicitarAberturaScanner = useCallback(() => {
    // Revalida em background sem travar
    void revalidarEstadoPremium(false);

    if (!premiumAtivo && carrinho.length >= LIMITE_ITENS_DISTINTOS_CARRINHO_GRATUITO) {
      setMostrarBloqueioCarrinhoPremium(true);
      return;
    }

    import('./services/warmup').then(({ acordarAPIsSilenciosamente }) => {
      acordarAPIsSilenciosamente();
    });
    setTelaAtual('SCANNER');
  }, [carrinho.length, premiumAtivo, revalidarEstadoPremium]);

  // --- Funções de Join (Carrinho + Catálogo) ---

  /**
   * Expande o carrinho fazendo join com o catálogo.
   * Transforma referências em objetos completos para exibição na UI.
   */
  const carrinhoExpandido = useMemo((): ItemCarrinhoExpandido[] => {
    return carrinho
      .map(item => {
        const produto = catalogo[item.codigo_barras];
        if (!produto) return null; // Produto não encontrado no catálogo
        return {
          ...produto,
          quantidade: item.quantidade
        };
      })
      .filter((item): item is ItemCarrinhoExpandido => item !== null);
  }, [carrinho, catalogo]);

  /**
   * Calcula o total do carrinho usando os dados expandidos.
   */
  const calcularTotal = useMemo(() => {
    return carrinhoExpandido.reduce(
      (acc, item) => acc + ((item.preco_estimado || 0) * item.quantidade),
      0
    );
  }, [carrinhoExpandido]);

  // --- Lógica de Negócio ---

  /**
   * Adiciona um produto ao carrinho (apenas referência).
   * O produto já deve estar no catálogo.
   *
   * IMPORTANTE: Calcula a quantidade final ANTES de atualizar.
   * Isso garante que estado React e localStorage fiquem sincronizados.
   */
  const adicionarAoCarrinho = useCallback(async (codigo_barras: string) => {
    // Lê o estado atual para calcular a nova quantidade
    // (usa a referência do carrinho no momento da chamada)
    const itemExistente = carrinho.find(item => item.codigo_barras === codigo_barras);
    const novaQuantidade = itemExistente ? itemExistente.quantidade + 1 : 1;

    // Revalidação assíncrona
    void revalidarEstadoPremium(false);

    if (
      !premiumAtivo &&
      !itemExistente &&
      carrinho.length >= LIMITE_ITENS_DISTINTOS_CARRINHO_GRATUITO
    ) {
      setMostrarBloqueioCarrinhoPremium(true);
      return false;
    }

    // Atualiza estado local (UI responsiva)
    setCarrinho(prev => {
      const index = prev.findIndex(item => item.codigo_barras === codigo_barras);
      if (index >= 0) {
        const novoCarrinho = [...prev];
        novoCarrinho[index].quantidade = novaQuantidade;
        return novoCarrinho;
      }
      return [...prev, { codigo_barras, quantidade: 1 }];
    });

    // Persiste no repositório com quantidade absoluta
    try {
      if (itemExistente) {
        // Produto já existe: atualiza quantidade
        await repositorioCarrinho.atualizarQuantidade(codigo_barras, novaQuantidade);
      } else {
        // Produto novo: adiciona com quantidade 1
        await repositorioCarrinho.adicionarItem(codigo_barras, 1);
      }
    } catch (erro) {
      console.error('🚨 Erro ao sincronizar carrinho:', erro);
    }
    return true;
  }, [carrinho, revalidarEstadoPremium, repositorioCarrinho]);

  /**
   * Salva produto no catálogo (localStorage + banco de dados).
   * Chamado após encontrar nas APIs ou após edição pelo usuário.
   */
  const salvarProdutoNoCatalogo = useCallback(async (produto: Produto) => {
    await repositorioProdutos.salvar(produto);
    setCatalogo(prev => ({ ...prev, [produto.codigo_barras]: produto }));
    console.log(`💾 [CATÁLOGO] Produto salvo: ${produto.codigo_barras}`);
  }, [repositorioProdutos]);

  /**
   * Callback do formulário "Salvar Produto".
   * Atualiza o catálogo e adiciona/atualiza no carrinho.
   */
  const aoSalvarProduto = useCallback(async (produto: Produto) => {
    // 1. Salva no catálogo (sempre)
    await salvarProdutoNoCatalogo(produto);

    // 2. Decide: Adicionar (+1) ou apenas atualizar dados (Edição)
    if (!modoEdicao) {
      const produtoFoiAdicionadoAoCarrinho = await adicionarAoCarrinho(produto.codigo_barras);

      if (produtoFoiAdicionadoAoCarrinho === false) {
        setTelaAtual('DASHBOARD');
        setCodigoLido(null);
        setModoEdicao(false);
        return;
      }
    }
    // Se for edição, o produto já está no carrinho, só atualizou o catálogo

    setTelaAtual('DASHBOARD');
    setCodigoLido(null);
    setModoEdicao(false);
  }, [salvarProdutoNoCatalogo, adicionarAoCarrinho, modoEdicao]);

  /**
   * Callback quando um código de barras é lido.
   *
   * Ordem de Busca:
   * 1. Catálogo LocalStorage (Cache do usuário)
   * 2. TODO: Banco de Dados PostgreSQL
   * 3. OpenFoodFacts (Gratuita/Colaborativa)
   * 4. API Cosmos (Comercial - Fallback)
   * 5. Formulário Manual
   */
  const aoLerCodigo = useCallback(async (codigo_barras: string) => {
    setCodigoLido(codigo_barras);
    setModoEdicao(false);
    setDadosPrePreenchidos(null);

    console.log(`\n🔍 [BUSCA] Iniciando busca para GTIN: ${codigo_barras}`);

    // 1. Verifica cache rápido (estado React em memória)
    setEtapaBusca('Verificando memória...');
    if (catalogo[codigo_barras]) {
      console.log(`✅ [ORIGEM: MEMÓRIA] Produto encontrado no cache do estado`);

      // Validação de Preço Zerado (Staging)
      if (catalogo[codigo_barras].preco_estimado <= 0) {
        console.log(`⚠️ [PREÇO ZERADO] Redirecionando para edição...`);
        setDadosPrePreenchidos(catalogo[codigo_barras]);
        setModoEdicao(true);
        setTelaAtual('CADASTRO');
        setCodigoLido(codigo_barras);
        setEtapaBusca(null);
        return;
      }

      setEtapaBusca(null);
      await adicionarAoCarrinho(codigo_barras);
      setTelaAtual('DASHBOARD');
      setCodigoLido(null);
      return;
    }

    // 2. Busca em Cascata via Repositório (IndexedDB -> Postgres)
    // Passamos o callback setEtapaBusca para que o repositório informe o progresso
    const produtoEncontradoNoStorage = await repositorioProdutos.buscarPorGTIN(codigo_barras, (status) => {
      setEtapaBusca(status);
    });

    if (produtoEncontradoNoStorage) {
      console.log(`✅ [ORIGEM: STORAGE] Produto encontrado no repositório`);
      setEtapaBusca(null);

      // Sincroniza catálogo em memória
      setCatalogo(prev => ({ ...prev, [produtoEncontradoNoStorage.codigo_barras]: produtoEncontradoNoStorage }));

      await adicionarAoCarrinho(codigo_barras);
      setTelaAtual('DASHBOARD');
      setCodigoLido(null);
      return;
    }

    // 3. Consulta OpenFoodFacts (Prioridade API)
    setEtapaBusca('🌍 Buscando produtos...');
    console.log(`🌍 [BUSCANDO] OpenFoodFacts API...`);

    // IMPORTAÇÃO DINÂMICA
    const { buscarProdutoOFF } = await import('./services/openfoodfacts');
    let produtoEncontrado = await buscarProdutoOFF(codigo_barras);

    if (produtoEncontrado) {
      console.log(`✅ [ORIGEM: OPENFOODFACTS] Produto encontrado!`);
      console.log(`   📦 Dados:`, produtoEncontrado);

      // NÃO SALVAR AUTOMATICAMENTE!
      // Apenas preenche o formulário para o usuário confirmar.
      produtoEncontrado.preco_estimado = 0;
      console.log(`📝 [REDIRECIONAR] Abrindo formulário para validação manual`);
      setEtapaBusca(null);

    } else {
      console.log(`❌ [OPENFOODFACTS] Não encontrado`);

      // 4. Consulta API Cosmos (Fallback)
      setEtapaBusca('📦 Verificando catálogo...');
      console.log(`📦 [BUSCANDO] Cosmos API...`);

      // IMPORTAÇÃO DINÂMICA
      const { buscarProdutoCosmos } = await import('./services/cosmos');
      produtoEncontrado = await buscarProdutoCosmos(codigo_barras);

      if (produtoEncontrado) {
        console.log(`✅ [ORIGEM: COSMOS] Produto encontrado!`);
        console.log(`   📦 Dados:`, produtoEncontrado);

        // NÃO SALVAR AUTOMATICAMENTE!
        // Apenas preenche o formulário para o usuário confirmar.
        produtoEncontrado.preco_estimado = 0;
        console.log(`📝 [REDIRECIONAR] Abrindo formulário para validação manual`);
        setEtapaBusca(null);

      } else {
        console.log(`❌ [COSMOS] Não encontrado`);
        console.log(`📝 [ORIGEM: CADASTRO MANUAL] Usuário precisará preencher`);
        setEtapaBusca(null);
      }
    }

    if (produtoEncontrado) {
      setDadosPrePreenchidos(produtoEncontrado);
    }

    // 5. Abre formulário (preenchido ou vazio)
    setTelaAtual('CADASTRO');
  }, [catalogo, adicionarAoCarrinho, salvarProdutoNoCatalogo]);

  /**
   * Remove um item do carrinho.
   */
  const removerItem = useCallback(async (codigo_barras: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    setCarrinho(prev => prev.filter(item => item.codigo_barras !== codigo_barras));

    try {
      await repositorioCarrinho.removerItem(codigo_barras);
    } catch (erro) {
      console.error('🚨 Erro ao remover item:', erro);
    }
  }, [repositorioCarrinho]);

  /**
   * Altera a quantidade de um item no carrinho.
   */
  const alterarQuantidade = useCallback(async (codigo_barras: string, delta: number) => {
    let novaQuantidade = 0;

    setCarrinho(prev => {
      return prev.reduce((acc, item) => {
        if (item.codigo_barras === codigo_barras) {
          novaQuantidade = item.quantidade + delta;

          if (novaQuantidade > 0) {
            acc.push({ ...item, quantidade: novaQuantidade });
          } else {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(50);
            }
          }
        } else {
          acc.push(item);
        }
        return acc;
      }, [] as ItemCarrinho[]);
    });

    try {
      if (novaQuantidade > 0) {
        await repositorioCarrinho.atualizarQuantidade(codigo_barras, novaQuantidade);
      } else {
        await repositorioCarrinho.removerItem(codigo_barras);
      }
    } catch (erro) {
      console.error('🚨 Erro ao alterar quantidade:', erro);
    }
  }, [repositorioCarrinho]);

  /**
   * Abre a tela de edição para um item do carrinho.
   */
  const aoEditarItem = useCallback((item: ItemCarrinhoExpandido) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    setCodigoLido(item.codigo_barras);
    setModoEdicao(true);
    setDadosPrePreenchidos(null);
    setTelaAtual('CADASTRO');
  }, []);

  /**
   * Executa a finalização da compra.
   */
  const executarFinalizacao = useCallback(async () => {
    setMostrarConfirmacaoFinalizar(false);

    try {
      const estadoPremiumAtual = await revalidarEstadoPremium(false);

      // Cria objeto de compra com snapshot dos itens expandidos
      const novaCompra = {
        id: crypto.randomUUID(),
        data: new Date().toISOString(),
        itens: [...carrinhoExpandido], // Snapshot completo
        total: calcularTotal
      };

      await repositorioHistorico.salvar(novaCompra);
      await repositorioCarrinho.limpar();
      setCarrinho([]);
      if (!estadoPremiumAtual.ativo) {
        setMostrarModalPlano(true);
      }
    } catch (erro) {
      console.error('🚨 Erro ao finalizar compra:', erro);
    }
  }, [carrinhoExpandido, calcularTotal, revalidarEstadoPremium, repositorioHistorico, repositorioCarrinho]);

  const solicitarFinalizacao = useCallback(() => {
    if (carrinho.length === 0) return;
    setMostrarConfirmacaoFinalizar(true);
  }, [carrinho.length]);

  const solicitarEsvaziamento = useCallback(() => {
    if (carrinho.length === 0) return;
    setMostrarConfirmacaoEsvaziar(true);
  }, [carrinho.length]);

  const executarEsvaziamento = useCallback(async () => {
    setMostrarConfirmacaoEsvaziar(false);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    setCarrinho([]);

    try {
      const estadoPremiumAtual = await revalidarEstadoPremium(false);
      await repositorioCarrinho.limpar();
      if (!estadoPremiumAtual.ativo) {
        setMostrarModalPlano(true);
      }
    } catch (erro) {
      console.error('🚨 Erro ao limpar carrinho:', erro);
    }
  }, [revalidarEstadoPremium, repositorioCarrinho]);

  // --- Renderização ---

  if (!carregado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-verde-700/30 border-t-verde-700 rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-slate-900 flex justify-center items-stretch overflow-hidden">
      <div className="w-full max-w-3xl h-[100dvh] bg-white shadow-[0_0_80px_-15px_rgba(0,0,0,0.6)] flex flex-col font-sans relative border-x border-slate-800 overflow-hidden">

        {/* 1. Barra de Navegação Superior */}
        <header className="bg-white shadow-sm z-20 w-full shrink-0">
          <div className="w-full px-4 py-3 [@media(max-height:700px)]:py-2 flex justify-between items-center transition-all">

            {/* Logo e Título */}
            <div className="flex items-center gap-3">
              <div className="bg-verde-50 text-verde-700 p-2 rounded-xl border border-verde-100 shadow-sm flex items-center justify-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 transform -scale-x-100">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="font-bold text-gray-800 leading-tight text-lg [@media(max-height:700px)]:text-base">Sem Susto</h1>
                <p className="text-[9px] text-gray-600 uppercase tracking-widest -mt-0.5 [@media(max-height:700px)]:hidden">Controle de Gastos</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/*
              BOTÃO WHATSAPP - Linhas 429-435
              Classes para ajustar:
              - p-3        → padding (p-1, p-2, p-3, p-4, p-5...)
              - rounded-xl → bordas (rounded, rounded-lg, rounded-xl, rounded-2xl, rounded-full)
              - text-xl    → tamanho do ícone (text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl)
            */}
              <button
                onClick={() => setMostrarContato(true)}
                className="bg-green-50 text-green-600 p-2 [@media(max-height:700px)]:p-1.5 rounded-xl text-sm font-bold border border-green-100 hover:bg-green-100 transition-colors flex items-center justify-center shadow-sm"
                title="Fale conosco via WhatsApp"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </button>

              {/*
              BOTÃO DOAÇÃO - Linhas 437-444
              Classes para ajustar:
              - p-3        → padding (p-1, p-2, p-3, p-4, p-5...)
              - rounded-xl → bordas (rounded, rounded-lg, rounded-xl, rounded-2xl, rounded-full)
              - text-xl    → tamanho do ícone (text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl)
            */}
              {premiumAtivo ? (
                <button
                  onClick={() => {
                    void abrirHistoricoPremium();
                  }}
                  className="bg-amber-50 text-amber-700 p-2 [@media(max-height:700px)]:p-1.5 rounded-xl text-xs font-bold border border-amber-100 hover:bg-amber-100 transition-colors flex items-center justify-center shadow-sm"
                  title={`Histórico premium • ${estadoPremium.diasRestantes} dias restantes`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 20 20" className="w-6 h-6" fill="none" stroke="url(#history-gradient)" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                      <linearGradient id="history-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#9C27B0" />
                        <stop offset="50%" stopColor="#3F51B5" />
                        <stop offset="100%" stopColor="#03A9F4" />
                      </linearGradient>
                    </defs>
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => setMostrarModalPlano(true)}
                  className="bg-red-50 text-red-500 p-2 [@media(max-height:700px)]:p-1.5 rounded-xl text-xs font-bold border border-red-100 hover:bg-red-100 transition-colors flex items-center justify-center shadow-sm"
                  title="Seja Premium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                  </svg>
                </button>
              )}

              {/* Botão Esvaziar Carrinho */}
              {carrinho.length > 0 && (
                <button
                  onClick={solicitarEsvaziamento}
                  className="bg-red-50 text-red-500 p-2 [@media(max-height:700px)]:p-1.5 rounded-xl border border-red-100 hover:bg-red-100 transition-colors flex items-center justify-center shadow-sm"
                  title="Esvaziar carrinho"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* 2. Área Principal (Lista de Compras) */}
        <main
          className="flex-1 w-full p-4 pb-6 [@media(max-height:700px)]:pb-4 transition-all overflow-y-auto overscroll-contain"
          onClick={() => {
            // Gatilho em áreas neutras: tenta mostrar tutorial, limpa pendências
            setAcaoPendenteTutorial(null);
            tentarMostrar();
          }}
        >
          {carrinhoExpandido.length === 0 ? (
            // Trocado de text-gray-400 para text-gray-500 para dar contraste no fundo branco
            <div className="flex flex-col items-center justify-center h-64 text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-800">Seu carrinho está vazio</h2>
              <p className="text-sm text-gray-700">Escaneie um produto para começar!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {carrinhoExpandido.map((item) => (
                <li
                  key={item.codigo_barras}
                  onClick={() => aoEditarItem(item)}
                  className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex gap-3 animate-fade-in relative group cursor-pointer hover:border-verde-300 transition-colors active:scale-[0.99] transform"
                >

                  {/* Imagem */}
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                    <img
                      src={item.imagem || IMAGEM_PADRAO}
                      alt={item.descricao}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 truncate">
                        {item.descricao}
                      </h3>
                      <p className="text-xs text-gray-600 truncate">
                        {item.marca} • {item.tamanho}
                      </p>
                    </div>

                    {/* Controles de Preço e Quantidade */}
                    <div className="flex justify-between items-end mt-1">
                      <div className="flex items-center gap-1 bg-gray-50 rounded p-1 border border-gray-100">
                        {/* Botão Menos / Lixeira */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alterarQuantidade(item.codigo_barras, -1);
                          }}
                          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${item.quantidade === 1
                            ? 'text-red-500 hover:bg-red-50'
                            : 'text-verde-700 hover:bg-verde-50'
                            }`}
                          title={item.quantidade === 1 ? "Remover" : "Diminuir"}
                        >
                          {item.quantidade === 1 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
                          )}
                        </button>

                        <span className="text-sm font-bold w-6 text-center text-gray-700 select-none">
                          {item.quantidade}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alterarQuantidade(item.codigo_barras, 1);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-verde-700 hover:bg-verde-50 rounded transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-gray-500 font-mono">
                          {item.quantidade}x {formatarMoeda(item.preco_estimado || 0)}
                        </div>
                        <div className="font-bold text-gray-900 font-mono text-lg">
                          {formatarMoeda((item.preco_estimado || 0) * item.quantidade)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>

        {/* 3. Rodapé Fixo (Adaptado para Tablet/Desktop Wrapper) */}
        <footer className="w-full bg-white border-t border-gray-200 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0 pb-[env(safe-area-inset-bottom)]">
          <div className="w-full p-4 [@media(max-height:700px)]:p-3 flex flex-col gap-3 [@media(max-height:700px)]:gap-2 transition-all">

            <div className="flex justify-between items-end px-1">
              <span className="text-gray-600 font-medium">Total Geral</span>
              <span className="text-3xl font-bold text-verde-700 font-mono">
                {formatarMoeda(calcularTotal)}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const abrirScanner = async () => {
                    // IMPORTAÇÃO DINÂMICA: Só baixa esse código se o usuário clicar!
                    await solicitarAberturaScanner();
                  };

                  // Se for o primeiro uso, salva a intenção e mostra o tutorial
                  const mostrou = tentarMostrar();
                  if (mostrou) {
                    setAcaoPendenteTutorial(() => abrirScanner);
                    return;
                  }

                  abrirScanner();
                }}
                className="flex-1 bg-verde-700 text-white font-bold py-4 [@media(max-height:700px)]:py-2.5 rounded-xl shadow-lg hover:bg-verde-700 active:transform active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="[@media(max-height:700px)]:text-sm">Ler Código</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 36 24"
                  fill="currentColor"
                  className="w-8 h-8 ml-2">
                  <path d="M2 4h2v16H2zm3.5 0h1v16h-1zM8 4h3v16H8zm4.5 0h1.5v16h-1.5zm3 0h2.5v16h-2.5zm4 0h1v16h-1zm2.5 0h2v16h-2zm3.5 0h3v16h-3zm4.5 0h1v16h-1zm2.5 0h1.5v16h-1.5z" />
                </svg>
              </button>

              {carrinho.length > 0 && (
                <button
                  onClick={solicitarFinalizacao}
                  className="flex-1 bg-blue-600 text-white font-bold py-4 [@media(max-height:700px)]:py-2.5 rounded-xl shadow-lg hover:bg-blue-700 active:transform active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 [@media(max-height:700px)]:w-5 [@media(max-height:700px)]:h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span className="[@media(max-height:700px)]:text-sm">Finalizar</span>
                </button>
              )}
            </div>
          </div>
        </footer>

        {/* Mobile Debugger (Apenas Dev) */}
        {import.meta.env.DEV && <DebugConsole />}

        {/* --- Modais e Telas Sobrepostas --- */}
        <Suspense fallback={<ModalLoadingCarrinho visivel={true} titulo="Carregando..." />}>
          {/* Modal de Planos Premium */}
          {mostrarModalPlano && (
            <ModalPlano
              aoFechar={() => setMostrarModalPlano(false)}
              aoSelecionarPlano={async (plano_id: PlanoID) => {
                setPlanoSelecionado(plano_id);
                const dados = await apiGerarPix(plano_id);
                setDadosPagamento(dados);
                setMostrarModalPlano(false);
                setMostrarModalPagamento(true);
              }}
            />
          )}

          {/* Modal de Pagamento PIX */}
          {mostrarModalPagamento && dadosPagamento && (
            <ModalPagamento
              pagamento_id={dadosPagamento.pagamento_id}
              qr_code={dadosPagamento.qr_code_base64}
              copia_e_cola={dadosPagamento.qr_code_copia_e_cola}
              modo_confirmacao={dadosPagamento.modo_confirmacao}
              plano_id={planoSelecionado}
              aoFechar={() => {
                setMostrarModalPagamento(false);
                setDadosPagamento(null);
              }}
              aoSucesso={async (pagamentoIdAprovado: string) => {
                if (confirmacoesPagamentoEmAndamento.current.has(pagamentoIdAprovado)) {
                  console.warn('↩️ [Confirmar] Ignorando confirmação duplicada para o mesmo pagamento');
                  return;
                }

                const planoParaConfirmar = planoSelecionado;
                if (!planoParaConfirmar) {
                  console.error('🚨 [Confirmar] Plano não definido para confirmar pagamento');
                  setTelaAtual('DASHBOARD');
                  return;
                }

                confirmacoesPagamentoEmAndamento.current.add(pagamentoIdAprovado);
                setMostrarModalPagamento(false);
                setDadosPagamento(null);

                try {
                  const resposta = await fetch('/api/pagamentos/confirmar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      pagamento_id: pagamentoIdAprovado,
                      plano_id: planoParaConfirmar,
                    }),
                  });

                  if (!resposta.ok) {
                    const erro = await resposta.json().catch(() => ({}));
                    console.error('🚨 [Confirmar] Falha:', erro);
                    setTelaAtual('DASHBOARD');
                    return;
                  }

                  const dados = await resposta.json();

                  if (dados.token_ja_existente) {
                    // Token já gerado anteriormente — abre tela de ativação
                    console.warn('♻️ Token já existente para este pagamento');
                    setMostrarAtivarToken(true);
                    return;
                  }

                  // Token novo gerado com sucesso — abre modal de aprovação
                  setTokenGerado(dados.token);
                  setDiasAtivadosGerado(dados.duracao_dias);
                  setNomePlanoGerado(planoParaConfirmar);
                  setMostrarModalAprovado(true);
                } catch (erroRede) {
                  console.error('🚨 [Confirmar] Erro de rede:', erroRede);
                  setTelaAtual('DASHBOARD');
                } finally {
                  confirmacoesPagamentoEmAndamento.current.delete(pagamentoIdAprovado);
                }
              }}
              aoTentarNovamente={async () => {
                if (!planoSelecionado) return;
                const dados = await apiGerarPix(planoSelecionado);
                setDadosPagamento(dados);
              }}
            />
          )}

          {/* Modal de Pagamento Aprovado (Token Gerado) */}
          {mostrarModalAprovado && tokenGerado && (
            <ModalPagamentoAprovado
              token={tokenGerado}
              diasAtivados={diasAtivadosGerado}
              plano={nomePlanoGerado}
              aoAtivarCallback={() => {
                const tokenParaAtivacao = tokenGerado;
                setMostrarModalAprovado(false);
                setTokenGerado(null);
                if (tokenParaAtivacao) {
                  setDeepLinkToken(tokenParaAtivacao);
                }
                setMostrarAtivarToken(true);
              }}
              aoFechar={() => {
                setMostrarModalAprovado(false);
                setTokenGerado(null);
                setTelaAtual('DASHBOARD');
              }}
            />
          )}



          {/* Modal de Contato WhatsApp */}
          {mostrarContato && (
            <ModalContato aoFechar={() => setMostrarContato(false)} />
          )}
          {mostrarHistoricoCompras && (
            <ModalHistoricoCompras
              compras={historicoCompras}
              carregando={carregandoHistoricoCompras}
              aoFechar={() => setMostrarHistoricoCompras(false)}
            />
          )}
          {/* Tela de Loading Reutilizável */}
          <ModalLoadingCarrinho
            visivel={etapaBusca !== null}
            titulo={etapaBusca || "Carregando..."}
          />

          {/* Scanner Modal */}
          {telaAtual === 'SCANNER' && (
            <ScannerCodigo
              aoLerCodigo={aoLerCodigo}
              aoCancelar={() => setTelaAtual('DASHBOARD')}
            />
          )}

          {/* Formulário de Produto Modal */}
          {telaAtual === 'CADASTRO' && codigoLido && (
            <ModalFormularioProduto
              gtinInicial={codigoLido}
              aoSalvar={aoSalvarProduto}
              aoCancelar={() => {
                setTelaAtual('DASHBOARD');
                setCodigoLido(null);
                setDadosPrePreenchidos(null);
                setModoEdicao(false);
              }}
              produtoExistente={catalogo[codigoLido] || null}
              dadosPrePreenchidos={dadosPrePreenchidos}
            />
          )}

          {/* Modal de Confirmação - Esvaziar Carrinho */}
          {mostrarConfirmacaoEsvaziar && (
            <ModalConfirmacao
              titulo="Esvaziar Carrinho"
              mensagem="Tem certeza que deseja remover todos os itens do carrinho?"
              textoBotaoConfirmar="Esvaziar"
              textoBotaoCancelar="Cancelar"
              corBotaoConfirmar="vermelho"
              icone="lixeira"
              aoConfirmar={executarEsvaziamento}
              aoCancelar={() => setMostrarConfirmacaoEsvaziar(false)}
            />
          )}

          {/* Tela de Ativação Premium */}
          {mostrarAtivarToken && (
            <ModalAtivarToken
              tokenObrigatorioUrl={deepLinkToken}
              aoPremiumAtivado={() => revalidarEstadoPremium(true)}
              aoVoltar={() => {
                setMostrarAtivarToken(false);
                setDeepLinkToken(null);
              }}
              aoIrParaDashboard={() => {
                setMostrarAtivarToken(false);
                setDeepLinkToken(null);
                setTelaAtual('DASHBOARD');
              }}
            />
          )}

          {/* Modal de Confirmação - Finalizar Registro */}
          {mostrarConfirmacaoFinalizar && (
            <ModalConfirmacao
              titulo="Finalizar Registro"
              mensagem={
                <p>
                  Deseja finalizar? O total é de{' '}
                  <strong className="font-black text-verde-700 text-lg">
                    {formatarMoeda(calcularTotal)}
                  </strong>
                  .
                </p>
              }
              textoBotaoConfirmar="Finalizar"
              textoBotaoCancelar="Voltar"
              corBotaoConfirmar="verde"
              icone="check"
              aoConfirmar={executarFinalizacao}
              aoCancelar={() => setMostrarConfirmacaoFinalizar(false)}
            />
          )}

          {mostrarBloqueioCarrinhoPremium && (
            <ModalBloqueio
              titulo="Limite do plano gratuito"
              mensagem={`O plano gratuito permite até ${LIMITE_ITENS_DISTINTOS_CARRINHO_GRATUITO} itens distintos no carrinho. Para continuar adicionando novos produtos, ative o premium.`}
              textoBotaoPrincipal="Ver premium"
              textoBotaoSecundario="Agora não"
              aoConfirmar={() => {
                setMostrarBloqueioCarrinhoPremium(false);
                setMostrarModalPlano(true);
              }}
              aoCancelar={() => setMostrarBloqueioCarrinhoPremium(false)}
            />
          )}

          {/* Tutorial de Primeiro Acesso */}
          {mostrarTutorial && (
            <ModalTutorialUso
              aoFechar={() => {
                marcarTutorialComoVisto();
                // Se houver uma ação pendente (ex: abrir scanner), executa agora
                if (acaoPendenteTutorial) {
                  acaoPendenteTutorial();
                  setAcaoPendenteTutorial(null);
                }
              }}
            />
          )}
        </Suspense>

        {/* Banner de Instalação PWA (aparece 1x/mês para mobile) */}
        <BannerInstalarApp />

      </div>
    </div>
  );
}
