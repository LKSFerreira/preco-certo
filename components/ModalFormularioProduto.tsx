import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Produto } from '../types';
import { REGEX_UNIDADE, NOMES_INVALIDOS } from '../constants';
import { extrairDadosDoRotulo } from '../services/ia';
import { normalizarTamanho } from '../services/utilitarios';
import { ModalRecorte } from './ModalRecorte';
import { ModalTutorialFoto } from './ModalTutorialFoto';
import { useTutorialFotoPrimeiroUso } from '../hooks/useTutorialFoto';


// --- COMPONENTE PRINCIPAL ---
interface PropsFormulario {
  gtinInicial: string;
  aoSalvar: (produto: Produto) => Promise<void>;
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
  const [precoInput, setPrecoInput] = useState('');
  const [imagem, setImagem] = useState<string | undefined>(undefined);
  const [erro, setErro] = useState<string | null>(null);
  const [campoComErro, setCampoComErro] = useState<string | null>(null);
  const [focoInicialFeito, setFocoInicialFeito] = useState(false);
  const [imagemParaRecorte, setImagemParaRecorte] = useState<string | null>(null);
  const [mostraRecorte, setMostraRecorte] = useState(false);
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [inicializado, setInicializado] = useState(false);
  const [tecladoAtivo, setTecladoAtivo] = useState(false);
  const [tamanhoTela, setTamanhoTela] = useState('normal');
  const [larguraTela, setLarguraTela] = useState('normal');

  const refDescricao = useRef<HTMLInputElement>(null);
  const refMarca = useRef<HTMLInputElement>(null);
  const refTamanho = useRef<HTMLInputElement>(null);
  const refPrice = useRef<HTMLInputElement>(null);
  const refAutoPreencher = useRef<HTMLLabelElement>(null);
  const refSalvar = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const refConteudoRolavel = useRef<HTMLDivElement | null>(null);
  const timerDesfoqueRef = useRef<number | null>(null);
  const referenciaUrlBlobRecorte = useRef<string | null>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const height = entry.contentRect.height;
        const width = entry.contentRect.width;

        if (height >= 680 && height <= 715) {
          setTamanhoTela('custom-fix');
        } else if (height < 680) {
          setTamanhoTela('muito-compacto');
        } else if (height < 780) {
          setTamanhoTela('compacto');
        } else {
          setTamanhoTela('normal');
        }

        if (width <= 412) {
          setLarguraTela('estreita');
        } else {
          setLarguraTela('normal');
        }
      }
    });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const isMuitoCompacto = tamanhoTela === 'muito-compacto';
  const isCustomFix = tamanhoTela === 'custom-fix';
  const isCompacto = tamanhoTela === 'compacto' || isMuitoCompacto || isCustomFix;
  const isEstreito = larguraTela === 'estreita';
  const faseFormulario = useMemo(() => (imagem ? 'dados' : 'foto'), [imagem]);
  const camposTextoBloqueados = faseFormulario === 'foto' || analisandoIA;
  const tamanhoLimpo = tamanho.trim();
  const tamanhoNormalizado = useMemo(() => normalizarTamanho(tamanhoLimpo), [tamanhoLimpo]);
  const tamanhoValido = useMemo(() => {
    return tamanhoNormalizado.length > 0 && REGEX_UNIDADE.test(tamanhoNormalizado);
  }, [tamanhoNormalizado]);
  const tamanhoInvalidoVisivel = tamanhoLimpo.length > 0 && !tamanhoValido;

  const [mostraTutorialFoto, setMostraTutorialFoto] = useState(false);
  const [inputPendente, setInputPendente] = useState<HTMLInputElement | null>(null);
  const tutorialFoto = useTutorialFotoPrimeiroUso();

  const camposFaltantes = useMemo(() => {
    if (!dadosPrePreenchidos) return [];
    const faltantes: string[] = [];
    if (!dadosPrePreenchidos.imagem) faltantes.push('imagem');
    if (!dadosPrePreenchidos.marca) faltantes.push('marca');
    if (!dadosPrePreenchidos.tamanho) faltantes.push('tamanho');
    return faltantes;
  }, [dadosPrePreenchidos]);

  const temCamposFaltantes = camposFaltantes.length > 0;
  const veioDeFonteConfiavel = !!produtoExistente || !!dadosPrePreenchidos;

  const liberarUrlBlobRecorte = () => {
    const urlBlob = referenciaUrlBlobRecorte.current;
    if (urlBlob && urlBlob.startsWith('blob:')) {
      URL.revokeObjectURL(urlBlob);
    }
    referenciaUrlBlobRecorte.current = null;
  };

  const validarImagemInicial = (origemImagem?: string | null): Promise<string | undefined> => {
    return new Promise((resolve) => {
      const imagemCandidata = origemImagem?.trim();
      if (!imagemCandidata) {
        resolve(undefined);
        return;
      }

      if (typeof window === 'undefined') {
        resolve(imagemCandidata);
        return;
      }

      if (imagemCandidata.startsWith('blob:')) {
        resolve(imagemCandidata);
        return;
      }

      const imagemTeste = new Image();
      let finalizado = false;

      const concluir = (valida: boolean) => {
        if (finalizado) return;
        finalizado = true;
        window.clearTimeout(timeoutId);
        resolve(valida ? imagemCandidata : undefined);
      };

      const timeoutId = window.setTimeout(() => concluir(false), 2500);
      imagemTeste.onload = () => concluir(true);
      imagemTeste.onerror = () => concluir(false);
      imagemTeste.src = imagemCandidata;
    });
  };

  useEffect(() => {
    if (inicializado) return;

    let ativo = true;

    const hidratarEstadoInicial = async () => {
      const origem = produtoExistente ?? dadosPrePreenchidos ?? null;

      if (!origem) {
        if (ativo) setInicializado(true);
        return;
      }

      const imagemValidada = await validarImagemInicial(origem.imagem);
      if (!ativo) return;

      setDescricao(origem.descricao ?? '');
      setMarca(origem.marca ?? '');
      setTamanho(normalizarTamanho(origem.tamanho ?? ''));

      if ((origem.preco_estimado ?? 0) > 0) {
        setPrecoInput((origem.preco_estimado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
      }

      setImagem(imagemValidada);
      setInicializado(true);
    };

    hidratarEstadoInicial();

    return () => {
      ativo = false;
    };
  }, [produtoExistente, dadosPrePreenchidos, inicializado]);

  useEffect(() => {
    return () => {
      if (timerDesfoqueRef.current) {
        window.clearTimeout(timerDesfoqueRef.current);
      }
      liberarUrlBlobRecorte();
    };
  }, []);

  const focarCampoVisivel = (elemento: HTMLElement | null) => {
    if (timerDesfoqueRef.current) {
      window.clearTimeout(timerDesfoqueRef.current);
      timerDesfoqueRef.current = null;
    }

    setTecladoAtivo(true);
    window.setTimeout(() => {
      elemento?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      refSalvar.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 120);
  };

  const lidarBlurCampo = () => {
    if (timerDesfoqueRef.current) {
      window.clearTimeout(timerDesfoqueRef.current);
    }

    timerDesfoqueRef.current = window.setTimeout(() => {
      const ativo = document.activeElement as HTMLElement | null;
      const aindaEmCampo = !!ativo && (ativo.tagName === 'INPUT' || ativo.tagName === 'TEXTAREA');
      if (!aindaEmCampo) {
        setTecladoAtivo(false);
      }
    }, 140);
  };

  useEffect(() => {
    if (!inicializado || focoInicialFeito || analisandoIA || mostraRecorte || mostraTutorialFoto) return;

    const timer = window.setTimeout(() => {
      let proximoFoco: HTMLElement | null = null;

      if (!imagem) {
        proximoFoco = refAutoPreencher.current;
      } else if (!descricao.trim() && !camposTextoBloqueados) {
        proximoFoco = refDescricao.current;
      } else if (!marca.trim() && !camposTextoBloqueados) {
        proximoFoco = refMarca.current;
      } else if (!tamanhoValido && !camposTextoBloqueados) {
        proximoFoco = refTamanho.current;
      } else {
        proximoFoco = refPrice.current;
      }

      proximoFoco?.focus();

      if (proximoFoco === refPrice.current) {
        focarCampoVisivel(refPrice.current);
        window.setTimeout(() => refPrice.current?.select(), 60);
      }

      if (proximoFoco) {
        setFocoInicialFeito(true);
      }
    }, 220);

    return () => window.clearTimeout(timer);
  }, [
    inicializado,
    imagem,
    descricao,
    marca,
    tamanho,
    tamanhoValido,
    analisandoIA,
    focoInicialFeito,
    camposTextoBloqueados,
    mostraRecorte,
    mostraTutorialFoto,
  ]);

  const interceptarClickFoto = (e: React.MouseEvent<HTMLInputElement>) => {
    if (tutorialFoto.deveExibir()) {
      e.preventDefault();
      setInputPendente(e.currentTarget);
      setMostraTutorialFoto(true);
    }
  };

  const fecharTutorialFotoEContinuar = () => {
    const inputAlvo = inputPendente;
    setMostraTutorialFoto(false);
    setInputPendente(null);
    window.setTimeout(() => {
      inputAlvo?.click();
    }, 40);
  };

  const lidarComSelecaoImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivoSelecionado = e.target.files?.[0];
    if (!arquivoSelecionado) return;

    setErro(null);

    try {
      if (!arquivoSelecionado.type.startsWith('image/')) {
        setErro('Arquivo inválido. Selecione uma imagem.');
        return;
      }

      liberarUrlBlobRecorte();
      const urlBlobTemporaria = URL.createObjectURL(arquivoSelecionado);
      referenciaUrlBlobRecorte.current = urlBlobTemporaria;

      setImagemParaRecorte(urlBlobTemporaria);
      setMostraRecorte(true);
    } catch (erroSelecaoImagem) {
      console.error('Erro ao preparar imagem para recorte:', erroSelecaoImagem);
      setErro('Não foi possível carregar a foto. Tente novamente com outra imagem.');
    } finally {
      e.target.value = '';
    }
  };


  const aoConfirmarRecorte = async (fotoRecortadaBase64: string) => {
    setMostraRecorte(false);
    liberarUrlBlobRecorte();
    setImagem(fotoRecortadaBase64);
    setImagemParaRecorte(null);
    if (!descricao || !marca) {
      setAnalisandoIA(true);
      setFocoInicialFeito(false);
      try {
        const d = await extrairDadosDoRotulo(fotoRecortadaBase64);
        if (d?.descricao) setDescricao(d.descricao);
        if (d?.marca) setMarca(d.marca);
        if (d?.tamanho) setTamanho(normalizarTamanho(d.tamanho));
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 50, 50]);
      } catch (err) {
        setErro(`Não foi possível ler o rótulo automaticamente.`);
      } finally {
        setAnalisandoIA(false);
      }
    }
  };

  const aoCancelarRecorte = () => {
    setMostraRecorte(false);
    liberarUrlBlobRecorte();
    setImagemParaRecorte(null);
  };

  const removerFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setImagem(undefined);
  };

  const lidarMudancaPreco = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '');
    if (!v) { setPrecoInput(''); return; }
    setPrecoInput((parseInt(v, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const rolarParaSalvar = () => {
    window.setTimeout(() => {
      refSalvar.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 180);
  };

  const focarProximoCampoVazio = (campoAtual: 'descricao' | 'marca' | 'tamanho' | 'price') => {
    const valorDescricao = (refDescricao.current?.value ?? descricao).trim();
    const valorMarca = (refMarca.current?.value ?? marca).trim();
    const valorTamanho = normalizarTamanho((refTamanho.current?.value ?? tamanho).trim());
    const valorPrecoTexto = refPrice.current?.value ?? precoInput;
    const valorPreco = parseFloat(valorPrecoTexto.replace(/\./g, '').replace(',', '.'));

    const campos = {
      descricao: valorDescricao.length > 0,
      marca: valorMarca.length > 0,
      tamanho: valorTamanho.length > 0 && REGEX_UNIDADE.test(valorTamanho),
      price: !Number.isNaN(valorPreco) && valorPreco > 0,
    };

    if (!campos[campoAtual]) {
      if (campoAtual === 'descricao') refDescricao.current?.focus();
      if (campoAtual === 'marca') refMarca.current?.focus();
      if (campoAtual === 'tamanho') refTamanho.current?.focus();
      if (campoAtual === 'price') {
        refPrice.current?.focus();
        focarCampoVisivel(refPrice.current);
      }
      return;
    }

    const ordem: Array<'descricao' | 'marca' | 'tamanho' | 'price'> = ['descricao', 'marca', 'tamanho', 'price'];
    const indiceAtual = ordem.indexOf(campoAtual);
    const proximos = ordem.slice(indiceAtual + 1);

    for (const campo of proximos) {
      if (!campos[campo]) {
        if (campo === 'descricao') refDescricao.current?.focus();
        if (campo === 'marca') refMarca.current?.focus();
        if (campo === 'tamanho') refTamanho.current?.focus();
        if (campo === 'price') {
          refPrice.current?.focus();
          focarCampoVisivel(refPrice.current);
          window.setTimeout(() => refPrice.current?.select(), 60);
        }
        return;
      }
    }

    if (campoAtual === 'price') {
      refSalvar.current?.focus();
      return;
    }

    refPrice.current?.focus();
    focarCampoVisivel(refPrice.current);
    window.setTimeout(() => refPrice.current?.select(), 60);
  };

  const focarProximoElementoAposPreco = () => {
    if (!imagem && !analisandoIA) {
      refAutoPreencher.current?.focus();
      return;
    }

    if (!camposTextoBloqueados) {
      if (!descricao.trim()) {
        refDescricao.current?.focus();
        return;
      }
      if (!marca.trim()) {
        refMarca.current?.focus();
        return;
      }
      if (!tamanhoValido) {
        refTamanho.current?.focus();
        return;
      }
    }

    refSalvar.current?.focus();
  };

  const validarESalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCampoComErro(null);
    const tamanhoFinal = normalizarTamanho(tamanho.trim());

    if (!imagem) { setErro('A foto do produto é obrigatória.'); return; }
    
    const descLimpa = descricao.trim();
    if (!descLimpa) { setErro('O nome do produto é obrigatório.'); setCampoComErro('descricao'); refDescricao.current?.focus(); return; }
    
    // Bloqueia nomes genéricos apenas se for entrada manual pura
    if (!veioDeFonteConfiavel && NOMES_INVALIDOS.has(descLimpa.toLowerCase())) {
      setErro('Por favor, informe um nome mais específico para o produto.');
      setCampoComErro('descricao');
      refDescricao.current?.focus();
      return;
    }

    if (!marca.trim()) { setErro('A marca é obrigatória.'); setCampoComErro('marca'); refMarca.current?.focus(); return; }
    if (!tamanhoFinal) { setErro('O tamanho é obrigatório.'); setCampoComErro('tamanho'); refTamanho.current?.focus(); return; }
    if (!REGEX_UNIDADE.test(tamanhoFinal)) {
      setErro('Tamanho inválido. Exemplos válidos: 1L, 500g, 250mL, 10uni, 1cx.');
      setCampoComErro('tamanho');
      refTamanho.current?.focus();
      return;
    }

    const p = parseFloat(precoInput.replace(/\./g, '').replace(',', '.'));
    if (isNaN(p) || p <= 0) { setErro('O preço é obrigatório.'); setCampoComErro('price'); refPrice.current?.focus(); return; }

    const produtoParaSalvar: Produto = {
      codigo_barras: gtinInicial,
      descricao: descricao.trim(),
      marca: marca.trim(),
      tamanho: tamanhoFinal,
      preco_estimado: p,
      imagem,
    };

    setTamanho(tamanhoFinal);

    try {
      await aoSalvar(produtoParaSalvar);
    } catch (erroAoSalvarProduto) {
      console.error('Erro ao concluir salvamento do produto:', erroAoSalvarProduto);
      setErro('Nao foi possivel salvar o produto agora. Tente novamente.');
    }
  };

  const precoNumerico = useMemo(() => {
    return parseFloat(precoInput.replace(/\./g, '').replace(',', '.'));
  }, [precoInput]);

  const formularioPodeSalvar = useMemo(() => {
    if (!imagem) return false;
    const d = descricao.trim();
    if (!d) return false;
    
    // Se for manual, não deixa salvar nomes da lista de inválidos
    if (!veioDeFonteConfiavel && NOMES_INVALIDOS.has(d.toLowerCase())) return false;

    if (!marca.trim()) return false;
    if (!tamanhoValido) return false;
    if (Number.isNaN(precoNumerico) || precoNumerico <= 0) return false;
    return true;
  }, [imagem, descricao, marca, tamanhoValido, precoNumerico, veioDeFonteConfiavel]);

  const classeEspacamentoSalvar = tecladoAtivo
    ? 'pt-2 pb-[calc(env(safe-area-inset-bottom)+8.5rem)]'
    : isCompacto
      ? 'pt-2 pb-[calc(env(safe-area-inset-bottom)+3.5rem)]'
      : 'pt-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]';

  const classeInput = `w-full bg-gray-700 border border-gray-600 rounded-lg text-white font-bold placeholder-gray-400 focus:ring-2 focus:ring-green-700 outline-none transition-colors ${isMuitoCompacto ? 'p-1.5 text-sm' : 'p-2'}`;
  const classeLabel = `block font-bold text-gray-800 uppercase tracking-wide ${isMuitoCompacto ? 'text-[10px] mb-0.5' : 'text-xs mb-1'}`;

  return (
    <div ref={containerRef} className="absolute inset-0 bg-white z-50 flex flex-col h-full overflow-hidden animate-fade-in">
      <div className={`bg-green-700 text-white shadow-md flex items-center gap-3 shrink-0 transition-all ${isMuitoCompacto ? 'px-3 pb-3 pt-6' : 'px-4 pb-4 pt-8'}`}>
        <button type="button" onClick={aoCancelar} className="p-2 -ml-2 hover:bg-green-800 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
        </button>
        <h2 className="font-bold text-lg leading-none">{produtoExistente ? 'Editar Produto' : 'Novo Produto'}</h2>
      </div>

      <div ref={refConteudoRolavel} className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide flex flex-col transition-all ${isCompacto ? 'p-3 pb-2' : 'p-5 pb-2'} ${tecladoAtivo ? 'pb-[calc(env(safe-area-inset-bottom)+8.5rem)]' : ''}`}>
        {mostraRecorte && imagemParaRecorte && <ModalRecorte imagem={imagemParaRecorte} aoConfirmar={aoConfirmarRecorte} aoCancelar={aoCancelarRecorte} />}
        {mostraTutorialFoto && <ModalTutorialFoto aoFechar={fecharTutorialFotoEContinuar} />}

        <style>{`
          @keyframes border-spin { 100% { transform: rotate(360deg); } }
          @keyframes salvar-ready-glow {
            0%, 100% { box-shadow: 0 10px 18px rgba(21, 128, 61, 0.28), 0 0 0 0 rgba(34, 197, 94, 0.16); }
            50% { box-shadow: 0 12px 22px rgba(21, 128, 61, 0.34), 0 0 0 4px rgba(34, 197, 94, 0.10); }
          }
          .salvar-pronto { animation: salvar-ready-glow 2.2s ease-in-out infinite; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        <form id="form-produto" onSubmit={validarESalvar} className={`flex flex-col min-h-full transition-all ${isCustomFix ? 'gap-0' : (isCompacto || isEstreito ? 'gap-2' : 'gap-3')}`}>
          {temCamposFaltantes && (
            <div className={`shrink-0 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 ${isCompacto ? 'p-2' : 'p-3'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-amber-500 mt-0.5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.501-11.418m-1.501 11.418a6.01 6.01 0 0 1-1.501-11.418m1.501 11.418v.75m0-1.5V9" /></svg>
              <div>
                <p className={`text-amber-800 font-medium ${isMuitoCompacto ? 'text-xs' : 'text-sm'}`}>Complete os dados</p>
                <p className={`text-amber-700 mt-0.5 ${isMuitoCompacto ? 'text-[10px]' : 'text-xs'}`}>Faltantes: {camposFaltantes.join(', ')}</p>
              </div>
            </div>
          )}

          <div className={`shrink-0 transition-all duration-300 ${!imagem ? 'ring-2 ring-red-100 rounded-xl bg-red-50 p-1' : ''}`}>
            {!imagem ? (
              <div className={`flex items-stretch transition-all ${isMuitoCompacto ? 'min-h-[6rem] gap-2' : 'min-h-[9rem] gap-3'}`}>
                <div className={`relative rounded-xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 group cursor-pointer shrink-0 transition-all ${isMuitoCompacto ? 'w-24' : 'w-32'}`}>
                  {analisandoIA ? (
                    <div className="flex flex-col items-center animate-pulse"><div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-1"></div><span className="text-[10px] font-bold uppercase">Lendo...</span></div>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`opacity-50 transition-all ${isMuitoCompacto ? 'w-6 h-6 mb-1' : 'w-8 h-8 mb-2'}`}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                      <span className="text-[10px] font-bold uppercase text-gray-600">Galeria</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onClick={interceptarClickFoto} onChange={lidarComSelecaoImagem} disabled={analisandoIA} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </div>

                <div className={`flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex flex-col shadow-sm relative overflow-hidden transition-all ${isMuitoCompacto || isEstreito ? 'p-2' : 'p-3'} justify-center gap-2`}>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="bg-blue-100 p-1 rounded-full text-blue-600 shrink-0"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${isEstreito ? 'w-4 h-4' : 'w-3 h-3'}`}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" /></svg></div>
                      <span className={`font-bold text-blue-800 uppercase leading-none ${isEstreito ? 'text-xs tracking-tight' : isMuitoCompacto ? 'text-[10px]' : 'text-xs'}`}>Foto Obrigatória</span>
                    </div>
                    <p className={`text-blue-800 leading-tight transition-all ${isEstreito ? 'text-[10px] mt-0.5' : isCompacto ? 'text-[10px]' : 'text-[11px]'}`}>
                      Foto para preencher com IA.
                    </p>
                  </div>

                  <label
                    ref={refAutoPreencher}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const seletor = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement | null;
                        seletor?.click();
                      }
                    }}
                    className={`w-full relative group cursor-pointer rounded-lg overflow-hidden p-[3px] transition-all active:scale-95 ${analisandoIA ? 'cursor-wait opacity-80' : 'shadow-lg'}`}
                  >
                    {!analisandoIA && <div className="absolute inset-[-500%] bg-[conic-gradient(from_0deg,#ff0000,#ff8800,#ffff00,#00ff00,#0000ff,#8800ff,#ff0000)]" style={{ animation: 'border-spin 3s linear infinite' }}></div>}
                    <div className={`relative w-full h-full rounded-[5px] flex items-center justify-center px-3 ${isEstreito ? 'gap-2' : 'gap-1.5'} bg-gradient-to-r from-blue-700 to-indigo-700 text-white z-10 transition-colors ${isMuitoCompacto || isEstreito ? 'py-2' : 'py-4'}`}>
                      {analisandoIA ? <i className="fas fa-spinner fa-spin"></i> : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`shrink-0 ${isEstreito ? 'w-6 h-6' : 'w-4 h-4'}`}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /></svg>
                      )}
                      <span className={`font-bold tracking-wide leading-tight whitespace-nowrap ${isMuitoCompacto || isEstreito ? 'text-[11px] uppercase' : 'text-sm uppercase'}`}>
                        {analisandoIA ? 'Processando...' : 'AUTO PREENCHER'}
                      </span>
                    </div>
                    <input type="file" accept="image/*" capture="environment" onClick={interceptarClickFoto} onChange={lidarComSelecaoImagem} disabled={analisandoIA} className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center shrink-0 animate-fade-in">
                <div className="relative group">
                  <div className={`rounded-xl overflow-hidden border-2 border-dashed flex items-center justify-center relative transition-colors ${imagem ? 'border-green-700 bg-white shadow-sm' : 'border-gray-300'} ${isMuitoCompacto ? 'w-24 h-24 shrink-0' : 'w-32 h-32 shrink-0'}`}>
                    <img
                      src={imagem}
                      alt="Preview"
                      className="w-full h-full object-contain p-1"
                      onError={() => {
                        setImagem(undefined);
                        setErro('A imagem carregada está inválida. Tire uma nova foto.');
                        setFocoInicialFeito(false);
                      }}
                    />
                    <button type="button" onClick={removerFoto} className="absolute top-1 right-1 bg-red-500 text-white w-7 h-7 rounded-full shadow-lg flex items-center justify-center z-20"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`shrink-0 bg-gray-100 px-3 rounded-lg text-center border border-gray-200 flex items-center justify-center gap-2 ${isCompacto ? 'py-1' : 'py-2'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 24" fill="currentColor" className={`text-gray-400 ${isCompacto ? 'w-6 h-6' : 'w-8 h-8'}`}><path d="M2 4h2v16H2zm3.5 0h1v16h-1zM8 4h3v16H8zm4.5 0h1.5v16h-1.5zm3 0h2.5v16h-2.5zm4 0h1v16h-1zm2.5 0h2v16h-2zm3.5 0h3v16h-3zm4.5 0h1v16h-1zm2.5 0h1.5v16h-1.5z" /></svg>
            <span className={`font-mono font-bold text-gray-700 tracking-wider ${isCompacto ? 'text-xs' : 'text-sm'}`}>{gtinInicial}</span>
          </div>

          {faseFormulario === 'foto' && !analisandoIA && (
            <div className={`shrink-0 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in ${isCompacto ? 'p-2' : 'p-3'}`}>
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500 mt-0.5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /></svg>
                <div className="flex-1">
                  <p className={`text-blue-800 font-medium leading-tight ${isCompacto ? 'text-xs' : 'text-sm'}`}>Tire uma foto do rótulo da frente.</p>
                  <p className={`text-blue-700 mt-0.5 ${isCompacto ? 'text-[10px]' : 'text-xs'}`}>Os campos serão preenchidos com IA após a foto.</p>
                </div>
              </div>
              <button type="button" className="mt-2 w-full text-xs text-gray-700 flex items-center justify-center gap-1 py-1.5 rounded border border-gray-300 bg-gray-50 cursor-not-allowed"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg> Preencher manualmente</button>
            </div>
          )}

          <div className={`shrink-0 flex flex-col transition-opacity duration-300 ${isCompacto ? 'gap-2' : 'gap-3'} ${camposTextoBloqueados ? 'opacity-50' : 'opacity-100'}`}>
            <div>
              <label className={classeLabel}>Produto</label>
              <input
                ref={refDescricao}
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                onFocus={(e) => focarCampoVisivel(e.currentTarget)}
                onBlur={lidarBlurCampo}
                enterKeyHint="next"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    focarProximoCampoVazio('descricao');
                  }
                }}
                className={classeInput}
                placeholder="Ex: Coca-Cola 350ml"
                disabled={camposTextoBloqueados}
              />
            </div>
            <div className={`flex ${isMuitoCompacto ? 'gap-2' : 'gap-3'}`}>
              <div className="flex-[3] min-w-0">
                <label className={classeLabel}>Marca</label>
                <input
                  ref={refMarca}
                  value={marca}
                  onChange={e => setMarca(e.target.value)}
                  onFocus={(e) => focarCampoVisivel(e.currentTarget)}
                  onBlur={lidarBlurCampo}
                  enterKeyHint="next"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Tab') {
                      e.preventDefault();
                      focarProximoCampoVazio('marca');
                    }
                  }}
                  className={classeInput}
                  placeholder="Ex: Longa Vida"
                  disabled={camposTextoBloqueados}
                />
              </div>
              <div className="flex-[2] min-w-0">
                <label className={classeLabel}>Tamanho</label>
                <input
                  ref={refTamanho}
                  value={tamanho}
                  onChange={e => {
                    setTamanho(e.target.value);
                    if (campoComErro === 'tamanho') setCampoComErro(null);
                  }}
                  onFocus={(e) => focarCampoVisivel(e.currentTarget)}
                  onBlur={(e) => {
                    const valorNormalizado = normalizarTamanho(e.currentTarget.value);
                    if (valorNormalizado !== e.currentTarget.value) {
                      setTamanho(valorNormalizado);
                    }
                    lidarBlurCampo();
                  }}
                  enterKeyHint="next"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Tab') {
                      e.preventDefault();
                      focarProximoCampoVazio('tamanho');
                    }
                  }}
                  className={`${classeInput} ${(campoComErro === 'tamanho' || tamanhoInvalidoVisivel) ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Ex: 1L, 500g"
                  disabled={camposTextoBloqueados}
                />
                {tamanhoInvalidoVisivel && (
                  <p className={`mt-1 font-medium text-red-600 ${isMuitoCompacto ? 'text-[10px]' : 'text-xs'}`}>
                    Tamanho inválido. Exemplos válidos: 1L, 500g, 250mL, 10uni, 1cx.
                  </p>
                )}
              </div>
            </div>
            <div className={`bg-gray-50 rounded-lg border border-gray-200 ${isMuitoCompacto ? 'p-1.5' : 'p-2'}`}>
              <label className={`block font-bold text-green-700 uppercase tracking-wide ${isMuitoCompacto ? 'text-[10px] mb-0.5' : 'text-xs mb-1'}`}>Preço Unitário (R$) *</label>
              <input
                ref={refPrice}
                type="tel"
                inputMode="decimal"
                enterKeyHint="done"
                value={precoInput}
                onChange={lidarMudancaPreco}
                onFocus={(e) => {
                  focarCampoVisivel(e.currentTarget);
                  rolarParaSalvar();
                }}
                onBlur={lidarBlurCampo}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    focarProximoElementoAposPreco();
                  }
                }}
                className={`w-full p-2 bg-white border-2 rounded-lg text-gray-900 font-bold focus:outline-none transition-all ${isMuitoCompacto ? 'text-xl' : 'text-2xl'} ${campoComErro === 'price' ? 'border-red-500' : 'border-green-700'}`}
                placeholder="0,00"
              />
            </div>
          </div>

          {erro && <div className={`shrink-0 bg-red-50 text-red-600 rounded-lg border border-red-100 font-bold flex items-center p-3 text-sm animate-fade-in`}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" /></svg> {erro}</div>}

          <div className={`mt-auto shrink-0 w-full transition-all ${classeEspacamentoSalvar}`}>
            <button
              ref={refSalvar}
              type="submit"
              disabled={analisandoIA || !formularioPodeSalvar}
              className={`w-full text-white rounded-xl font-bold transition-all ${isCompacto ? 'py-3 text-base' : 'py-4 text-lg'} ${analisandoIA
                ? 'bg-gray-400 cursor-wait'
                : formularioPodeSalvar
                  ? 'bg-green-700 hover:bg-green-800 active:scale-[0.99] shadow-lg salvar-pronto'
                  : 'bg-green-400/80 text-white/90 shadow-none opacity-70 cursor-not-allowed'}`}
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
