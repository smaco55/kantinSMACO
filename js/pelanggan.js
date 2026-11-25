if(guard('pelanggan')){
const S={cat:[],cfg:{},libur:[],saldo:0,cart:{},date:'',kat:'Semua',tab:'pesan',h:{page:0,rows:[]}};
const find=id=>S.cat.find(x=>x.id===id),today=()=>new Date().toLocaleDateString('sv-SE'),hm=()=>new Date().toTimeString().slice(0,5);
const total=()=>Object.keys(S.cart).reduce((a,id)=>a+S.cart[id]*find(id).harga,0),count=()=>Object.values(S.cart).reduce((a,b)=>a+b,0);
const pinWarn=()=>{$('#pinW').innerHTML=S.pinDefault?'<div class="warn"><b>PIN kamu masih 123456.</b> Segera ganti agar saldo aman jika kartu hilang atau dipinjam.</div>':'';};
const setSaldo=n=>{S.saldo=n;$('#saldoH').textContent=rp(n);$('#saldoB').textContent=rp(n);
  $('#saldoW').innerHTML=n<Number(S.cfg.saldo_menipis||0)?'<div class="warn">Saldo menipis. Segera isi saldo ke bendahara.</div>':'';};

async function boot(){const d=await api('init');S.cat=d.katalog;S.cfg=d.cfg;S.libur=d.libur;applyTheme(d.cfg);setSaldo(d.profil.saldo);S.pinDefault=d.profil.pinDefault;pinWarn();
  const ds=dates();const ok=ds.find(x=>!x.note);S.date=ok?ok.s:'';
  $('#info').innerHTML=d.cfg.preorder_aktif!=='Ya'?'<div class="warn">Pre-order sedang dimatikan. Silakan beli langsung di kasir.</div>':`<div class="mu">${Number(d.cfg.preorder_h_minus)>0?'Pemesanan ditutup <b>'+(Number(d.cfg.preorder_h_minus)===1?'sehari sebelum':d.cfg.preorder_h_minus+' hari sebelum')+'</b> tanggal ambil, pukul '+esc(d.cfg.jam_batas_preorder)+'.':'Pemesanan untuk hari ini ditutup pukul '+esc(d.cfg.jam_batas_preorder)+'. Pesan sehari sebelumnya juga bisa.'}</div>`;
  renderDates();renderCats();renderGrid();}
boot().catch(e=>toast(e.message,1));

$('#tabs').onclick=e=>{const t=e.target.dataset.t;if(!t)return;S.tab=t;document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b===e.target));
  ['pesan','pes','saldo'].forEach(x=>$('#t-'+x).classList.toggle('hide',x!==t));$('#bar').classList.toggle('hide',t!=='pesan'||!count());
  if(t==='pes')loadHist(true);if(t==='saldo')loadDep();};

// ----- pilih tanggal ambil -----
const addD=(s,n)=>{const d=new Date(s+'T00:00:00');d.setDate(d.getDate()+n);return d.toLocaleDateString('sv-SE');};
function dates(){const out=[],now=new Date();
  for(let i=0;i<7;i++){const d=new Date(now);d.setDate(d.getDate()+i);const s=d.toLocaleDateString('sv-SE');
    const lib=S.libur.find(l=>String(l.Tanggal).slice(0,10)===s&&l.TutupPreorder!=='Tidak');
    const hmin=Math.max(0,Number(S.cfg.preorder_h_minus)||0),dl=addD(s,-hmin)+' '+String(S.cfg.jam_batas_preorder||'09:00');
    let note='';if(lib)note=lib.Keterangan||'Tutup';else if(new Date().toLocaleDateString('sv-SE')+' '+hm()>dl)note='Pemesanan ditutup';
    if(S.cfg.preorder_aktif!=='Ya')note='Pre-order mati';
    out.push({s,note,label:i===0?'Hari ini':i===1?'Besok':d.toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short'})});}
  return out;}
function renderDates(){$('#dates').innerHTML=dates().map(d=>`<button data-d="${d.s}" class="${d.s===S.date?'on':''}" ${d.note?'disabled title="'+esc(d.note)+'"':''}>${esc(d.label)}${d.note?'<br><small>'+esc(d.note)+'</small>':''}</button>`).join('');}
$('#dates').onclick=e=>{const d=e.target.closest('button');if(!d||d.disabled)return;S.date=d.dataset.d;S.cart={};renderDates();renderGrid();updBar();};

// ----- katalog -----
const shown=()=>S.cat.filter(b=>b.jenis==='Pesan'?b.tersedia:(S.date===today()?b.tersedia:b.stok>0));
function renderCats(){const ks=['Semua'].concat([...new Set(S.cat.map(b=>b.kat).filter(Boolean))]);$('#cats').innerHTML=ks.map(k=>`<button data-k="${esc(k)}" class="${k===S.kat?'on':''}">${esc(k)}</button>`).join('');}
function renderGrid(){const q=$('#cari').value.toLowerCase();
  if(!S.date){$('#grid').innerHTML='<p class="mu">Belum ada tanggal pengambilan yang tersedia.</p>';return;}
  const l=shown().filter(b=>(S.kat==='Semua'||b.kat===S.kat)&&b.nama.toLowerCase().includes(q));
  $('#grid').innerHTML=l.map(b=>{const n=S.cart[b.id]||0;return `<div class="item">${b.foto?`<img class="hide" data-f="${esc(b.id)}" data-k="${esc(b.foto)}" alt="" style="width:100%;height:70px;object-fit:cover;border-radius:2px;margin-bottom:4px">`:''}<b>${esc(b.nama)}</b><span>${rp(b.harga)}</span><br><small>${b.jenis==='Pesan'?'dibuat sesuai pesanan'+(b.kuota?' · maks '+b.kuota:''):'sisa '+b.stok}</small>${n?`<div class="qn"><button data-a="-1" data-i="${esc(b.id)}">−</button><b>${n}</b><button data-a="1" data-i="${esc(b.id)}">+</button></div>`:`<div class="qn"><button class="btn sm" style="width:100%" data-a="1" data-i="${esc(b.id)}">Tambah</button></div>`}</div>`;}).join('')||'<p class="mu">Tidak ada barang yang tersedia untuk tanggal ini.</p>';lazyFoto();}
$('#cari').oninput=renderGrid;
const io='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);loadFoto(e.target);}}),{rootMargin:'120px'}):null;
const fq=[];let fr=0;
function loadFoto(img){const c=localStorage.getItem('fb_'+img.dataset.k);if(c){img.src=c;img.classList.remove('hide');return;}fq.push(img);pump();}
function pump(){while(fr<2&&fq.length){const img=fq.shift();fr++;api('fotoGet',{tipe:'barang',id:img.dataset.f}).then(r=>{if(r.data){try{localStorage.setItem('fb_'+img.dataset.k,r.data);}catch(e){}img.src=r.data;img.classList.remove('hide');}}).catch(()=>{}).finally(()=>{fr--;pump();});}}
function lazyFoto(){document.querySelectorAll('#grid img[data-f]').forEach(i=>io?io.observe(i):loadFoto(i));}
$('#cats').onclick=e=>{const k=e.target.dataset.k;if(k){S.kat=k;renderCats();renderGrid();}};
$('#grid').onclick=e=>{const i=e.target.dataset.i;if(i)chg(i,Number(e.target.dataset.a));};
function chg(id,d){const b=find(id),n=(S.cart[id]||0)+d;if(n<=0)delete S.cart[id];else if(n>b.stok){toast('Stok '+b.nama+' hanya '+b.stok,1);return;}else S.cart[id]=n;renderGrid();if($('#dC').open)renderCart();updBar();}
function updBar(){const n=count();$('#bar').classList.toggle('hide',!n||S.tab!=='pesan');$('#bCart').textContent=n?`Lihat pesanan · ${n} item · ${rp(total())}`:'';}

// ----- keranjang & pesan -----
function renderCart(){const ids=Object.keys(S.cart);
  $('#cl').innerHTML=ids.map(id=>{const b=find(id),q=S.cart[id];return `<div class="row"><span>${esc(b.nama)}<br><small class="mu">${rp(b.harga)} × ${q} = ${rp(b.harga*q)}</small></span><span class="qn"><button data-a="-1" data-i="${esc(id)}">−</button><b>${q}</b><button data-a="1" data-i="${esc(id)}">+</button><button data-a="-999" data-i="${esc(id)}">✕</button></span></div>`;}).join('')||'<p class="mu">Keranjang kosong</p>';
  const t=total(),kurang=t>S.saldo;$('#ct').textContent=rp(t);$('#cs').innerHTML=`Ambil: <b>${esc(S.date)}</b> · Saldo: ${rp(S.saldo)}${kurang?'<div class="warn">Saldo tidak cukup. Kurangi pesanan atau isi saldo.</div>':''}`;
  $('#bOk').disabled=!ids.length||kurang;if(!ids.length&&$('#dC').open)$('#dC').close();}
$('#bCart').onclick=()=>{renderCart();$('#pinO').value='';$('#pinO').closest('dialog').querySelector('#pinO').style.display=S.cfg.pin_pesan_wajib==='Tidak'?'none':'';$('#dC').showModal();};
$('#pinO').addEventListener('input',e=>e.target.value=e.target.value.replace(/\D/g,'').slice(0,6));$('#bBack').onclick=()=>$('#dC').close();
$('#cl').onclick=e=>{const i=e.target.dataset.i;if(i)chg(i,Number(e.target.dataset.a));};
$('#bOk').onclick=e=>run(e.target,async()=>{
  const items=Object.keys(S.cart).map(id=>({id,qty:S.cart[id]}));
  S.rid=S.rid||rid();
  if(S.cfg.pin_pesan_wajib!=='Tidak'&&!/^\d{6}$/.test($('#pinO').value))throw new Error('Masukkan PIN transaksi 6 angka');
  let r;try{r=await api('order',{items,tanggalAmbil:S.date,pin:$('#pinO').value,rid:S.rid});}catch(er){if(/PIN/.test(er.message))$('#pinO').value='';throw er;}S.rid=null;
  r.items.forEach(i=>{const b=S.cat.find(x=>x.nama===i.nama);if(b&&b.jenis!=='Pesan'){b.stok-=i.qty;if(b.stok<=0)b.tersedia=false;}});
  setSaldo(r.saldoSesudah);S.cart={};$('#dC').close();renderGrid();updBar();
  $('#dDb').innerHTML=`<div class="mu">Pesanan diterima</div><div class="ant">#${esc(r.antrean)}</div><div>Nomor antrean · ambil <b>${esc(r.tanggalAmbil)}</b></div><div class="warn" style="text-align:left">Tunjukkan nomor ini ke kasir saat mengambil. Pesanan yang tidak diambil tidak mendapat pengembalian saldo.</div>`+
   r.items.map(i=>`<div class="row"><span>${i.qty} × ${esc(i.nama)}</span><span>${rp(i.sub)}</span></div>`).join('')+`<div class="row"><b>Total</b><b>${rp(r.total)}</b></div><div class="mu">Sisa saldo ${rp(r.saldoSesudah)}</div>`;
  $('#dD').showModal();});
$('#bDone').onclick=()=>$('#dD').close();

// ----- pesananku -----
const act=s=>['Baru','Diproses','Siap'].includes(s);
async function loadHist(reset,more){if(reset&&!more)S.h.page=0;
  const hr=$('#hh').value==='30';
  const r=await api('myHistory',hr&&S.h.page===0?{page:0,size:20,hari:30,ringkas:1}:{page:S.h.page,size:20,hari:hr?30:0});
  if(r.ringkas)S.h.ring=r;S.h.rows=more?S.h.rows.concat(r.rows):(S.h.page===0?r.rows:S.h.rows);S.h.total=r.total;renderHist();}
function renderHist(){
  const g=S.h.ring;$('#ringk').innerHTML=g&&$('#hh').value==='30'?`<div class="card" style="margin-bottom:8px"><b>Belanja 30 hari terakhir: ${rp(g.belanja)}</b>${g.ringkas.length?`<table style="margin-top:6px"><tr><th>Barang</th><th class="n">Jumlah</th><th class="n">Nilai</th></tr>${g.ringkas.slice(0,10).map(x=>`<tr><td>${esc(x.nama)}</td><td class="n">${x.jumlah}</td><td class="n">${rp(x.nilai)}</td></tr>`).join('')}</table>`:'<div class="mu">Belum ada belanja</div>'}</div>`:'';
  $('#pesL').innerHTML=S.h.rows.map(o=>`<div class="card ${o.status==='Siap'?'siap':''}" style="margin-bottom:8px"><div class="row" style="border:0"><span>${o.jenis==='preorder'?`<span class="ant">#${esc(o.antrean)}</span>`:'<span class="tag">Beli langsung</span>'}</span><span class="tag">${o.status==='Siap'?'Siap diambil!':esc(o.status)}</span></div>
  <div class="mu">${esc(o.waktu)}${o.jenis==='preorder'?' · ambil '+esc(o.ambil):''}</div>${o.items.map(i=>`<div>${i.qty} × ${esc(i.nama)}</div>`).join('')}<div class="row"><b>${rp(o.total)}</b>${o.refund?`<span class="mu">dikembalikan ${rp(o.refund)}</span>`:''}</div>
  ${o.jenis==='preorder'&&o.status==='Baru'?`<button class="btn sm red" data-c="${esc(o.id)}">Batalkan pesanan</button>`:''}</div>`).join('')||'<p class="mu">Belum ada pesanan</p>';
  $('#pesMore').classList.toggle('hide',S.h.rows.length>=S.h.total);}
$('#pesMore').onclick=e=>run(e.target,async()=>{S.h.page++;await loadHist(false,true);});
$('#pesL').onclick=e=>{const id=e.target.dataset.c;if(id&&confirm('Batalkan pesanan ini? Saldo dikembalikan penuh.'))run(e.target,async()=>{const r=await api('cancel',{id});setSaldo(S.saldo+r.refund);toast('Dibatalkan. Saldo dikembalikan '+rp(r.refund));S.cat=(await api('init')).katalog;loadHist(true);});};
$('#bPk').onclick=e=>run(e.target,async()=>{const b=$('#pkB').value;if(!/^\d{6}$/.test(b))throw new Error('PIN baru harus 6 angka');if(b!==$('#pkU').value)throw new Error('Ulangi PIN tidak sama');
  await api('changePinKartu',{lama:$('#pkL').value,baru:b});['pkL','pkB','pkU'].forEach(i=>$('#'+i).value='');S.pinDefault=false;pinWarn();toast('PIN berhasil diganti');});
$('#hh').onchange=()=>loadHist(true);
poll(()=>loadHist(true),15000,()=>S.tab==='pes'&&S.h.page===0&&S.h.rows.some(o=>act(o.status))); // berhenti jika tab tidak terlihat atau tak ada pesanan aktif

// ----- saldo -----
async function loadDep(){const r=await api('myDeposits',{page:0,size:20});$('#depL').innerHTML=r.rows.map(d=>`<div class="row"><span>${esc(d.waktu)}</span><b>+ ${rp(d.nominal)}</b></div>`).join('')||'<p class="mu">Belum ada deposit</p>';}
}
