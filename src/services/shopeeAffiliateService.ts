/**
 * CampoBR - Serviço de Monetização de Afiliados Shopee (Shopee Afiliados Brasil)
 * 
 * Gerencia o catálogo oficial de produtos afiliados da Shopee e permite ao administrador
 * cadastrar e importar TODOS OS SEUS PRODUTOS AFILIADOS VERDADEIROS da sua conta Shopee.
 * 
 * O robô autônomo do blog lê este catálogo em tempo real e seleciona os produtos mais
 * relevantes contextualmente para cada matéria gerada (ex: se a matéria fala de Flamengo,
 * seleciona a camisa do Flamengo com o link real do usuário; se fala de tática ou técnicos,
 * seleciona a prancheta ou livro com o link do usuário).
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { FootballCategory, ShopeeProduct, ShopeeAffiliateConfig } from '../types';

export type { ShopeeProduct, ShopeeAffiliateConfig };

export const SHOPEE_AFFILIATE_DEFAULT_ID = 'campobr_oficial';
export const LOCAL_STORAGE_KEY_SHOPEE = 'campobr_shopee_affiliate_config_v2';
export const LOCAL_STORAGE_KEY_USER_PRODUCTS = 'campobr_shopee_user_products_v2';
export const FIRESTORE_SHOPEE_CONFIG_DOC = 'shopee_affiliate_config';
export const FIRESTORE_SHOPEE_PRODUCTS_DOC = 'shopee_custom_products';

/**
 * Catálogo editorial de alta conversão de futebol (Reserva / Modelo)
 * Conforme diretrizes estritas:
 * - Não inventar ASIN.
 * - Não afirmar preço atual sem consulta válida ("Verificar preço atual").
 * - Não inventar avaliações, quantidade de reviews, descontos, Prime, estoque ou volume de vendas.
 * - Marcar produtos expressamente com verified ou unverified.
 * - Usar link direto /dp/ASIN somente quando houver ASIN válido; caso contrário usar link de busca.
 */
export function isValidAsin(asin?: string): boolean {
  if (!asin) return false;
  const clean = asin.trim().toUpperCase();
  // Padrão ASIN oficial da Amazon: exatamente 10 caracteres alfanuméricos (ex: B07XYZ1234)
  return /^[B0-9][A-Z0-9]{9}$/.test(clean);
}

export const DEFAULT_CURATED_SHOPEE_PRODUCTS: ShopeeProduct[] = [
  {
    id: 'shopee-manto-serie-a',
    title: 'Camisa Oficial de Torcedor Clubes do Brasileirão Série A',
    category: 'Clubes Serie A',
    priceDisplay: 'Verificar preço atual',
    currentPriceVerified: false,
    verifiedStatus: 'unverified',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
    badge: 'Mantos Oficiais',
    searchQuery: 'camisa futebol clubes brasileirao serie a',
    directShopeeUrl: '',
    description: 'Manto de torcedor com tecido respirável Dry, escudo bordado e modelagem esportiva oficial.',
    freeShipping: false,
    keywords: ['serie a', 'flamengo', 'palmeiras', 'corinthians', 'sao paulo', 'vasco', 'gremio', 'internacional', 'camisa', 'manto', 'brasileirao'],
    isUserRealProduct: false,
    productSpecifications: ['Tecido 100% Poliéster Dry', 'Escudo bordado', 'Gola redonda canelada'],
    editorialNotes: 'Modelo sugerido para torcedores que acompanham a Série A. Consulte o valor vigente no distribuidor oficial.',
  },
  {
    id: 'shopee-manto-serie-b',
    title: 'Camisa Retrô & Clássica dos Gigantes Tradicionais da Série B',
    category: 'Clubes Serie B',
    priceDisplay: 'Verificar preço atual',
    currentPriceVerified: false,
    verifiedStatus: 'unverified',
    imageUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=600&q=80',
    badge: 'Tradição & Raça',
    searchQuery: 'camisa retro futebol clubes serie b santos sport ceara',
    directShopeeUrl: '',
    description: 'Modelos clássicos em homenagem aos grandes esquadrões históricos que marcaram época no futebol nacional.',
    freeShipping: false,
    keywords: ['serie b', 'santos', 'sport', 'ceara', 'coritiba', 'goias', 'vila nova', 'retro', 'camisa'],
    isUserRealProduct: false,
    productSpecifications: ['Algodão penteado ou poliéster retrô', 'Gola polo clássica'],
    editorialNotes: 'Peça histórica de colecionador. Preço e disponibilidade dependem do estoque do lojista.',
  },
  {
    id: 'shopee-manto-selecao',
    title: 'Camisa da Seleção Brasileira Canarinho Torcedor',
    category: 'Seleção Brasileira',
    priceDisplay: 'Verificar preço atual',
    currentPriceVerified: false,
    verifiedStatus: 'unverified',
    imageUrl: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=600&q=80',
    badge: 'Amarelinha Oficial',
    searchQuery: 'camisa selecao brasileira amarela torcedor copa',
    directShopeeUrl: '',
    description: 'A clássica camisa amarela pentacampeã com detalhes em verde bandeira e tecido leve.',
    freeShipping: false,
    keywords: ['selecao', 'brasil', 'canarinho', 'dorival', 'amarelinha', 'cbf', 'vinicius', 'rodrygo', 'endrick'],
    isUserRealProduct: false,
    productSpecifications: ['Tecido esportivo respirável', 'Bandeira do Brasil e escudo oficial'],
    editorialNotes: 'Indumentária de torcida para jogos eliminatórios e torneios internacionais.',
  },
  {
    id: 'shopee-meiao-grip',
    title: 'Meião Antiderrapante Profissional com Grip de Silicone para Futebol',
    category: 'Jogadores',
    priceDisplay: 'Verificar preço atual',
    currentPriceVerified: false,
    verifiedStatus: 'unverified',
    imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=600&q=80',
    badge: 'Acessório de Campo',
    searchQuery: 'meiao antiderrapante profissional futebol grip',
    directShopeeUrl: '',
    description: 'Almofadas de silicone na sola que estabilizam a pisada e aumentam a tração dentro da chuteira.',
    freeShipping: false,
    keywords: ['meiao', 'antiderrapante', 'jogadores', 'equipamento', 'estabilidade', 'futebol'],
    isUserRealProduct: false,
    productSpecifications: ['Silicone antiderrapante na sola', 'Composição: Algodão, Elastano e Poliamida'],
    editorialNotes: 'Acessório amplamente utilizado por atletas profissionais para prevenir atrito interno.',
  },
  {
    id: 'shopee-bola-penalty',
    title: 'Bola de Campo e Society Costurada / Termotec Oficial',
    category: 'Jogadores',
    priceDisplay: 'Verificar preço atual',
    currentPriceVerified: false,
    verifiedStatus: 'unverified',
    imageUrl: 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?auto=format&fit=crop&w=600&q=80',
    badge: 'Equipamento Oficial',
    searchQuery: 'bola futebol campo penalty termotec',
    directShopeeUrl: '',
    description: 'Circunferência e peso regulamentares, costura reforçada para grama natural e sintética.',
    freeShipping: false,
    keywords: ['bola', 'campo', 'penalty', 'society', 'jogo', 'gramado', 'chute'],
    isUserRealProduct: false,
    productSpecifications: ['Tamanho 5 oficial', 'Câmara de ar de butil', 'Circunferência 68-70cm'],
    editorialNotes: 'Bola indicada para treinos e partidas amadoras ou de categoria de base.',
  },
  {
    id: 'shopee-chuteira-campo',
    title: 'Chuteira de Campo Society com Travas de Borracha e Reforço Lateral',
    category: 'Jogadores',
    priceDisplay: 'Verificar preço atual (Check current price)',
    currentPriceVerified: false,
    verifiedStatus: 'unverified',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    badge: 'Acessório Esportivo',
    searchQuery: 'chuteira campo travas futebol masculino',
    directShopeeUrl: '',
    description: 'Solado com cravos para tração e estabilidade em gramados naturais e sintéticos.',
    freeShipping: false,
    keywords: ['chuteira', 'travas', 'artilheiro', 'atacante', 'gol', 'cravos', 'velocidade'],
    isUserRealProduct: false,
    productSpecifications: ['Cabedal sintético resistente', 'Travas de TPU multidirecionais'],
    editorialNotes: 'Modelo de entrada adequado para jogos amadores semanais.',
  },
  {
    id: 'shopee-prancheta-tatica',
    title: 'Prancheta Tática Magnética Dupla Face para Técnicos de Futebol',
    category: 'Equipe Técnica',
    priceDisplay: 'Verificar preço atual (Check current price)',
    currentPriceVerified: false,
    verifiedStatus: 'unverified',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    badge: 'Ferramenta Técnica',
    searchQuery: 'prancheta tatica magnetica futebol campo',
    directShopeeUrl: '',
    description: 'Quadro magnético para instrução tática com diagramação de campo inteiro e meio campo.',
    freeShipping: false,
    keywords: ['tecnico', 'tatica', 'treinador', 'prancheta', 'esquema', 'abel ferreira', 'tite', 'artur jorge', 'estrategia'],
    isUserRealProduct: false,
    productSpecifications: ['Material: Alumínio e PVC imantado', 'Dimensões: 45cm x 30cm'],
    editorialNotes: 'Utilizado por treinadores e auxiliares para preleções antes do jogo.',
  },
  {
    id: 'shopee-copo-termico',
    title: 'Copo Térmico Inox com Tampa para Torcedores de Futebol',
    category: 'Eventos',
    priceDisplay: 'Verificar preço atual (Check current price)',
    currentPriceVerified: false,
    verifiedStatus: 'unverified',
    imageUrl: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=600&q=80',
    badge: 'Item de Torcida',
    searchQuery: 'copo termico inox time futebol',
    directShopeeUrl: '',
    description: 'Isolamento a vácuo com parede dupla em aço inoxidável para conservar bebidas geladas.',
    freeShipping: false,
    keywords: ['copo', 'torcida', 'estadio', 'festa', 'cerveja', 'churrasco', 'final', 'classico'],
    isUserRealProduct: false,
    productSpecifications: ['Capacidade: 473ml', 'Aço inoxidável 18/8', 'Livre de BPA'],
    editorialNotes: 'Copo térmico sem marcas registradas não oficiais.',
  },
];

/**
 * Retorna as configurações gerais de afiliação Shopee
 */
export function getShopeeAffiliateConfig(): ShopeeAffiliateConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SHOPEE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        catalogMode: 'prefer_user_products',
        ...parsed,
      };
    }
  } catch {
    // fallback
  }
  return {
    affiliateId: SHOPEE_AFFILIATE_DEFAULT_ID,
    enabled: true,
    disclosure: 'Transparência Editorial: Como afiliado Shopee, o portal CampoBR pode ser remunerado por compras qualificadas através dos links, sem nenhum custo adicional para você.',
    showInArticle: true,
    showInSidebar: true,
    catalogMode: 'prefer_user_products',
    userProductsCount: 0,
  };
}

/**
 * Salva as configurações gerais da Shopee
 */
export function saveShopeeAffiliateConfig(config: ShopeeAffiliateConfig): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_SHOPEE, JSON.stringify(config));
  } catch {
    // ignore
  }

  if (db) {
    try {
      setDoc(doc(db, 'system_configs', FIRESTORE_SHOPEE_CONFIG_DOC), config, { merge: true })
        .catch(err => console.warn('Erro ao sincronizar shopee config no Firestore:', err));
    } catch {
      // offline
    }
  }
}

/**
 * Retorna todos os produtos cadastrados PELO USUÁRIO (seus links reais da Shopee)
 */
export function getUserShopeeProducts(): ShopeeProduct[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_USER_PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erro ao ler produtos do usuário da Shopee:', err);
  }
  return [];
}

/**
 * Salva os produtos reais do usuário no LocalStorage e no Firestore
 */
export async function saveUserShopeeProducts(products: ShopeeProduct[]): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_USER_PRODUCTS, JSON.stringify(products));
    
    // Atualiza contagem na configuração
    const currentConfig = getShopeeAffiliateConfig();
    currentConfig.userProductsCount = products.length;
    saveShopeeAffiliateConfig(currentConfig);
  } catch (err) {
    console.warn('Erro ao salvar produtos locais da Shopee:', err);
  }

  if (db) {
    try {
      await setDoc(doc(db, 'system_configs', FIRESTORE_SHOPEE_PRODUCTS_DOC), {
        products,
        updatedAt: new Date().toISOString(),
        totalCount: products.length,
      }, { merge: true });
      console.info(`CampoBR: ${products.length} produtos de afiliado Shopee salvos em nuvem no Firestore.`);
    } catch (err) {
      console.warn('Erro ao persistir catálogo Shopee no Firestore:', err);
    }
  }
}

/**
 * Sincroniza os produtos do usuário a partir do Firestore para garantir consistência
 */
export async function syncShopeeProductsFromCloud(): Promise<ShopeeProduct[]> {
  const local = getUserShopeeProducts();
  if (!db) return local;

  try {
    const snap = await getDoc(doc(db, 'system_configs', FIRESTORE_SHOPEE_PRODUCTS_DOC));
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.products) && data.products.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY_USER_PRODUCTS, JSON.stringify(data.products));
        return data.products;
      }
    }
  } catch (err) {
    console.warn('Erro ao buscar produtos Shopee do Firestore:', err);
  }
  return local;
}

/**
 * Adiciona um produto real de afiliado Shopee
 */
export async function addUserShopeeProduct(productData: Omit<ShopeeProduct, 'id' | 'createdAt'>): Promise<ShopeeProduct> {
  const existing = getUserShopeeProducts();
  const newProduct: ShopeeProduct = {
    ...productData,
    id: 'user-shopee-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    isUserRealProduct: true,
    createdAt: new Date().toISOString(),
  };

  const updated = [newProduct, ...existing];
  await saveUserShopeeProducts(updated);
  return newProduct;
}

/**
 * Remove um produto do usuário
 */
export async function deleteUserShopeeProduct(productId: string): Promise<ShopeeProduct[]> {
  const existing = getUserShopeeProducts();
  const updated = existing.filter(p => p.id !== productId);
  await saveUserShopeeProducts(updated);
  return updated;
}

/**
 * Importador Rápido em Lote: Converte texto livre ou links colados da Shopee em produtos afiliados
 */
export async function importShopeeProductsFromBulkText(rawText: string, defaultCategory: FootballCategory = 'Clubes Serie A'): Promise<{ added: number; products: ShopeeProduct[] }> {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const existing = getUserShopeeProducts();
  const newItems: ShopeeProduct[] = [];

  for (const line of lines) {
    // Formato 1: URL direta (ex: https://s.shopee.com.br/xyz ou https://shope.ee/xyz)
    const urlMatch = line.match(/(https?:\/\/(?:s\.shopee\.com\.br|shope\.ee|shopee\.com\.br)[^\s]+)/i);
    if (!urlMatch) continue;

    const directUrl = urlMatch[1];
    let title = line.replace(directUrl, '').replace(/[-|–,]/g, ' ').trim();
    if (!title || title.length < 4) {
      title = 'Produto Oficial de Futebol na Shopee';
    }

    // Tenta detectar preço se houver "R$ xx,xx"
    const priceMatch = line.match(/R\$\s*(\d+[\.,]\d{2})/i);
    const priceDisplay = priceMatch ? `R$ ${priceMatch[1].replace('.', ',')}` : 'R$ 79,90';

    // Gera palavras-chave a partir do título
    const keywords = title
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúãõâêîôûç\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length >= 3);

    const hasValidPrice = Boolean(priceMatch);
    const finalPriceDisplay = hasValidPrice ? `R$ ${priceMatch![1].replace('.', ',')}` : 'Verificar preço atual (Check current price)';

    const prod: ShopeeProduct = {
      id: 'user-shopee-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: title.charAt(0).toUpperCase() + title.slice(1),
      category: defaultCategory,
      priceDisplay: finalPriceDisplay,
      currentPriceVerified: hasValidPrice,
      verifiedStatus: directUrl ? 'verified' : 'unverified',
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
      badge: directUrl ? 'Link Verificado' : 'Busca no Marketplace',
      searchQuery: title,
      directShopeeUrl: directUrl,
      description: 'Item de futebol selecionado para torcedores e praticantes.',
      freeShipping: false,
      keywords,
      isUserRealProduct: true,
      productSpecifications: ['Verificar especificações completas na loja oficial'],
      editorialNotes: 'Link cadastrado pelo editor para busca direta do produto.',
      createdAt: new Date().toISOString(),
    };

    newItems.push(prod);
  }

  if (newItems.length > 0) {
    const combined = [...newItems, ...existing];
    await saveUserShopeeProducts(combined);
    return { added: newItems.length, products: combined };
  }

  return { added: 0, products: existing };
}

/**
 * Constrói o link seguro de afiliado (Shopee ou Amazon)
 * Regras Estritas:
 * - Não inventar ASIN.
 * - Usar link direto /dp/ASIN SOMENTE quando houver ASIN válido (10 caracteres).
 * - Usar link de busca quando o produto não estiver verificado.
 * - Exibir link direto do usuário se cadastrado na conta.
 */
export function buildShopeeAffiliateUrl(product: ShopeeProduct, affiliateId?: string): string {
  const affId = affiliateId || getShopeeAffiliateConfig().affiliateId || SHOPEE_AFFILIATE_DEFAULT_ID;

  // 1. Verificação de Produto Amazon com ASIN válido
  if (product.asin) {
    if (isValidAsin(product.asin)) {
      // Link direto /dp/ASIN com ASIN verificado
      return `https://www.amazon.com.br/dp/${product.asin.trim().toUpperCase()}?tag=${encodeURIComponent(affId)}`;
    }
    // ASIN inválido: cai obrigatoriamente no link de busca
    const query = encodeURIComponent(product.searchQuery || product.title);
    return `https://www.amazon.com.br/s?k=${query}&tag=${encodeURIComponent(affId)}`;
  }

  // 2. Link direto verificado da Shopee cadastrado pelo usuário
  if (product.directShopeeUrl && product.directShopeeUrl.trim().length > 0) {
    const url = product.directShopeeUrl.trim();
    if (url.includes('s.shopee.com.br') || url.includes('shope.ee')) {
      return url;
    }
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}utm_source=an_campobr&af_sub1=${encodeURIComponent(affId)}`;
  }

  // 3. Fallback de busca da Shopee para produtos não verificados
  const query = encodeURIComponent(product.searchQuery || product.title);
  return `https://shopee.com.br/search?keyword=${query}&utm_source=an_campobr&af_sub1=${encodeURIComponent(affId)}`;
}

/**
 * MOTOR DE CORRESPONDÊNCIA INTELIGENTE DO ROBÔ AUTÔNOMO
 * 
 * Seleciona os produtos da Shopee mais relevantes para o contexto da matéria.
 * Prioriza SEMPRE os produtos reais cadastrados pelo usuário.
 */
export function getSmartContextualShopeeProducts(options: {
  category: FootballCategory;
  postTitle?: string;
  postContent?: string;
  postSummary?: string;
  limit?: number;
}): ShopeeProduct[] {
  const { category, postTitle = '', postContent = '', postSummary = '', limit = 3 } = options;
  const config = getShopeeAffiliateConfig();
  const userProducts = getUserShopeeProducts();

  // Texto consolidado para busca de palavras-chave
  const fullText = `${postTitle} ${postSummary} ${postContent} ${category}`.toLowerCase();

  // Função interna de pontuação de relevância
  const calculateScore = (product: ShopeeProduct): number => {
    let score = 0;

    // Prioridade máxima: se o produto foi cadastrado pelo usuário com o seu link real!
    if (product.isUserRealProduct) {
      score += 50;
    }

    // Correspondência de categoria
    if (product.category === category) {
      score += 30;
    }

    // Correspondência por palavras-chave
    if (product.keywords && Array.isArray(product.keywords)) {
      for (const kw of product.keywords) {
        const lowerKw = kw.toLowerCase().trim();
        if (lowerKw.length >= 3 && fullText.includes(lowerKw)) {
          score += 15;
        }
      }
    }

    // Correspondência pelo título do produto
    const titleWords = product.title.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
    for (const tw of titleWords) {
      if (fullText.includes(tw)) {
        score += 8;
      }
    }

    return score;
  };

  // Modo Exclusivo do Usuário: só usa os produtos reais cadastrados
  if (config.catalogMode === 'exclusive_user_products') {
    if (userProducts.length === 0) return [];
    const scoredUser = [...userProducts].sort((a, b) => calculateScore(b) - calculateScore(a));
    return scoredUser.slice(0, limit);
  }

  // Modo Preferencial do Usuário: pontua produtos do usuário + catálogo de reserva
  const pool = [...userProducts, ...DEFAULT_CURATED_SHOPEE_PRODUCTS];
  const scored = pool.sort((a, b) => calculateScore(b) - calculateScore(a));

  return scored.slice(0, limit);
}

/**
 * Função de retrocompatibilidade para componentes existentes
 */
export function getContextualShopeeProducts(
  category: FootballCategory,
  limit: number = 3
): ShopeeProduct[] {
  return getSmartContextualShopeeProducts({ category, limit });
}
