if(guard('kasir')){
const S={cart:{},cust:null,metode:'scan',last:null,cat:[],cfg:{},fav:JSON.parse(localStorage.getItem('fav')||'[]'),t:null,q:[]};
const find=id=>S.cat.find(x=>x.id===id);
const total=()=>Object.keys(S.cart).reduce((a,id)=>a+S.cart[id]*find(id).harga,0);
const focusScan=()=>{if($('#t-jual').classList.contains('hide'))return;$('#scan').focus({preventScroll:true});};
document.addEventListener('click',e=>{if(!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&!e.target.closest('dialog'))setTimeout(focusScan,50);});

async function boot(){const d=await api('init');S.cat=d.katalog;S.cfg=d.cfg;applyTheme(d.cfg);$('#hdrName').textContent='Kasir · '+(d.cfg.nama_kantin||'');renderGrid();focusScan();}
boot().catch(e=>toast(e.message,1));

// tab
$('#tabs').onclick=e=>{const t=e.target.dataset.t;if(!t)return;document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b===e.target));
  ['jual','antre','stok','tutup'].forEach(x=>$('#t-'+x).classList.toggle('hide',x!==t));
  if(t==='jual')focusScan();if(t==='antre')loadQ();if(t==='stok')renderStok();};

// katalog
function renderGrid(){const q=$('#cari').value.toLowerCase();
  const l=S.cat.filter(b=>b.stok>0&&b.nama.toLowerCase().includes(q)).sort((a,b)=>(S.fav.includes(b.id)-S.fav.includes(a.id))||a.nama.localeCompare(b.nama));
  $('#grid').innerHTML=l.map(b=>`<div class="item ${b.tersedia?'':'off'}" data-id="${esc(b.id)}"><button class="star" data-fav="${esc(b.id)}">${S.fav.includes(b.id)?'★':'☆'}</button><b>${esc(b.nama)}</b><span>${rp(b.harga)}</span><br><small>stok ${b.stok}</small></div>`).join('')||'<p class="mu">Tidak ada barang</p>';}
$('#cari').oninput=renderGrid;
$('#grid').onclick=e=>{const f=e.target.dataset.fav;if(f){S.fav=S.fav.includes(f)?S.fav.filter(x=>x!==f):S.fav.concat(f);localStorage.setItem('fav',JSON.stringify(S.fav));renderGrid();return;}
  const it=e.target.closest('.item');if(it)add(it.dataset.id,1);};
function add(id,d){const b=find(id),n=(S.cart[id]||0)+d;if(n<=0)delete S.cart[id];else if(n>b.stok){toast('Stok '+b.nama+' hanya '+b.stok,1);return;}else S.cart[id]=n;renderCart();}
function renderCart(){const ids=Object.keys(S.cart);
  $('#cart').innerHTML=ids.length?ids.map(id=>{const b=find(id),q=S.cart[id];return `<div class="row"><span>${esc(b.nama)}<br><small class="mu">${rp(b.harga)} × ${q} = ${rp(b.harga*q)}</small></span><span class="q"><button data-d="-1" data-i="${esc(id)}">−</button> <b>${q}</b> <button data-d="1" data-i="${esc(id)}">+</button> <button data-d="-999" data-i="${esc(id)}">✕</button></span></div>`}).join(''):'Belum ada barang';
  $('#total').textContent=rp(total());
  const c=S.cust,short=c&&!$('#susulan').checked&&c.saldo<total();
  $('#bOk').disabled=!(c&&ids.length)||short;
  const w=$('#cust .warn');if(w)w.classList.toggle('hide',!short);}
$('#cart').onclick=e=>{const i=e.target.dataset.i;if(i)add(i,Number(e.target.dataset.d));};

// pelanggan (terkunci pada hasil scan)
function setCust(c,metode){clearTimeout(S.t);S.cust=c;S.metode=metode;
  $('#cust').classList.remove('hide');
  $('#cust').innerHTML=`<img id="cf" alt="" class="hide" style="float:right;width:88px;height:88px;object-fit:cover;border-radius:12px"><div class="mu">${metode==='manual'?'<span class="tag">INPUT MANUAL</span> ':''}Pastikan nama sesuai orangnya</div><div class="big">${esc(c.nama)}</div><div>Kelas: <b>${esc(c.kelas||'-')}</b></div><div>Sisa saldo: <span class="big">${rp(c.saldo)}</span></div><div class="warn hide">Saldo tidak cukup untuk total ini.</div>`;
  if(c.foto)api('fotoGet',{tipe:'siswa',id:c.id}).then(r=>{if(r.data&&S.cust&&S.cust.id===c.id){$('#cf').src=r.data;$('#cf').classList.remove('hide');}}).catch(()=>{});
  S.t=setTimeout(()=>{clearCust();toast('Pelanggan dibatalkan (waktu habis)',1);},60000);renderCart();}
function clearCust(){clearTimeout(S.t);S.cust=null;$('#cust').classList.add('hide');renderCart();}
function resetAll(){S.cart={};clearCust();renderCart();$('#manual').classList.add('hide');focusScan();}
$('#bBatal').onclick=resetAll;

$('#scan').addEventListener('keydown',e=>{if(e.key!=='Enter')return;e.preventDefault();const v=e.target.value.trim();e.target.value='';if(!v)return;
  run(null,async()=>{ // scan kartu lain otomatis menggantikan (membatalkan) pelanggan sebelumnya
    const c=await api('lookup',{kode:v});setCust(c,'scan');});});

// manual / lupa kartu / darurat
$('#bManual').onclick=()=>{$('#manual').classList.toggle('hide');$('#cariM').focus();};
let tm;$('#cariM').oninput=e=>{clearTimeout(tm);tm=setTimeout(()=>run(null,async()=>{
  const r=await api('search',{q:e.target.value});$('#hasilM').innerHTML=r.map(u=>`<div class="row"><span>${esc(u.nama)} <small class="mu">${esc(u.kelas)} · ${esc(u.nomorInduk)}</small></span><button class="btn sm" data-u="${esc(u.id)}">Pilih</button></div>`).join('');}),350);};
$('#hasilM').onclick=e=>{const id=e.target.dataset.u;if(id)run(e.target,async()=>{setCust(await api('lookup',{customerId:id}),'manual');$('#manual').classList.add('hide');});};
$('#susulan').onchange=renderCart;

// konfirmasi
async function kirim(pin){
  const items=Object.keys(S.cart).map(id=>({id,qty:S.cart[id]}));
  const r=await api('order',{customerId:S.cust.id,items,metode:S.metode,susulan:$('#susulan').checked,jenis:'langsung',pin});
  r.items.forEach(i=>{const b=S.cat.find(x=>x.nama===i.nama);if(b)b.stok-=i.qty;});
  S.last=r.id;$('#bLast').classList.remove('hide');setTimeout(()=>$('#bLast').classList.add('hide'),Number(5)*60000);
  showStruk(r);resetAll();renderGrid();}
$('#bOk').onclick=e=>run(e.target,async()=>{
  try{await kirim();}catch(err){if(/PIN diperlukan/.test(err.message)){$('#pinIn').value='';$('#dPin').showModal();}else throw err;}});
$('#bPinOk').onclick=e=>run(e.target,async()=>{await kirim($('#pinIn').value);$('#dPin').close();});
$('#bPinX').onclick=()=>$('#dPin').close();
$('#bLast').onclick=e=>run(e.target,async()=>{const r=await api('cancel',{id:S.last});toast('Transaksi dibatalkan, saldo dikembalikan');$('#bLast').classList.add('hide');boot();});

function showStruk(r){const c=S.cfg;
  $('#struk').innerHTML=`<div style="text-align:center"><b>${esc(c.nama_sekolah)}</b><br>${esc(c.nama_kantin)}<br>${esc(c.alamat||'')}</div><hr>${esc(r.waktu)}<br>No: ${esc(r.id)}<br>${esc(r.nama)} (${esc(r.kelas||'-')})<hr>`+
   r.items.map(i=>`${esc(i.nama)}<div class="r"><span>${i.qty} × ${i.harga.toLocaleString('id-ID')}</span><span>${i.sub.toLocaleString('id-ID')}</span></div>`).join('')+
   `<hr><div class="r"><b>TOTAL</b><b>${r.total.toLocaleString('id-ID')}</b></div><div class="r"><span>Saldo awal</span><span>${r.saldoSebelum.toLocaleString('id-ID')}</span></div><div class="r"><span>Sisa saldo</span><span>${r.saldoSesudah.toLocaleString('id-ID')}</span></div><hr><div style="text-align:center">${esc(c.teks_struk||'')}</div>`;
  $('#bCetak').classList.toggle('hide',c.cetak_struk!=='Ya');$('#dStruk').showModal();}
$('#bCetak').onclick=()=>window.print();
$('#bTutupS').onclick=()=>{$('#dStruk').close();focusScan();};

// antrean pre-order
const NEXT={Baru:['Diproses','Proses'],Diproses:['Siap','Siap'],Siap:['Selesai','Serahkan']};
async function loadQ(){S.q=await api('queue');renderQ();}
function renderQ(){const f=$('#fa').value.toLowerCase();
  $('#antre').innerHTML=S.q.filter(o=>String(o.antrean).includes(f)||o.nama.toLowerCase().includes(f)).map(o=>`<div class="card" style="margin-top:8px"><div class="row" style="border:0"><span class="big">#${o.antrean}</span><span class="tag">${o.status}</span></div><div>${esc(o.nama)} · ${esc(o.kelas)}</div>${o.items.map(i=>`<div class="mu">${i.qty} × ${esc(i.nama)}</div>`).join('')}<div class="row"><b>${rp(o.total)}</b></div>
   <button class="btn sm" data-s="${NEXT[o.status][0]}" data-o="${esc(o.id)}">${NEXT[o.status][1]}</button> <button class="btn sm red" data-c="${esc(o.id)}">Batalkan</button></div>`).join('')||'<p class="mu">Tidak ada pesanan</p>';}
$('#fa').oninput=renderQ;
$('#antre').onclick=e=>{const d=e.target.dataset;
  if(d.s)run(e.target,async()=>{await api('setStatus',{id:d.o,status:d.s});await loadQ();});
  if(d.c&&confirm('Batalkan pesanan ini? Pengembalian saldo mengikuti kebijakan di Pengaturan.'))run(e.target,async()=>{const r=await api('cancel',{id:d.c});toast(r.refund?'Saldo dikembalikan '+rp(r.refund):'Dibatalkan tanpa pengembalian saldo');await loadQ();});};
poll(loadQ,12000,()=>!$('#t-antre').classList.contains('hide')); // berhenti saat tab tidak terlihat

// tandai habis
function renderStok(){$('#stok').innerHTML=S.cat.map(b=>`<div class="card row" style="margin-top:6px"><span>${esc(b.nama)} <small class="mu">stok ${b.stok}</small></span><button class="btn sm ${b.tersedia?'red':'alt'}" data-h="${esc(b.id)}" data-v="${b.tersedia?1:0}">${b.tersedia?'Tandai habis':'Tandai tersedia'}</button></div>`).join('');}
$('#stok').onclick=e=>{const id=e.target.dataset.h;if(id)run(e.target,async()=>{await api('markHabis',{id,habis:e.target.dataset.v==='1'});await boot();renderStok();});};

// tutup kasir
$('#bTutup').onclick=e=>run(e.target,async()=>{const r=await api('closeShift');
  $('#ringkas').innerHTML=`<div class="row"><span>Jumlah transaksi</span><b>${r.transaksi}</b></div><div class="row"><span>Total penjualan</span><b>${rp(r.total)}</b></div><div class="row"><span>Pembatalan</span><b>${r.pembatalan}</b></div><div class="row"><span>Input manual</span><b>${r.manual}</b></div>`;});
}
