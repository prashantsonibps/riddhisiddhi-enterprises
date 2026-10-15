import { productMarkup } from './catalogue.mjs';
import { products, categoryPhotos } from './products.mjs';
import { policies } from './policies.mjs';
import { CONTACT, readBasket, buildEnquiry, enquiryLink, toCSV } from './core.mjs';

const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let basket=[], storageAvailable=true, filter='All', industryFilter=null, toastTimer, searchTimer;
try { basket=readBasket(localStorage.getItem('riddhi-siddhi-enquiry'),products); } catch { storageAvailable=false; }

function toast(message) {
  $('#toast').textContent=message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4000);
}
function persistBasket() {
  try { localStorage.setItem('riddhi-siddhi-enquiry',JSON.stringify(basket)); } catch { storageAvailable=false; }
  $('#basket-toggle').hidden=!basket.length;
  $('#basket-count').textContent=basket.length;
}
function renderProducts() {
  const term=$('#product-search').value.toLowerCase().trim();
  const visible=products.filter(p=>(filter==='All'||p.category===filter)&&(!industryFilter||p.applications.includes(industryFilter))&&`${p.name} ${p.subtitle} ${p.category} ${p.id} ${p.applications.join(' ')}`.toLowerCase().includes(term));
  $('#product-list').innerHTML=visible.map(p=>productMarkup(p,products.indexOf(p),basket.some(item=>item.id===p.id))).join('');
  $('#empty-state').hidden=!!visible.length;
  $('#result-count').textContent=filter==='All'&&!industryFilter&&!term?'9 ingredients across 3 speciality categories':`${visible.length} matching product${visible.length===1?'':'s'}${industryFilter?' · '+industryFilter:''}`;
  $('#reset-products').hidden=filter==='All'&&!industryFilter&&!term;
  document.querySelectorAll('[data-filter]').forEach(button=>{
    const active=button.dataset.filter===filter;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  document.querySelectorAll('[data-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===filter)));
}
function setFilter(value) { filter=value; industryFilter=null; renderProducts(); }
function addProduct(id) {
  const product=products.find(p=>p.id===id);
  if(!product) return;
  if(basket.some(item=>item.id===id)) return openQuote();
  basket.push({id,quantity:''}); persistBasket(); renderProducts();
  $(`[data-add="${id}"]`)?.focus({preventScroll:true});
  toast(`${product.name} added.${storageAvailable?'':' This browser cannot save your basket; keep this page open.'}`);
}
function renderQuoteItems() {
  $('#quote-items').innerHTML=basket.length?basket.map(item=>{
    const product=products.find(p=>p.id===item.id);
    return `<div class="quote-item"><span>${product.name}</span><label><span>Quantity & unit</span><input data-quantity="${item.id}" aria-label="Quantity for ${product.name}" value="${escapeHTML(item.quantity)}" placeholder="e.g. 200 kg" maxlength="80" required></label><button type="button" data-remove="${item.id}" aria-label="Remove ${product.name}">×</button></div>`;
  }).join(''):'<p class="quote-empty">No products selected yet. Describe your chemical requirements below, or add products from the catalogue.</p>';
}
function showDialog(dialog) {
  if(!dialog.open) dialog.showModal();
  document.body.style.overflow='hidden';
}
function invalidatePrepared() {
  $('#prepared-enquiry').hidden=true;
  $('#enquiry-preview').value='';
  $('#send-enquiry').removeAttribute('href');
  $('#form-status').textContent='';
}
function openQuote() { renderQuoteItems(); invalidatePrepared(); showDialog($('#quote-dialog')); }
function openDetail(id) {
  const product=products.find(p=>p.id===id);
  if(!product) return;
  const photo=categoryPhotos[product.category];
  $('#product-detail').innerHTML=`<figure class="detail-photo"><img src="${photo.src}" alt="${photo.alt}" width="1200" height="800" decoding="async"><figcaption>APPLICATION PHOTOGRAPHY / ${product.category.toUpperCase()}</figcaption></figure><div class="detail-tag">RIDDHI SIDDHI ENTERPRISES / ${product.category.toUpperCase()}</div><h2 id="product-title">${product.name}</h2><p>${product.description}</p><h3>Application enquiries</h3><div class="detail-applications">${product.applications.map(application=>`<span>${application}</span>`).join('')}</div><p class="detail-note">Confirm grade, availability, packaging and current technical documents with the team for the exact material.</p><div class="detail-actions"><button class="button" data-detail-add="${product.id}">Add to your enquiry <span>+</span></button><button class="inline-link" data-document-request="${product.id}">Request SDS / COA ↗</button></div>`;
  showDialog($('#product-dialog'));
  handleImages($('#product-detail'));
}
function downloadFile(content,type,filename) {
  let url;
  try {
    url=URL.createObjectURL(new Blob([content],{type}));
    const link=document.createElement('a');
    link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    return true;
  } catch { if(url) URL.revokeObjectURL(url);toast('Download unavailable. Please contact us by email or WhatsApp.');return false; }
}
function handleImages(root=document) {
  root.querySelectorAll('img:not(.channel-icon)').forEach(img=>{
    const fallback=()=>{img.hidden=true;if(img.closest('.chemical-gallery,.about-photo,.detail-photo'))img.parentElement.classList.add('image-unavailable');};
    img.addEventListener('error',fallback,{once:true});
    if(img.complete&&!img.naturalWidth) fallback();
  });
}
$('#product-list').addEventListener('click',event=>{
  const add=event.target.closest('[data-add]'),detail=event.target.closest('[data-detail]');
  if(add) addProduct(add.dataset.add);
  if(detail) openDetail(detail.dataset.detail);
});
$('#product-detail').addEventListener('click',event=>{
  const add=event.target.closest('[data-detail-add]'),doc=event.target.closest('[data-document-request]');
  if(add) { $('#product-dialog').close();addProduct(add.dataset.detailAdd); }
  if(doc) {
    const id=doc.dataset.documentRequest;
    if(!basket.some(item=>item.id===id)) {basket.push({id,quantity:''});persistBasket();renderProducts();}
    $('#product-dialog').close();openQuote();
    const field=$('[name="requirements"]');
    const request=`Please provide the current SDS, specification and COA for ${products.find(p=>p.id===id).name}.`;
    if(!field.value.includes(request)) field.value=[field.value,request].filter(Boolean).join('\n').slice(0,2000);
  }
});
$('.filters').addEventListener('click',event=>{const button=event.target.closest('[data-filter]');if(button)setFilter(button.dataset.filter);});
$('.chemical-gallery').addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(button){$('#product-search').value='';setFilter(button.dataset.category);$('.catalogue-tools').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'start'});}});
$('#product-search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(renderProducts,120);});
$('#reset-products').addEventListener('click',()=>{clearTimeout(searchTimer);$('#product-search').value='';setFilter('All');$('#product-search').focus({preventScroll:true});});
document.querySelectorAll('[data-industry]').forEach(button=>button.addEventListener('click',()=>{
  industryFilter=button.dataset.industry;filter='All';$('#product-search').value='';renderProducts();
  $('.catalogue-tools').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'start'});
}));
document.querySelectorAll('.quote-trigger').forEach(button=>button.addEventListener('click',openQuote));
document.querySelectorAll('.expert-trigger').forEach(button=>button.addEventListener('click',()=>showDialog($('#expert-dialog'))));
$('#expert-to-quote').addEventListener('click',()=>{$('#expert-dialog').close();openQuote();});
$('#basket-toggle').addEventListener('click',openQuote);
$('#quote-items').addEventListener('input',event=>{
  const item=basket.find(item=>item.id===event.target.dataset.quantity);
  if(item){item.quantity=event.target.value;persistBasket();}
});
$('#quote-items').addEventListener('click',event=>{
  const button=event.target.closest('[data-remove]');
  if(button) {
    const removed=products.find(product=>product.id===button.dataset.remove);
    const field=$('[name="requirements"]');
    const autoRequest=`Please provide the current SDS, specification and COA for ${removed.name}.`;
    field.value=field.value.split('\n').filter(line=>line!==autoRequest).join('\n');
    basket=basket.filter(item=>item.id!==button.dataset.remove);
    persistBasket();renderQuoteItems();renderProducts();invalidatePrepared();
    ($('#quote-items input')||$('[name="name"]')).focus({preventScroll:true});
  }
});
$('#quote-form').addEventListener('input',event=>{
  if(event.target.matches('input,textarea:not([readonly])')) {event.target.setCustomValidity('');invalidatePrepared();}
});
$('#quote-form').addEventListener('submit',event=>{
  event.preventDefault();
  const form=event.currentTarget;
  const whitespace=Array.from(form.querySelectorAll('[required]')).find(input=>!input.value.trim());
  if(whitespace){whitespace.setCustomValidity('Please enter a value, not only spaces.');whitespace.reportValidity();return;}
  const fields=Object.fromEntries(new FormData(form));
  let message;
  try {message=buildEnquiry(basket,products,fields);} catch(error){$('#form-status').textContent=error.message;$('[name="requirements"]').focus();return;}
  const channel=event.submitter?.value==='whatsapp'?'whatsapp':'email';
  const result=enquiryLink(channel,message,'Chemical supply enquiry — '+(fields.company.trim()||fields.name.trim()));
  $('#enquiry-preview').value=message;
  $('#send-enquiry').href=result.url;
  $('#send-enquiry').textContent=channel==='whatsapp'?'Open WhatsApp ↗':'Open email app ↗';
  $('#delivery-note').textContent=!result.bodyIncluded?'This is a detailed enquiry. Copy the message first, open your email app, and paste it into the body.':'Review your message in your chosen app, then send it when you’re ready.';
  $('#prepared-enquiry').hidden=false;
  $('#form-status').textContent='Enquiry prepared. Nothing has been sent.';
  $('#send-enquiry').focus();
});
$('#copy-enquiry').addEventListener('click',async()=>{
  const message=$('#enquiry-preview').value;
  if(!message)return;
  try {
    if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(message);toast('Enquiry copied. Paste it into your email or WhatsApp.');
  } catch {
    $('#enquiry-preview').focus();$('#enquiry-preview').select();
    $('#form-status').textContent='Automatic copy is unavailable. The message is selected: use your device’s Copy action, or Save as text.';
  }
});
$('#download-enquiry').addEventListener('click',()=>{
  if($('#enquiry-preview').value&&downloadFile($('#enquiry-preview').value,'text/plain;charset=utf-8;','Riddhi-Siddhi-Enterprises-Enquiry.txt'))toast('Your enquiry is downloading.');
});
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const rect=dialog.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
  });
  dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.style.overflow='';});
});
document.querySelectorAll('[data-policy]').forEach(button=>button.addEventListener('click',()=>{
  $('#policy-content').innerHTML=policies[button.dataset.policy].replace('<h2>','<h2 id="policy-title">');showDialog($('#policy-dialog'));
}));
$('#download-catalogue').addEventListener('click',()=>{
  const rows=[['Riddhi Siddhi Enterprises — Chemical Catalogue'],['Contact','Akash Kashyap'],['Phone','+'+CONTACT.phone],['Email',CONTACT.email],['GSTIN','07AAVFR2945L1ZF'],[],['Chemical','Category','Description'],...products.map(p=>[p.name,p.category,p.description]),[],['Note','Availability, grades, pricing, packaging and product documentation are confirmed on enquiry.']];
  if(downloadFile(toCSV(rows),'text/csv;charset=utf-8;','Riddhi-Siddhi-Enterprises-Chemical-Catalogue.csv'))toast('Your chemical catalogue is downloading.');
});
function closeMenu() {
  $('#navigation').classList.remove('open');$('.menu-toggle').setAttribute('aria-expanded','false');$('.menu-toggle').setAttribute('aria-label','Open navigation');
}
$('.menu-toggle').addEventListener('click',()=>{
  const open=$('#navigation').classList.toggle('open');$('.menu-toggle').setAttribute('aria-expanded',String(open));$('.menu-toggle').setAttribute('aria-label',open?'Close navigation':'Open navigation');
});
document.querySelectorAll('#navigation a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('click',event=>{if(!event.target.closest('header'))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){const wasOpen=$('#navigation').classList.contains('open');closeMenu();if(wasOpen)$('.menu-toggle').focus();}});
window.matchMedia('(min-width: 761px)').addEventListener('change',event=>{if(event.matches)closeMenu();});
let scrollScheduled=false;
function updateScroll() {
  const max=document.documentElement.scrollHeight-window.innerHeight;
  $('#reading-progress').style.transform=`scaleX(${max>0?Math.min(1,Math.max(0,scrollY/max)):0})`;
  $('#header').classList.toggle('scrolled',scrollY>40);
  document.body.classList.toggle('past-hero',scrollY>$('#home').offsetHeight*.65);
  scrollScheduled=false;
}
window.addEventListener('scroll',()=>{if(!scrollScheduled){scrollScheduled=true;requestAnimationFrame(updateScroll);}},{passive:true});
window.addEventListener('resize',updateScroll,{passive:true});
if('IntersectionObserver' in window&&!reducedMotion.matches){
  document.body.classList.add('motion-ready');
  const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target);}}),{threshold:.08});
  document.querySelectorAll('.reveal').forEach((el,index)=>{el.style.setProperty('--reveal-delay',`${index%3*55}ms`);revealObserver.observe(el);});
}
if('IntersectionObserver' in window){
  const navObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)document.querySelectorAll('#navigation a').forEach(link=>{const active=link.hash==='#'+entry.target.id;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}),{rootMargin:'-20% 0px -60% 0px'});
  document.querySelectorAll('main section[id]').forEach(section=>navObserver.observe(section));
}
reducedMotion.addEventListener('change',event=>{if(event.matches)document.body.classList.remove('motion-ready');});
document.addEventListener('visibilitychange',()=>document.body.classList.toggle('page-paused',document.hidden));
window.addEventListener('storage',event=>{
  if(event.key==='riddhi-siddhi-enquiry'||event.key===null){basket=readBasket(event.newValue,products);$('#basket-toggle').hidden=!basket.length;$('#basket-count').textContent=basket.length;renderProducts();if($('#quote-dialog').open){renderQuoteItems();invalidatePrepared();toast('Your enquiry basket was updated in another tab.');}}
});
$('#year').textContent=new Date().getFullYear();persistBasket();renderProducts();handleImages();updateScroll();

// Counters run once; the final figures remain available to assistive technology.
if('IntersectionObserver' in window&&!reducedMotion.matches){
  const counters=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    counters.unobserve(entry.target);
    const target=Number(entry.target.dataset.counter),start=performance.now();
    const animate=now=>{
      const progress=Math.min((now-start)/1000,1);
      entry.target.textContent=String(Math.round(target*(1-Math.pow(1-progress,3))));
      if(progress<1&&!reducedMotion.matches)requestAnimationFrame(animate);
      else entry.target.textContent=String(target);
    };
    requestAnimationFrame(animate);
  }),{threshold:1});
  document.querySelectorAll('[data-counter]').forEach(counter=>counters.observe(counter));
}

// The hero selector introduces each speciality without an autoplay timer.
const heroSpecialities={Aroma:'extraordinary fragrances.', 'Personal care':'everyday care.', Solvents:'better formulations.'};
document.querySelectorAll('[data-hero]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-hero]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
  $('#hero-word').textContent=heroSpecialities[button.dataset.hero];
  $('#product-search').value='';setFilter(button.dataset.hero);
}));
