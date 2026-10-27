import { Post, Comment } from '../types';

// Conteúdo de demonstração REMOVIDO: os posts-semente continham relatos de partidas,
// estatísticas, comentários e métricas de engajamento fictícios apresentados como reais.
// O conteúdo agora vem exclusivamente do Firestore (publicado pelo robô editorial ou pelo admin).
export const INITIAL_POSTS: Post[] = [];
export const INITIAL_COMMENTS: Record<string, Comment[]> = {};
