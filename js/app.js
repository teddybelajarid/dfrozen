
const $ = (q, ctx=document)=>ctx.querySelector(q);
const $$ = (q, ctx=document)=>Array.from(ctx.querySelectorAll(q));

const products = [
  {id:'fish', name:'Fillet Ikan', price:28000, img:'assets/product-fish.svg'},
  {id:'chicken', name:'Chicken Nugget', price:32000, img:'assets/product-nugget.svg'},
  {id:'dumpling', name:'Dumpling Ayam', price:35000, img:'assets/product-dumpling.svg'},
  {id:'siomay', name:'Siomay Ikan', price:30000, img:'assets/product-fish.svg'},
  {id:'icecream', name:'Ice Cream Cup', price:12000, img:'assets/product-icecream.svg'},
  {id:'karaage', name:'Ayam Karaage', price:36000, img:'assets/product-chicken.svg'}
];

const topSellers = products.slice(0,5); // maksimal 5

// Utilities
const rupiah = n => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);

const Storage = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
};

// CART
const Cart = {
  key: 'dfrozen_cart',
  items: [],
  load() { this.items = Storage.get(this.key, []); this.renderCount(); },
  save() { Storage.set(this.key, this.items); this.renderCount(); },
  add(id){
    const item = this.items.find(i=>i.id===id);
    if(item) item.qty += 1;
    else {
      const p = products.find(p=>p.id===id);
      this.items.push({id, name:p.name, price:p.price, img:p.img, qty:1});
    }
    this.save(); this.renderList();
  },
  remove(id){ this.items = this.items.filter(i=>i.id!==id); this.save(); this.renderList(); },
  update(id, qty){ const it=this.items.find(i=>i.id===id); if(!it) return;
    it.qty = Math.max(1, qty); this.save(); this.renderList(); },
  subtotal(){ return this.items.reduce((s,i)=>s+i.price*i.qty,0); },
  renderCount(){ $('#cartCount').textContent = this.items.reduce((s,i)=>s+i.qty,0); },
  renderList(){
    const ul = $('#cartItems'); ul.innerHTML = '';
    if(this.items.length===0){ ul.innerHTML = '<li class="hint">Keranjang kosong</li>'; }
    this.items.forEach(i=>{
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        <img src="${i.img}" alt="${i.name}" />
        <div>
          <div><strong>${i.name}</strong></div>
          <div class="price">${rupiah(i.price)}</div>
          <div class="qty">
            <button aria-label="Kurangi" data-act="dec">−</button>
            <span>${i.qty}</span>
            <button aria-label="Tambah" data-act="inc">+</button>
            <button aria-label="Hapus" data-act="del" style="margin-left:8px">Hapus</button>
          </div>
        </div>
        <div><strong>${rupiah(i.price*i.qty)}</strong></div>
      `;
      li.querySelector('[data-act="dec"]').onclick = ()=>this.update(i.id, i.qty-1);
      li.querySelector('[data-act="inc"]').onclick = ()=>this.update(i.id, i.qty+1);
      li.querySelector('[data-act="del"]').onclick = ()=>this.remove(i.id);
      ul.appendChild(li);
    });
    $('#cartSubtotal').textContent = rupiah(this.subtotal());
  }
};

// SLIDER
const Slider = {
  idx: 0,
  track: null,
  render(){
    this.track = $('#sliderTrack');
    this.track.innerHTML = '';
    topSellers.forEach(p=>{
      const card = document.createElement('article');
      card.className = 'card product-card';
      card.innerHTML = `
        <div class="thumb"><img src="${p.img}" alt="${p.name}" loading="lazy"></div>
        <h3>${p.name}</h3>
        <div class="price">${rupiah(p.price)}</div>
        <div class="actions">
          <button class="btn-primary" data-id="${p.id}">Tambahkan ke Keranjang</button>
        </div>
      `;
      card.querySelector('button').onclick = ()=>Cart.add(p.id);
      this.track.appendChild(card);
    });
    $('#sliderPrev').onclick = ()=>this.move(-1);
    $('#sliderNext').onclick = ()=>this.move(1);
  },
  move(step){
    const cards = $$('.product-card', this.track);
    if(cards.length===0) return;
    const visible = window.innerWidth <= 720 ? 1 : 2;
    const maxIdx = Math.max(0, cards.length - visible);
    this.idx = Math.min(maxIdx, Math.max(0, this.idx + step));
    const cardWidth = cards[0].getBoundingClientRect().width + 16; // include gap
    this.track.style.transform = `translateX(${-this.idx * cardWidth}px)`;
  }
};

// Testimonials
const Testi = {
  key: 'dfrozen_testimonials',
  items: [],
  load(){
    this.items = Storage.get(this.key, [
      {name:'Ayu', rating:5, message:'Produknya fresh, anak-anak suka banget!'},
      {name:'Rizki', rating:4, message:'Harga ramah kantong, pelayanan cepat.'},
      {name:'Sinta', rating:5, message:'Nugget dan dumplingnya juara.'}
    ]);
    this.render();
  },
  save(){ Storage.set(this.key, this.items); this.render(); },
  render(){
    const ul = $('#testimonialList'); ul.innerHTML = '';
    this.items.forEach(t=>{
      const li = document.createElement('li');
      li.className = 'testi-item';
      const stars = Array.from({length:5}, (_,i)=>`<img src="assets/star.svg" alt="" width="16" height="16" ${i<+t.rating?'':'style="opacity:.25"'} />`).join('');
      li.innerHTML = `
        <div class="t-av"><div class="t-name">${t.name}</div><div class="t-stars">${stars}</div></div>
        <p>${t.message}</p>
      `;
      ul.appendChild(li);
    });
  },
  add(name, rating, message){
    this.items.unshift({name, rating, message});
    this.save();
  }
};

// Feedback (kritik & saran)
const Feedback = {
  key: 'dfrozen_feedback',
  items: [],
  load(){ this.items = Storage.get(this.key, []); },
  save(){ Storage.set(this.key, this.items); },
  add(entry){ this.items.unshift(entry); this.save(); }
};

function initForms(){
  // Testimonial form
  $('#testimonialForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = $('#tName').value.trim();
    const rating = +$('#tRating').value;
    const msg = $('#tMessage').value.trim();
    if(name && msg){
      Testi.add(name, rating, msg);
      e.target.reset();
      alert('Terima kasih! Testimoni Anda berhasil dikirim.');
    }
  });

  // Feedback form
  $('#feedbackForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = {
      name: $('#fName').value.trim(),
      email: $('#fEmail').value.trim(),
      message: $('#fMessage').value.trim(),
      ts: new Date().toISOString()
    };
    if(data.name && data.email && data.message){
      Feedback.add(data);
      e.target.reset();
      alert('Terima kasih! Kritik & saran Anda tersimpan di perangkat.');
    }
  });

  // Copy feedback to clipboard
  $('#feedbackCopy').addEventListener('click', ()=>{
    const name = $('#fName').value.trim() || '(tanpa nama)';
    const email = $('#fEmail').value.trim() || '(tanpa email)';
    const message = $('#fMessage').value.trim() || '';
    const text = `Kritik & Saran d'Frozen\nNama: ${name}\nEmail: ${email}\nPesan:\n${message}`;
    navigator.clipboard.writeText(text).then(()=>{
      alert('Tersalin! Silakan tempel di WhatsApp/Email.');
    });
  });
}

function initCartUI(){
  $('#openCartBtn').onclick = ()=>$('#cartDrawer').setAttribute('aria-hidden','false');
  $('#closeCartBtn').onclick = ()=>$('#cartDrawer').setAttribute('aria-hidden','true');
  $('#checkoutBtn').onclick = checkout;
  $('#goCheckout').onclick = checkout;
}

function checkout(){
  const total = Cart.subtotal();
  if(total <= 0){ alert('Keranjang masih kosong.'); return; }
  // Simulasi checkout: buat ringkasan dan arahkan ke WhatsApp (jika ingin)
  const summary = Cart.items.map(i=>`• ${i.name} x${i.qty} = ${rupiah(i.price*i.qty)}`).join('%0A');
  const text = `Halo d'Frozen, saya ingin checkout:%0A${summary}%0A%0ATotal: ${rupiah(total)}`;
  // Ganti nomor berikut dengan nomor WhatsApp bisnis Anda (contoh: 62812xxxxxxx)
  const whatsappNumber = ''; // isi nanti
  if(whatsappNumber){
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`,'_blank');
  }else{
    alert('Checkout (simulasi):\n' + decodeURIComponent(text));
  }
}

function ready(){
  $('#year').textContent = new Date().getFullYear();
  Slider.render();
  Cart.load(); Cart.renderList();
  Testi.load();
  Feedback.load();
  initForms();
  initCartUI();
  window.addEventListener('resize', ()=>Slider.move(0), {passive:true});
}

document.addEventListener('DOMContentLoaded', ready);
