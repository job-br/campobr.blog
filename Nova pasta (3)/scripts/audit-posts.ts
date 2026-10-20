import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

async function main() {
  const cfg = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
  const app = initializeApp(cfg);
  const db = getFirestore(app, cfg.firestoreDatabaseId);

  const snap = await getDocs(collection(db, 'posts'));
  const posts = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  console.log(`TOTAL_POSTS: ${posts.length}`);

  const titleCounts: Record<string, { count: number; ids: string[]; category: string }> = {};
  for (const p of posts) {
    const norm = (p.title || '').trim().toLowerCase();
    if (!titleCounts[norm]) {
      titleCounts[norm] = { count: 0, ids: [], category: p.category };
    }
    titleCounts[norm].count++;
    titleCounts[norm].ids.push(p.id);
  }

  const duplicates = Object.entries(titleCounts).filter(([_, info]) => info.count > 1);
  console.log(`DUPLICATES_COUNT: ${duplicates.length}`);
  if (duplicates.length > 0) {
    console.log('DUPLICATES_LIST:', JSON.stringify(duplicates, null, 2));
  }

  // Also check similar topics or fallback patterns
  const proceduralPattern = posts.filter(p => p.title?.includes('A Força de') || p.title?.includes('Destaques em'));
  console.log(`PROCEDURAL_OR_TEMPLATE_TITLES: ${proceduralPattern.length}`);
  for (const p of proceduralPattern.slice(0, 10)) {
    console.log(` - ID: ${p.id} | Titulo: ${p.title} | Data: ${p.publishedAt || p.createdAt}`);
  }

  // Top engaging posts
  const sortedByViews = [...posts].sort((a, b) => ((b.viewsCount || 0) + (b.likesCount || 0) * 10) - ((a.viewsCount || 0) + (a.likesCount || 0) * 10));
  console.log('\n--- TOP 5 MOST ENGAGING POSTS (Learning Signals) ---');
  for (const p of sortedByViews.slice(0, 5)) {
    console.log(`★ Views: ${p.viewsCount} | Likes: ${p.likesCount} | Cat: ${p.category} | Title: "${p.title}"`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
