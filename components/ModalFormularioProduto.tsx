import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Produto } from '../types';
import { REGEX_UNIDADE, NOMES_INVALIDOS } from '../constants';
import { comprimirImagem } from '../services/utilitarios';
import { extrairDadosDoRotulo } from '../services/ia';
import { ModalRecorte } from './ModalRecorte';
import { ModalTutorialFoto } from './ModalTutorialFoto';
import { useTutorialFotoPrimeiroUso } from '../hooks/useTutorialFoto';

interface PropsFormulario {
  gtinInicial: string;
  aoSalvar: (produto: Produto) => void;
  aoCancelar: () => void;
  produtoExistente?: Produto | null;
  dadosPrePreenchidos?: Partial<Produto> | null;
}

const ModalFormularioProduto: React.FC<PropsFormulario> = ({
  gtinInicial,
  aoSalvar,
  aoCancelar,
  produtoExistente,
  dadosPrePreenchidos,
}) => {
  const [descricao, setDescricao] = useState('');
  const [marca, setMarca] = useState('');
  const [tamanho, setTamanho] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [imagem, setImagem] = useState<string | undefined>(undefined);

  const [erro, setErro] = useState<string | null>(null);
  const [campoComErro, setCampoComErro] = useState<string | null>(null);

  // Controle de Foco Único
  const [focoInicialFeito, setFocoInicialFeito] = useState(false);

  const refDescricao = useRef<HTMLInputElement>(null);
  const refMarca = useRef<HTMLInputElement>(null);
  const refTamanho = useRef<HTMLInputElement>(null);
  const refPrice = useRef<HTMLInputElement>(null);

  const [imagemParaRecorte, setImagemParaRecorte] = useState<string | null>(null);
  const [mostraRecorte, setMostraRecorte] = useState(false);
  const [analisandoIA, setAnalisandoIA] = useState(false);

  // Flag para controlar inicialização única
  const [inicializado, setInicializado] = useState(false);

  // Fluxo OCR-First: campos bloqueados até o usuário tirar foto
  // 'foto' = aguardando foto (campos texto desabilitados)
  // 'dados' = foto tirada, campos liberados para edição
  // Fluxo OCR-First: campos bloqueados até o usuário tirar foto
  // 'foto' = aguardando foto (campos texto desabilitados)
  // 'dados' = foto tirada, campos liberados para edição
  const faseFormulario = useMemo((): 'foto' | 'dados' => {
    // Se temos imagem (existente, pré-preenchida ou tirada agora), libera os campos
    if (imagem) return 'dados';
    return 'foto';
  }, [imagem]);

  // Campos de texto ficam bloqueados na fase 'foto' ou durante análise IA
  const camposTextoBloqueados = faseFormulario === 'foto' || analisandoIA;

  // Estado para exibir TutorialFoto contextual
  const [mostraTutorialFoto, setMostraTutorialFoto] = useState(false);
  const [inputPendente, setInputPendente] = useState<HTMLInputElement | null>(null);
  const tutorialFoto = useTutorialFotoPrimeiroUso();

  // Detecta campos que vieram vazios da API (para destaque visual)
  const camposFaltantes = useMemo(() => {
    // Só destaca como "faltante" se veio de uma API (dadosPrePreenchidos) mas sem o dado
    if (!dadosPrePreenchidos) return [];

    const faltantes: string[] = [];
    if (!dadosPrePreenchidos.imagem) faltantes.push('imagem');
    if (!dadosPrePreenchidos.marca) faltantes.push('marca');
    if (!dadosPrePreenchidos.tamanho) faltantes.push('tamanho');
    return faltantes;
  }, [dadosPrePreenchidos]);

  const temCamposFaltantes = camposFaltantes.length > 0;

  // Preenche dados iniciais
  useEffect(() => {
    if (produtoExistente) {
      // Edição de produto existente (prioridade máxima)
      if (!inicializado) {
        setDescricao(produtoExistente.descricao);
        setMarca(produtoExistente.marca);
        setTamanho(produtoExistente.tamanho);
        setPriceInput((produtoExistente.preco_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
        setImagem(produtoExistente.imagem);
        setInicializado(true);
      }
    } else if (dadosPrePreenchidos) {
      // Preenchimento automático (API/IA)
      // Só preenche se o campo estiver vazio para não sobrescrever o que o usuário já digitou
      // OU se for a primeira inicialização

      if (!descricao && dadosPrePreenchidos.descricao) setDescricao(dadosPrePreenchidos.descricao);
      if (!marca && dadosPrePreenchidos.marca) setMarca(dadosPrePreenchidos.marca);
      if (!tamanho && dadosPrePreenchidos.tamanho) setTamanho(dadosPrePreenchidos.tamanho);

      if (!priceInput && dadosPrePreenchidos.preco_estimado && dadosPrePreenchidos.preco_estimado > 0) {
        setPriceInput(
          dadosPrePreenchidos.preco_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        );
      }

      if (!imagem && dadosPrePreenchidos.imagem) setImagem(dadosPrePreenchidos.imagem);
    }
  }, [produtoExistente, dadosPrePreenchidos, inicializado]);

  // Lógica de Foco Inteligente (Executa apenas uma vez quando os dados estabilizam)
  useEffect(() => {
    if (focoInicialFeito || analisandoIA) return;

    // Se temos pelo menos algum dado ou é um formulário vazio pronto
    const timer = setTimeout(() => {
      let focou = false;

      // Prioridade: Campos vazios (apenas se não estiverem bloqueados)
      if (!descricao && !camposTextoBloqueados) {
        refDescricao.current?.focus();
        focou = true;
      } else if (!marca && !camposTextoBloqueados) {
        refMarca.current?.focus();
        focou = true;
      } else if (!tamanho && !camposTextoBloqueados) {
        refTamanho.current?.focus();
        focou = true;
      } else {
        // Se tudo preenchido ou campos de texto bloqueados, foca no preço (sempre liberado)
        refPrice.current?.focus();
        setTimeout(() => refPrice.current?.select(), 50);
        focou = true;
      }

      if (focou) setFocoInicialFeito(true);
    }, 600); // Delay maior para garantir animação e preenchimento

    return () => clearTimeout(timer);
  }, [descricao, marca, tamanho, analisandoIA, focoInicialFeito]);
  // Removemos priceInput das dependências para não refocar ao digitar!

  /**
   * Intercepta o click no input de foto para mostrar dica contextual na primeira vez.
   */
  const interceptarClickFoto = (e: React.MouseEvent<HTMLInputElement>) => {
    if (tutorialFoto.deveExibir()) {
      e.preventDefault();
      setInputPendente(e.currentTarget);
      setMostraTutorialFoto(true);
    }
  };

  const lidarComSelecaoImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setErro(null);
      try {
        const imagemBase64 = await comprimirImagem(e.target.files[0], 0.6, 500);
        setImagemParaRecorte(imagemBase64);
        setMostraRecorte(true);
        e.target.value = '';
      } catch (err) {
        setErro('Erro ao carregar imagem.');
      }
    }
  };

  const aoConfirmarRecorte = async (fotoRecortadaBase64: string) => {
    setMostraRecorte(false);
    setImagem(fotoRecortadaBase64);
    setImagemParaRecorte(null);

    const precisaOcr = !descricao || !marca;

    if (!precisaOcr) {
      // Foto adicionada, dados completos — vibra confirmação
      // Fase muda automaticamente via useMemo ao atualizar 'imagem'
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
      return;
    }

    // Tenta preencher via OCR antes de liberar campos para o usuário
    setAnalisandoIA(true);
    setFocoInicialFeito(false); // Permite refocar após IA preencher
    try {
      const dadosExtraidos = await extrairDadosDoRotulo(fotoRecortadaBase64);
      if (dadosExtraidos) {
        console.log('✅ [ORIGEM: IA_OCR] Produto lido via IA!');
        console.log('📦 Dados:', dadosExtraidos);

        if (dadosExtraidos.descricao) setDescricao(dadosExtraidos.descricao);
        if (dadosExtraidos.marca) setMarca(dadosExtraidos.marca);
        if (dadosExtraidos.tamanho) setTamanho(dadosExtraidos.tamanho);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 50, 50]);
      }
    } catch (err: any) {
      console.error('🚨 Erro no processamento IA:', err);
      setErro(`Não foi possível ler o rótulo automaticamente, mas a foto foi salva.`);
    } finally {
      setAnalisandoIA(false);
      // Fase muda automaticamente via useMemo ao atualizar 'imagem'
    }
  };

  const aoCancelarRecorte = () => {
    setMostraRecorte(false);
    setImagemParaRecorte(null);
  };

  const removerFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setImagem(undefined);
  };

  const lidarMudancaPreco = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value;
    const apenasDigitos = valorDigitado.replace(/\D/g, '');

    if (!apenasDigitos) {
      setPriceInput('');
      return;
    }

    const valorNumerico = parseInt(apenasDigitos, 10) / 100;
    const valorFormatado = valorNumerico.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    setPriceInput(valorFormatado);
  };

  const validarESalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCampoComErro(null);

    if (!imagem) {
      setErro('A foto do produto é obrigatória.');
      return;
    }

    if (!descricao.trim()) {
      setErro('O nome do produto é obrigatório.');
      setCampoComErro('descricao');
      refDescricao.current?.focus();
      return;
    }

    if (NOMES_INVALIDOS.has(descricao.toLowerCase().trim())) {
      setErro('Nome inválido. Por favor, informe o nome real do produto.');
      setCampoComErro('descricao');
      refDescricao.current?.focus();
      refDescricao.current?.select();
      return;
    }

    if (!marca.trim()) {
      setErro('A marca do produto é obrigatória.');
      setCampoComErro('marca');
      refMarca.current?.focus();
      return;
    }

    if (!tamanho.trim()) {
      setErro('O tamanho do produto é obrigatório.');
      setCampoComErro('tamanho');
      refTamanho.current?.focus();
      return;
    }

    if (!REGEX_UNIDADE.test(tamanho)) {
      setErro('Tamanho inválido. Ex: 1L, 500g, 3un, 1,5kg');
      setCampoComErro('tamanho');
      refTamanho.current?.focus();
      return;
    }

    const precoLimpo = priceInput.replace(/\./g, '').replace(',', '.');
    const precoNumerico = parseFloat(precoLimpo);

    if (isNaN(precoNumerico) || precoNumerico <= 0) {
      setErro('O preço é obrigatório.');
      setCampoComErro('price');
      refPrice.current?.focus();
      return;
    }

    const novoProduto: Produto = {
      codigo_barras: gtinInicial,
      descricao,
      marca,
      tamanho,
      preco_estimado: precoNumerico,
      imagem,
    };

    aoSalvar(novoProduto);
  };

  const classeInput =
    'w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-bold placeholder-gray-400 focus:ring-2 focus:ring-verde-700 outline-none transition-colors';
  const classeLabel = 'block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1';
  const origemCosmos = !!dadosPrePreenchidos && !produtoExistente;

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col h-full overflow-hidden animate-fade-in">
      <div className="bg-verde-700 text-white p-4 shadow-md flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={aoCancelar}
          className="p-2 -ml-2 hover:bg-verde-700 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h2 className="font-bold text-lg leading-none">
          {produtoExistente ? 'Editar Produto' : 'Novo Produto'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 flex flex-col [&::-webkit-scrollbar]:hidden">
        {mostraRecorte && imagemParaRecorte && (
          <ModalRecorte
            imagem={imagemParaRecorte}
            aoConfirmar={aoConfirmarRecorte}
            aoCancelar={aoCancelarRecorte}
          />
        )}
        {/* Dica contextual de foto - primeira vez que usa câmera */}
        {mostraTutorialFoto && (
          <ModalTutorialFoto
            aoFechar={() => {
              setMostraTutorialFoto(false);
              // Dispara o click pendente após fechar o tutorial
              if (inputPendente) {
                inputPendente.click();
                setInputPendente(null);
              }
            }}
          />
        )}
        <style>{`
          @keyframes border-spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>

        <form id="form-produto" onSubmit={validarESalvar} className="flex flex-col gap-3 h-full">
          {/* Banner de Campos Faltantes */}
          {temCamposFaltantes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-amber-500 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.501-11.418m-1.501 11.418a6.01 6.01 0 0 1-1.501-11.418m1.501 11.418v.75m0-1.5V9" />
              </svg>
              <div>
                <p className="text-amber-800 text-sm font-medium">Complete os dados para melhorar o catálogo</p>
                <p className="text-amber-700 text-xs mt-0.5">
                  Campos faltantes: {camposFaltantes.map(c => c === 'imagem' ? 'foto' : c).join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* FOTO */}
          <div
            className={`transition-all duration-300 ${!imagem ? 'ring-2 ring-red-100 rounded-xl p-1 bg-red-50' : ''
              }`}
          >
            {!imagem ? (
              <div className="flex gap-3 items-stretch h-36">
                <div className="w-32 shrink-0 relative rounded-xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 group cursor-pointer">
                  {analisandoIA ? (
                    <div className="flex flex-col items-center animate-pulse">
                      <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-1"></div>
                      <span className="text-[10px] font-bold uppercase">Lendo...</span>
                    </div>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 opacity-50">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600">
                        Galeria
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onClick={interceptarClickFoto}
                    onChange={lidarComSelecaoImagem}
                    disabled={analisandoIA}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-blue-100 p-1 rounded-full text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                        </svg>
                      </div>
                      <span className="font-bold text-blue-800 text-xs uppercase">
                        Foto Obrigatória
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-800 leading-tight">
                      {origemCosmos
                        ? 'Confirmar visual do produto.'
                        : 'Tire foto para preenchimento IA.'}
                    </p>
                  </div>

                  {/* Botão com Borda Rainbow Animada Padronizado com Ativar Premium */}
                  <label
                    className={`w-full relative group cursor-pointer rounded-lg overflow-hidden p-[3px] transition-all active:scale-95 ${analisandoIA ? 'cursor-wait opacity-80' : 'shadow-lg'
                      }`}
                  >
                    {/* Gradient Layer - Réplica exata de Ativar Premium */}
                    {!analisandoIA && (
                      <div
                        className="absolute inset-[-500%] bg-[conic-gradient(from_0deg,#ff0000,#ff8800,#ffff00,#00ff00,#0000ff,#8800ff,#ff0000)]"
                        style={{ animation: 'border-spin 3s linear infinite' }}
                      ></div>
                    )}

                    {/* Content Layer - Sincronizado com rounded-[5px] e py-4 */}
                    <div className="relative w-full h-full rounded-[5px] flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white z-10 transition-colors">
                      {analisandoIA ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-camera text-lg"></i>
                      )}
                      <span className="font-bold text-sm uppercase tracking-wide">
                        {analisandoIA ? 'Processando...' : 'AUTO PREENCHER'}
                      </span>
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onClick={interceptarClickFoto}
                      onChange={lidarComSelecaoImagem}
                      disabled={analisandoIA}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center shrink-0 animate-fade-in">
                <div className="relative group">
                  <div
                    className={`w-32 h-32 rounded-xl overflow-hidden border-2 border-dashed flex items-center justify-center relative transition-colors ${imagem ? 'border-verde-700 bg-white shadow-sm' : 'border-gray-300'
                      }`}
                  >
                    <img
                      src={imagem}
                      alt="Preview"
                      className="w-full h-full object-contain p-1"
                      onError={() => {
                        console.warn('❌ [Form] Imagem falhou ao carregar (404/Erro). Removendo...');
                        setImagem(undefined); // Força UI de 'Tirar Foto'
                      }}
                    />
                    <button
                      type="button"
                      onClick={removerFoto}
                      className="absolute top-1 right-1 bg-red-500 text-white w-7 h-7 rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 z-20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={lidarComSelecaoImagem}
                      disabled={analisandoIA}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-100 py-2 px-3 rounded-lg text-center border border-gray-200 flex items-center justify-center gap-2 shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 36 24"
              fill="currentColor"
              className="w-8 h-8 text-gray-400">
              <path d="M2 4h2v16H2zm3.5 0h1v16h-1zM8 4h3v16H8zm4.5 0h1.5v16h-1.5zm3 0h2.5v16h-2.5zm4 0h1v16h-1zm2.5 0h2v16h-2zm3.5 0h3v16h-3zm4.5 0h1v16h-1zm2.5 0h1.5v16h-1.5z" />
            </svg>
            <span className="font-mono font-bold text-gray-700 text-sm tracking-wider">
              {gtinInicial}
            </span>
          </div>

          {/* Banner OCR-First: solicita foto antes de digitação manual */}
          {faseFormulario === 'foto' && !analisandoIA && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 animate-fade-in">
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                </svg>
                <div className="flex-1">
                  <p className="text-blue-800 text-sm font-medium">
                    Tire uma foto do rótulo para preencher automaticamente
                  </p>
                  <p className="text-blue-700 text-xs mt-0.5">
                    Os campos serão preenchidos com IA após a foto.
                  </p>
                </div>
              </div>
              {/* Botão premium-only — bloqueado até sistema premium estar ativo */}
              <button
                type="button"
                onClick={() => {
                  // TODO: Quando premium estiver implementado, verificar token ativo aqui
                  // Por enquanto, sempre mostra mensagem de funcionalidade premium
                  setErro('🔒 Preenchimento manual sem foto disponível somente no plano Premium.');
                }}
                className="mt-2 w-full text-xs text-gray-700 flex items-center justify-center gap-1 py-1.5 rounded border border-gray-300 bg-gray-50 cursor-not-allowed transition-colors hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                Preencher manualmente
              </button>
            </div>
          )}

          <div className={`flex flex-col gap-3 flex-1 transition-opacity duration-300 ${camposTextoBloqueados ? 'opacity-50' : 'opacity-100'}`}>
            <div>
              <label className={classeLabel}>Produto</label>
              <input
                ref={refDescricao}
                value={descricao}
                onChange={e => {
                  setDescricao(e.target.value);
                  if (campoComErro === 'descricao') setCampoComErro(null);
                }}
                className={`${classeInput} ${analisandoIA ? 'animate-pulse bg-gray-600' : ''} ${campoComErro === 'descricao' ? 'border-red-500 ring-2 ring-red-400' : ''
                  }`}
                placeholder="Ex: Coca-Cola 350ml"
                onFocus={(e) => e.target.select()}
                disabled={camposTextoBloqueados}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-[3]">
                <label className={classeLabel}>
                  Marca
                  {camposFaltantes.includes('marca') && (
                    <span className="text-amber-500 ml-1" title="Campo faltante">⚠️</span>
                  )}
                </label>
                <input
                  ref={refMarca}
                  value={marca}
                  onChange={e => {
                    setMarca(e.target.value);
                    if (campoComErro === 'marca') setCampoComErro(null);
                  }}
                  className={`${classeInput} ${analisandoIA ? 'animate-pulse bg-gray-600' : ''} ${campoComErro === 'marca' ? 'border-red-500 ring-2 ring-red-400' : ''
                    } ${camposFaltantes.includes('marca') && !marca ? 'border-amber-400 ring-1 ring-amber-300' : ''}`}
                  placeholder="Ex: Longa Vida"
                  disabled={camposTextoBloqueados}
                />
              </div>
              <div className="flex-[2]">
                <label className={classeLabel}>
                  Tamanho
                  {camposFaltantes.includes('tamanho') && (
                    <span className="text-amber-500 ml-1" title="Campo faltante">⚠️</span>
                  )}
                </label>
                <input
                  ref={refTamanho}
                  value={tamanho}
                  onChange={e => {
                    setTamanho(e.target.value);
                    if (campoComErro === 'tamanho') setCampoComErro(null);
                  }}
                  className={`${classeInput} ${tamanho && !REGEX_UNIDADE.test(tamanho) ? 'border-red-400 text-red-100' : ''
                    } ${analisandoIA ? 'animate-pulse bg-gray-600' : ''} ${campoComErro === 'tamanho' ? 'border-red-500 ring-2 ring-red-400' : ''
                    } ${camposFaltantes.includes('tamanho') && !tamanho ? 'border-amber-400 ring-1 ring-amber-300' : ''}`}
                  placeholder="Ex: 1L, 500g, 3un"
                  onFocus={(e) => e.target.select()}
                  disabled={camposTextoBloqueados}
                />
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
              <label className="block text-xs font-bold text-verde-700 uppercase tracking-wide mb-1">
                Preço Unitário (R$) <span className="text-red-500">*</span>
              </label>
              <input
                ref={refPrice}
                type="tel"
                inputMode="decimal"
                value={priceInput}
                onFocus={e => e.target.select()}
                onChange={e => {
                  lidarMudancaPreco(e);
                  if (campoComErro === 'price') setCampoComErro(null);
                }}
                className={`w-full p-2 bg-white border-2 rounded-lg text-gray-900 font-bold text-2xl placeholder-gray-300 focus:outline-none shadow-sm ${campoComErro === 'price'
                  ? 'border-red-500 ring-2 ring-red-400'
                  : 'border-verde-700'
                  }`}
                placeholder="0,00"
              />
              <p className="text-[10px] text-gray-600 mt-1 text-right">
                Toque para selecionar tudo
              </p>
            </div>
          </div>

          {erro && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 font-bold flex items-center animate-fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
              </svg> {erro}
            </div>
          )}

          <div className="pt-4 pb-8 mt-auto">
            <button
              type="submit"
              onClick={validarESalvar}
              disabled={analisandoIA}
              className={`w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${analisandoIA
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-verde-700 hover:bg-verde-700 active:scale-95'
                }`}
            >
              {analisandoIA ? 'Processando...' : 'Salvar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalFormularioProduto;
