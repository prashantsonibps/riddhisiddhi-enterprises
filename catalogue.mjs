export function productMarkup(product, index, selected=false) {
  // Catalogue fields are static, curated content; escape them for both server and browser rendering.
  const safe=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const p=Object.fromEntries(Object.entries(product).map(([key,value])=>[key,Array.isArray(value)?value.map(safe):safe(value)]));
  const category=p.category==='Aroma'?'Aroma ingredients':p.category==='Solvents'?'Solvents & carriers':'Personal care';
  return `<article class="ingredient-card${selected?' selected':''}"><div class="ingredient-top"><span class="ingredient-category">${category}</span><span class="ingredient-index">${String(index+1).padStart(2,'0')}</span></div><h3><button class="product-name" data-detail="${p.id}">${p.name}</button></h3><p class="ingredient-subtitle">${p.subtitle}</p><div class="ingredient-bottom"><button class="product-details" data-detail="${p.id}" aria-label="View ${p.name} details">View details <span>↗</span></button><button class="add-product" data-add="${p.id}" aria-label="${selected?'View enquiry for':'Add to enquiry:'} ${p.name}">${selected?'Selected':'Enquire'} <span>${selected?'✓':'+'}</span></button></div></article>`;
}
