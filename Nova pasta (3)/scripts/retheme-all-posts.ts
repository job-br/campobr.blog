import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'node:fs';
import { getUniqueThematicImageForPost } from '../src/services/aiVisualThemeEngine';

async function main() {
  const apply = process.argv.includes('--apply');
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON ausente.');
  const cfg = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
  const serviceAccount = JSON.parse(serviceAccountJson);
  const app = getApps().find(x => x.name === 'campobr-retheme') || initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id }, 'campobr-retheme');
  const db = getFirestore(app, cfg.firestoreDatabaseId);
  const snapshot = await db.collection('posts').orderBy('createdAt', 'asc').get();
  const usedUrls = new Set<string>();
  let changed = 0;
  for (const doc of snapshot.docs) {
    const post = doc.data();
    if (post.status !== 'published' && post.status !== 'draft' && post.status !== 'scheduled') continue;
    const visual = getUniqueThematicImageForPost(post.title || '', post.summary || '', post.category || 'Eventos', usedUrls, false, post.content || '');
    usedUrls.add(visual.url); usedUrls.add(visual.url.split('?')[0]);
    if (visual.url === post.coverImage) continue;
    console.log(`${apply ? '[UPDATE]' : '[PREVIEW]'} ${doc.id}: ${post.title || '(sem título)'}`);
    if (apply) await doc.ref.update({ coverImage: visual.url, aiImageMention: visual.mention, thematicConcept: visual.thematicConcept, visualMood: visual.visualMood, imageGenerationSource: 'curated-unique', updatedAt: new Date().toISOString() });
    changed++;
  }
  console.log(`${changed} capas alteradas ${apply ? 'no Firestore' : 'na prévia'}. ${apply ? '' : 'Use --apply apenas depois de revisar a prévia.'}`);
}
main().catch(err => { console.error('Reclassificação de capas abortada:', err); process.exitCode = 1; });
