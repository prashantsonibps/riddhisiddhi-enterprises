import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { products } from '../products.mjs';
import { productMarkup } from '../catalogue.mjs';

test('static catalogue exposes the same products as the interactive catalogue', async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const initial=html.slice(html.indexOf('<div id="product-list">'),html.indexOf('<p id="empty-state"'));
 const ids=[...initial.matchAll(/data-add="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(ids,products.map(p=>p.id));
 for(const [i,p] of products.entries())assert.ok(initial.includes(productMarkup(p,i)));
});
test('company identity and Vercel output use the corrected production configuration',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const organization=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(organization.name,'Riddhi Siddhi Enterprises');
 assert.equal(organization.email,'ridhisidhient@gmail.com');
 assert.doesNotMatch(html,/Ridhi Sidhi|SK Enterprises/);
 const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.equal(config.outputDirectory,'dist');assert.equal(config.buildCommand,'npm run build');
});
