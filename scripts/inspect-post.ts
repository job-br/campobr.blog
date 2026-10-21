import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import * as fs from 'fs';

async function main() {
  const cfg = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
  const app = initializeApp(cfg);
  const db = getFirestore(app, cfg.firestoreDatabaseId);

  const snap = await getDoc(doc(db, 'posts', 'post-1791142105661-zl0u3'));
  console.log('POST DATA:', JSON.stringify(snap.data(), null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
