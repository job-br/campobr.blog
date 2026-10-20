import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, query, orderBy, limit } from 'firebase/firestore';
import * as fs from 'fs';

async function main() {
  const cfg = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
  const app = initializeApp(cfg);
  const db = getFirestore(app, cfg.firestoreDatabaseId);

  const postsRef = collection(db, 'posts');
  const snap = await getDocs(postsRef);
  const posts = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  console.log(`TOTAL_POSTS: ${posts.length}`);

  // Sort by createdAt / publishedAt descending
  posts.sort((a, b) => {
    const da = new Date(a.publishedAt || a.createdAt || 0).getTime();
    const db = new Date(b.publishedAt || b.createdAt || 0).getTime();
    return db - da;
  });

  console.log('\n--- LATEST 10 POSTS ---');
  for (const p of posts.slice(0, 10)) {
    console.log(`ID: ${p.id} | Date: ${p.publishedAt || p.createdAt} | autoDate: ${p.automationDate} | Cat: ${p.category} | Title: "${p.title}"`);
  }

  const stateSnap = await getDoc(doc(db, 'system_state', 'automation_state'));
  console.log('\n--- SYSTEM_STATE/AUTOMATION_STATE ---');
  if (stateSnap.exists()) {
    console.log(JSON.stringify(stateSnap.data(), null, 2));
  } else {
    console.log('Document system_state/automation_state does not exist');
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
