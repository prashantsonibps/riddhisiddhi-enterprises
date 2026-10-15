import test from 'node:test';
import assert from 'node:assert/strict';
import { readBasket, buildEnquiry, enquiryLink, toCSV } from '../core.mjs';
import { products } from '../products.mjs';
const fields={name:' Test Buyer ',email:'buyer@example.com',destination:'Mumbai, India',company:'A & B',requirements:''};
test('corrupt, obsolete and duplicate saved selections do not break an enquiry',()=>{
  for(const input of ['{bad','null','{}','42'])assert.deepEqual(readBasket(input,products),[]);
  assert.deepEqual(readBasket(JSON.stringify([null,{id:'missing'},{id:'sodium-hyaluronate',quantity:{unexpected:true}},{id:'sodium-hyaluronate',quantity:'200 kg'},{id:'phenoxyethanol',quantity:' 50 kg '}]),products),[{id:'sodium-hyaluronate',quantity:''},{id:'phenoxyethanol',quantity:'50 kg'}]);
});
test('missing products and blank quantities cannot create misleading enquiries',()=>{
  assert.throws(()=>buildEnquiry([],products,fields),/Add a chemical/);
  assert.throws(()=>buildEnquiry([{id:'sodium-hyaluronate',quantity:' '}],products,fields),/quantity/);
  assert.throws(()=>buildEnquiry([{id:'sodium-hyaluronate',quantity:'100 kg'}],products,{...fields,name:' '}),/name/);
});
test('a multi-product enquiry keeps the correct names, units and buyer details',()=>{
  const message=buildEnquiry([{id:'sodium-hyaluronate',quantity:'100 kg'},{id:'dipropylene-glycol',quantity:'1 MT'}],products,fields);
  assert.match(message,/Sodium hyaluronate: 100 kg/);
  assert.match(message,/Dipropylene Glycol: 1 MT/);
  assert.match(message,/Name: Test Buyer\nCompany: A & B/);
});
test('WhatsApp URLs preserve punctuation and Unicode without query injection',()=>{
  const message='DPG & Sodium hyaluronate\nDelhi #1 ₹ Test';
  const link=enquiryLink('whatsapp',message,'Test');
  const url=new URL(link.url);
  assert.equal(url.hostname,'wa.me');assert.equal(url.pathname,'/917786912354');
  assert.equal(url.searchParams.get('text'),message);assert.equal([...url.searchParams].length,1);
});
test('long emails use a short compose URL so the complete message can be copied',()=>{
  const short=enquiryLink('email','100 kg DPG','A & B\r\nBcc: attacker');
  assert.equal(new URL(short.url).searchParams.get('body'),'100 kg DPG');
  assert.ok(!decodeURIComponent(short.url).includes('\n'));
  const long=enquiryLink('email','Detailed requirement '.repeat(200),'Quote');
  assert.equal(long.bodyIncluded,false);assert.equal(new URL(long.url).searchParams.get('body'),null);
});
test('CSV is quoted, Unicode compatible, and spreadsheet-formula safe',()=>{
  const csv=toCSV([['Name','Contact'],['A, B "Ltd"','+917786912354'],['=1+1','@SUM(A1)']]);
  assert.ok(csv.startsWith('\uFEFF'));assert.match(csv,/"A, B ""Ltd"""/);
  assert.ok(csv.includes('"\'+917786912354"'));assert.ok(csv.includes('"\'=1+1"'));assert.ok(csv.includes('"\'@SUM(A1)"'));
});
test('truncated emoji and malformed UTF-16 cannot break message links',()=>{
  const message='Product request '+String.fromCharCode(0xD83D);
  const result=enquiryLink('whatsapp',message,'Quote');
  assert.equal(new URL(result.url).searchParams.get('text'),'Product request \uFFFD');
  const longName='A'.repeat(99)+'😀';
  const text=buildEnquiry([{id:'sodium-hyaluronate',quantity:'50 kg'}],products,{...fields,name:longName});
  assert.doesNotThrow(()=>enquiryLink('email',text,'Quote'));
});

test('Riddhi Siddhi catalogue and enquiry destinations match supplied company details',()=>{
  assert.equal(products.length,9);
  assert.equal(new Set(products.map(p=>p.id)).size,9);
  assert.deepEqual([...new Set(products.map(p=>p.category))].sort(),['Aroma','Personal care','Solvents']);
  assert.ok(products.some(p=>p.id==='preservative-blend'));
  assert.ok(products.some(p=>p.id==='hedione'));
  const message=buildEnquiry([{id:'preservative-blend',quantity:'25 kg'}],products,fields);
  assert.match(message,/Hello Riddhi Siddhi Enterprises/);
  assert.match(message,/Phenoxyethanol \+ ethylhexylglycerin: 25 kg/);
  const email=new URL(enquiryLink('email',message,'Enquiry').url);
  assert.equal(email.pathname,'ridhisidhient@gmail.com');
  assert.equal(new URL(enquiryLink('whatsapp',message,'Enquiry').url).pathname,'/917786912354');
});
