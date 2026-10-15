import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

export async function verifySite(directory) {
  const root=resolve(directory);
  const html=await readFile(resolve(root,'index.html'),'utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  if(new Set(ids).size!==ids.length)throw new Error('Duplicate HTML IDs would break navigation or accessible labels.');
  let references=0;
  async function verifyReference(reference,base=root) {
    if(reference.startsWith('#')) {
      if(!ids.includes(reference.slice(1)))throw new Error(`Missing section or icon: ${reference}`);
      return;
    }
    if(/^(?:https?:|mailto:|tel:|data:)/.test(reference))return;
    const path=resolve(base,reference.split(/[?#]/)[0]);
    await access(path).catch(()=>{throw new Error(`Missing website asset: ${reference}`);});
    references++;
  }
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g))await verifyReference(match[1]);
  const css=await readFile(resolve(root,'styles.css'),'utf8');
  for(const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g))await verifyReference(match[1]);
  for(const file of ['app.js','core.mjs','products.mjs','policies.mjs','catalogue.mjs']) {
    const path=resolve(root,file),code=await readFile(path,'utf8');
    for(const match of code.matchAll(/from ['"]([^'"]+)['"]/g))await verifyReference(match[1],dirname(path));
  }
  const structured=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if(!structured)throw new Error('Organization metadata missing.');
  JSON.parse(structured[1]);
  console.log(`Verified ${references} asset references, ${ids.length} unique IDs, section links and organization metadata.`);
}
