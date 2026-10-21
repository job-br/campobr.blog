#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import json
import re

from scripts_uol_cat1_selecao import SELECAO_UOL_POSTS
from scripts_uol_cat2_clubes_a import CLUBES_A_UOL_POSTS
from scripts_uol_cat3_clubes_b import CLUBES_B_UOL_POSTS
from scripts_uol_cat4_jogadores import JOGADORES_UOL_POSTS
from scripts_uol_cat5_comissoes import COMISSOES_UOL_POSTS
from scripts_uol_cat6_eventos import EVENTOS_UOL_POSTS

all_posts = []
all_posts.extend(SELECAO_UOL_POSTS)
all_posts.extend(CLUBES_A_UOL_POSTS)
all_posts.extend(CLUBES_B_UOL_POSTS)
all_posts.extend(JOGADORES_UOL_POSTS)
all_posts.extend(COMISSOES_UOL_POSTS)
all_posts.extend(EVENTOS_UOL_POSTS)

print(f"Total de matérias prontas para montagem no padrão UOL: {len(all_posts)}")

# Comments
sample_comments = [
    {
        "id": "c1",
        "postId": "art-sel-1",
        "authorName": "Carlos Henrique (Torcedor Canarinho)",
        "content": "Excelente análise tática! O Brasil finalmente reencontrou a intensidade e amplitude com o Vini Jr e Rodrygo livres pelas pontas. Essa Ficha Técnica e os lances detalhados mostram exatamente como o jogo foi ganho.",
        "createdAt": "2026-10-12T22:00:00Z",
        "likes": 14
    },
    {
        "id": "c2",
        "postId": "art-cla-1",
        "authorName": "Mariana Souza (Rubro-Negra)",
        "content": "Que cobertura completa! O primeiro tempo do Flamengo foi avassalador e o Pedro na grande área é imparável. Acompanhando sempre o CampoBR pelas estatísticas de verdade.",
        "createdAt": "2026-10-12T22:15:00Z",
        "likes": 22
    },
    {
        "id": "c3",
        "postId": "art-clb-1",
        "authorName": "Renato Alvinegro (Santista)",
        "content": "A Vila Belmiro jogou junto! O gol do JP Chermont foi uma pintura. Rumo à Série A de volta ao lugar de onde o Santos nunca deveria ter saído!",
        "createdAt": "2026-10-12T22:30:00Z",
        "likes": 9
    }
]

# Generate TypeScript file
ts_lines = [
    "import { Post, Comment } from '../types';",
    "",
    "/**",
    " * Postagens Oficiais de Alto Valor do Portal CampoBR",
    " * 100% no padrão de jornalismo de alto impacto (Benchmark UOL Esporte)",
    " * Em estrita conformidade com os requisitos de monetização do Google AdSense.",
    " */",
    "export const INITIAL_POSTS: Post[] = ["
]

for idx, post in enumerate(all_posts):
    is_featured = (idx == 0 or idx == 6 or idx == 12 or idx == 18 or idx == 24 or idx == 30)
    ts_lines.append("  {")
    ts_lines.append(f"    id: {json.dumps(post['id'])},")
    ts_lines.append(f"    title: {json.dumps(post['title'])},")
    ts_lines.append(f"    slug: {json.dumps(post['slug'])},")
    ts_lines.append(f"    summary: {json.dumps(post['summary'])},")
    ts_lines.append(f"    category: {json.dumps(post['category'])},")
    ts_lines.append(f"    publishedAt: {json.dumps(post['publishedAt'])},")
    ts_lines.append(f"    createdAt: {json.dumps(post['createdAt'])},")
    ts_lines.append(f"    updatedAt: {json.dumps(post.get('updatedAt', post['publishedAt']))},")
    ts_lines.append(f"    status: 'published',")
    ts_lines.append(f"    featured: {'true' if is_featured else 'false'},")
    ts_lines.append(f"    authorName: {json.dumps(post['authorName'])},")
    ts_lines.append(f"    authorRole: {json.dumps(post['authorRole'])},")
    ts_lines.append(f"    authorAvatar: {json.dumps(post['authorAvatar'])},")
    ts_lines.append(f"    coverImage: {json.dumps(post['coverImage'])},")
    ts_lines.append(f"    thematicConcept: {json.dumps(post['thematicConcept'])},")
    ts_lines.append(f"    aiImageMention: {json.dumps(post['aiImageMention'])},")
    ts_lines.append(f"    viewsCount: {post['viewsCount']},")
    ts_lines.append(f"    likesCount: {post['likesCount']},")
    ts_lines.append(f"    readTimeMinutes: {post['readTimeMinutes']},")
    ts_lines.append(f"    tags: {json.dumps(post['tags'])},")
    
    # Content as clean template string
    content_escaped = post['content'].replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
    ts_lines.append(f"    content: `{content_escaped}`")
    ts_lines.append("  },")

ts_lines.append("];")
ts_lines.append("")
ts_lines.append("// Comentários iniciais da comunidade esportiva")
ts_lines.append("export const INITIAL_COMMENTS: Record<string, Comment[]> = {")
ts_lines.append("  'art-sel-1': [")
ts_lines.append(f"    {json.dumps(sample_comments[0], ensure_ascii=False)}")
ts_lines.append("  ],")
ts_lines.append("  'art-cla-1': [")
ts_lines.append(f"    {json.dumps(sample_comments[1], ensure_ascii=False)}")
ts_lines.append("  ],")
ts_lines.append("  'art-clb-1': [")
ts_lines.append(f"    {json.dumps(sample_comments[2], ensure_ascii=False)}")
ts_lines.append("  ]")
ts_lines.append("};")
ts_lines.append("")

out_path = os.path.join("src", "data", "mockPosts.ts")
with open(out_path, "w", encoding="utf-8") as f:
    f.write("\n".join(ts_lines))

print(f"Arquivo gerado com sucesso em {out_path}!")

# Count words
total_words = 0
for p in all_posts:
    total_words += len(p['content'].split())
print(f"Total de palavras no portal: {total_words}")
print(f"Média de palavras por matéria: {total_words / len(all_posts):.1f}")
