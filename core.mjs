export const CONTACT = Object.freeze({email:'ridhisidhient@gmail.com',phone:'917786912354'});
function wellFormed(value) {
  return String(value).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g,character=>character.length===2?character:'\uFFFD');
}
export function cleanText(value, limit=2000) {
  return typeof value === 'string' ? wellFormed(value.replace(/\u0000/g,'').trim().slice(0,limit)) : '';
}
export function readBasket(raw, products) {
  try {
    const parsed=JSON.parse(raw || '[]');
    if(!Array.isArray(parsed)) return [];
    const known=new Set(products.map(product=>product.id)),seen=new Set();
    return parsed.filter(item=>item && typeof item === 'object' && known.has(item.id) && !seen.has(item.id) && seen.add(item.id))
      .slice(0,products.length).map(item=>({id:item.id,quantity:cleanText(item.quantity,80)}));
  } catch { return []; }
}
export function buildEnquiry(basket, products, fields) {
  const selected=readBasket(JSON.stringify(basket),products);
  const required=['name','email','destination'];
  if(required.some(key=>!cleanText(fields[key]))) throw new Error('Enter your name, email and delivery location.');
  if(!selected.length && !cleanText(fields.requirements)) throw new Error('Add a chemical or describe your requirements below.');
  if(selected.some(item=>!item.quantity)) throw new Error('Enter a quantity and unit for each selected chemical.');
  return ['Hello Riddhi Siddhi Enterprises,','I would like to enquire about the following chemical requirement:','',...selected.map(item=>`${products.find(product=>product.id===item.id).name}: ${item.quantity}`),'',`Name: ${cleanText(fields.name,100)}`,`Company: ${cleanText(fields.company,150)||'Not specified'}`,`Email: ${cleanText(fields.email,150)}`,`Phone: ${cleanText(fields.phone,40)||'Not specified'}`,`Delivery location: ${cleanText(fields.destination,200)}`,`Other requirements: ${cleanText(fields.requirements)||'None'}`].join('\n');
}
export function enquiryLink(channel,message,subject) {
  if(channel==='whatsapp') return {url:`https://wa.me/${CONTACT.phone}?text=${encodeURIComponent(wellFormed(message))}`,bodyIncluded:true};
  const base=`mailto:${CONTACT.email}?subject=${encodeURIComponent(cleanText(subject,180).replace(/[\r\n]/g,' '))}`;
  const full=base+`&body=${encodeURIComponent(wellFormed(message))}`;
  return full.length>1800 ? {url:base,bodyIncluded:false} : {url:full,bodyIncluded:true};
}
export function csvCell(value) {
  let text=String(value ?? '');
  if(/^[\s]*[=+\-@]/.test(text)) text="'"+text;
  return '"'+text.replace(/"/g,'""')+'"';
}
export function toCSV(rows) { return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n'); }
