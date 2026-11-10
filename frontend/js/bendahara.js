if(guard('bendahara')){
const S={cfg:{},dep:null,kor:null,owed:[],csv:''};
const D=()=>new Date().toLocaleDateString('sv-SE');
const ago=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.toLocaleDateString('sv-SE');};
const fn=n=>Number(n).toLocaleString('id-ID');
api('init').then(d=>{S.cfg=d.cfg;applyTheme(d.cfg);$('#hdrName').textContent='Bendahara · '+(d.cfg.nama_kantin||'');}).catch(e=>toast(e.message,1));
$('#pd').value=D().slice(0,8)+'01';$('#ps').value=D();$('#rt').value=D();$('#ld').value=D();$('#ls').value=D();

$('#tabs').onclick=e=>{const t=e.target.dataset.t;if(!t)return;document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b===e.target));
  ['dep','kor','pem','kas'].forEach(x=>$('#t-'+x).classList.toggle('hide',x!==t));};

// pemilih pelanggan: scan kartu atau cari nama
function picker(box,cb){
  box.innerHTML='<input type="text" class="ps" placeholder="Scan kartu di sini…" autocomplete="off" inputmode="none"><input type="search" class="pq" placeholder="atau cari nama / nomor induk" style="margin-top:6px"><div class="ph"></div>';
  const ps=box.querySelector('.ps'),pq=box.querySelector('.pq'),ph=box.querySelector('.ph');let tm;
  ps.addEventListener('keydown',e=>{if(e.key!=='Enter')return;e.preventDefault();const v=ps.value.trim();ps.value='';if(v)run(null,async()=>cb(await api('lookup',{kode:v})));});
  pq.oninput=()=>{clearTimeout(tm);tm=setTimeout(()=>run(null,async()=>{const r=await api('search',{q:pq.value});
    ph.innerHTML=r.map(u=>`<div class="row"><span>${esc(u.nama)} <small class="mu">${esc(u.kelas)} · ${esc(u.nomorInduk)}</small></span><button class="btn sm" data-u="${esc(u.id)}">Pilih</button></div>`).join('');}),350);};
  ph.onclick=e=>{const id=e.target.dataset.u;if(id)run(e.target,async()=>{ph.innerHTML='';pq.value='';cb(await api('lookup',{customerId:id}));});};
}
const info=c=>`<div class="big">${esc(c.nama)}</div><div>Kelas: <b>${esc(c.kelas||'-')}</b></div><div>Saldo saat ini: <span class="big">${rp(c.saldo)}</span></div>`;

// ===== deposit =====
picker($('#pk-dep'),c=>{S.dep=c;$('#depInfo').innerHTML=info(c);$('#dep').classList.remove('hide');$('#depN').value='';$('#depN').focus();});
$('#chips').innerHTML=[5000,10000,20000,50000].map(n=>`<button class="btn alt sm" data-n="${n}">${rp(n)}</button>`).join('');
$('#chips').onclick=e=>{if(e.target.dataset.n)$('#depN').value=e.target.dataset.n;};
let _pg=null;
function cetak(html,wide,csv){$('#struk').innerHTML=html;$('#struk').className=wide?'wide':'';$('#dStruk').className=wide?'w':'';
  $('#pg').textContent=wide?'@page{size:A4;margin:12mm}':'@page{size:58mm auto;margin:2mm}';
  $('#bCsv').style.display=csv?'block':'none';S.csv=csv||'';$('#dStruk').showModal();}
$('#bCetak').onclick=()=>window.print();$('#bTutupS').onclick=()=>$('#dStruk').close();
$('#bCsv').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([S.csv],{type:'text/csv'}));a.download='laporan-kantin.csv';a.click();};
const head=()=>`<div style="text-align:center"><b>${esc(S.cfg.nama_sekolah||'')}</b><br>${esc(S.cfg.nama_kantin||'')}</div><hr>`;
$('#bDep').onclick=e=>run(e.target,async()=>{
  const n=Number($('#depN').value);if(!(n>0))throw new Error('Isi nominal deposit');
  if(n>=500000&&!confirm('Nominal besar: '+rp(n)+'. Lanjutkan?'))return;
  const r=await api('deposit',{customerId:S.dep.id,nominal:n});
  cetak(head()+`<b>BUKTI DEPOSIT</b><br>${esc(r.waktu)}<br>No: ${esc(r.id)}<br>${esc(r.nama)} (${esc(r.kelas||'-')})<hr><div class="r"><span>Deposit</span><b>${fn(r.nominal)}</b></div><div class="r"><span>Saldo sekarang</span><b>${fn(r.saldo)}</b></div><hr><div style="text-align:center">Simpan bukti ini</div>`);
  $('#dep').classList.add('hide');S.dep=null;toast('Deposit tersimpan');});

// ===== koreksi / refund =====
picker($('#pk-kor'),c=>{S.kor=c;$('#korInfo').innerHTML=info(c);$('#kor').classList.remove('hide');});
$('#korJ').onchange=()=>$('#korA').classList.toggle('hide',$('#korJ').value==='refund');
$('#bKor').onclick=e=>run(e.target,async()=>{
  const n=Number($('#korN').value),alasan=$('#korR').value.trim();if(!(n>0))throw new Error('Isi nominal');if(!alasan)throw new Error('Alasan wajib diisi');
  if($('#korJ').value==='refund'){if(!confirm('Serahkan uang tunai '+rp(n)+' kepada pemilik saldo?'))return;
    const r=await api('refundCash',{idPengguna:S.kor.id,nominal:n,alasan});toast('Refund dicatat. Saldo: '+rp(r.saldo));}
  else{const r=await api('koreksi',{idPengguna:S.kor.id,nominal:n*Number($('#korA').value),alasan});toast(r.status);}
  $('#kor').classList.add('hide');$('#korN').value='';$('#korR').value='';S.kor=null;});

// ===== pembayaran pemasok & penyerahan Kopsis =====
$('#bHit').onclick=e=>run(e.target,hitung);
async function hitung(){const dari=$('#pd').value,sampai=$('#ps').value;if(!dari||!sampai)throw new Error('Pilih periode');
  S.owed=await api('owed',{dari,sampai});renderPem();}
function renderPem(){
  $('#pemList').innerHTML=S.owed.map((o,i)=>`<div class="card" style="margin-top:8px"><b>${esc(o.nama)}</b>
   <div class="row"><span>Terjual (harga titip)</span><span>${rp(o.terjual)}</span></div><div class="row"><span>Hilang/rusak ditanggung Kopsis</span><span>${rp(o.ditanggung)}</span></div>
   <div class="row"><span>Koreksi retur barang terjual</span><span>− ${rp(o.koreksi)}</span></div><div class="row"><span>Sudah dibayar</span><span>− ${rp(o.dibayar)}</span></div>
   <div class="row"><b>Kewajiban</b><span class="big">${rp(o.kewajiban)}</span></div>
   <details><summary>Rincian per barang</summary>${o.rincian.map(r=>`<div class="row"><span>${esc(r.nama)} × ${r.jumlah}</span><span>${rp(r.nilai)}</span></div>`).join('')}</details>
   ${o.kewajiban>0?`<input type="number" id="pn${i}" inputmode="numeric" value="${o.kewajiban}" style="margin-top:6px"><input type="text" id="pc${i}" placeholder="Catatan (opsional)" style="margin-top:6px"><button class="btn" data-pay="${i}" style="margin-top:6px">Catat pembayaran</button>`:'<span class="tag">Lunas</span>'}
   <button class="btn alt sm" data-rek="${i}" style="margin-top:6px">Cetak rincian</button></div>`).join('')||'<p class="mu">Belum ada penjualan pada periode ini</p>';
  const u=S.owed.reduce((a,o)=>a+o.untung,0),belum=S.owed.some(o=>o.kewajiban>0);
  $('#serah').innerHTML=S.owed.length?`<div class="card" style="margin-top:10px"><h3 style="margin-top:0">Serahkan bagian Kopsis</h3><div class="row"><span>Keuntungan periode ini</span><b>${rp(u)}</b></div>${belum?'<div class="warn">Bayar semua kewajiban pemasok dulu sebelum menyerahkan bagian Kopsis.</div>':''}
   <input type="text" id="sp" placeholder="Nama penerima di Kopsis"><input type="number" id="sn" inputmode="numeric" value="${Math.max(0,u)}" style="margin-top:6px"><input type="text" id="sc" placeholder="Catatan (opsional)" style="margin-top:6px"><button class="btn" id="bSerah" style="margin-top:6px">Catat penyerahan</button></div>`:'';}
$('#pemList').onclick=e=>{const d=e.target.dataset;
  if(d.pay!==undefined)run(e.target,async()=>{const o=S.owed[d.pay],n=Number($('#pn'+d.pay).value);
    if(!confirm('Catat pembayaran '+rp(n)+' ke '+o.nama+'?'))return;
    const r=await api('payPemasok',{idPemasok:o.idPemasok,dari:$('#pd').value,sampai:$('#ps').value,nominal:n,catatan:$('#pc'+d.pay).value});
    cetak(head()+`<b>BUKTI PEMBAYARAN PEMASOK</b><br>${D()}<br>${esc(o.nama)}<br>Periode ${esc($('#pd').value)} s/d ${esc($('#ps').value)}<hr><div class="r"><span>Dibayar</span><b>${fn(n)}</b></div><div class="r"><span>Sisa kewajiban</span><span>${fn(r.sisa)}</span></div><hr>Penerima: ________`);
    await hitung();});
  if(d.rek!==undefined){const o=S.owed[d.rek];
    cetak(`<h3>Rekap ${esc(o.nama)}</h3><p>Periode ${esc($('#pd').value)} s/d ${esc($('#ps').value)}</p><table><tr><th>Barang</th><th class="n">Jumlah</th><th class="n">Nilai</th></tr>${o.rincian.map(r=>`<tr><td>${esc(r.nama)}</td><td class="n">${r.jumlah}</td><td class="n">${fn(r.nilai)}</td></tr>`).join('')}</table><p>Terjual ${fn(o.terjual)} + ditanggung Kopsis ${fn(o.ditanggung)} − koreksi ${fn(o.koreksi)} − dibayar ${fn(o.dibayar)}</p><h3>Kewajiban: ${rp(o.kewajiban)}</h3>`,true);}};
$('#serah').onclick=e=>{if(e.target.id==='bSerah')run(e.target,async()=>{const n=Number($('#sn').value);if(!confirm('Catat penyerahan '+rp(n)+' ke Kopsis?'))return;
  await api('handover',{dari:$('#pd').value,sampai:$('#ps').value,nominal:n,penerima:$('#sp').value,catatan:$('#sc').value});toast('Penyerahan dicatat');});};

// ===== rekonsiliasi =====
$('#bRec').onclick=e=>run(e.target,async()=>{const r=await api('saveRecon',{tanggal:$('#rt').value,tunai:Number($('#rn').value),catatan:$('#rc').value});
  $('#recRes').innerHTML=`<div class="${r.selisih?'warn':'cust'}"><div class="row"><span>Deposit tercatat</span><b>${rp(r.totalDeposit)}</b></div><div class="row"><span>Tunai diterima</span><b>${rp(r.tunai)}</b></div><div class="row"><span>Selisih</span><b>${rp(r.selisih)}</b></div></div>`;});

// ===== laporan & pemeriksaan kas =====
document.querySelector('#t-kas .chips').onclick=e=>{const p=e.target.dataset.p;if(!p)return;$('#ls').value=D();$('#ld').value=p==='h'?D():p==='m'?ago(6):D().slice(0,8)+'01';};
$('#bLap').onclick=e=>run(e.target,async()=>{
  const dari=$('#ld').value,sampai=$('#ls').value;
  const [ow,k]=await Promise.all([api('owed',{dari,sampai}),api('cashCheck')]);
  const sum=f=>ow.reduce((a,o)=>a+o[f],0);
  const kas=[['Total deposit',k.deposit],['Refund tunai',k.refundTunai],['Pembayaran pemasok (semua)',k.bayar],['Penyerahan ke Kopsis (semua)',k.serah],['Kas seharusnya di bendahara',k.kasSeharusnya],['Saldo siswa beredar',k.saldoBeredar],['Penjualan terhitung',k.penjualanTerhitung],['Dana tertahan (pre-order belum selesai)',k.danaTertahan],['Koreksi saldo bersih (tanpa tunai)',k.koreksiBersih],['Selisih aktual (kas − saldo beredar)',k.selisihAktual],['Selisih seharusnya',k.selisihSeharusnya]];
  const html=`<h3>Laporan Keuangan ${esc(dari)} s/d ${esc(sampai)}</h3><p>${esc(S.cfg.nama_sekolah||'')} · ${esc(S.cfg.nama_kantin||'')}</p>
   <h4>Penjualan &amp; tagihan pemasok (periode)</h4><div class="wrap"><table><tr><th>Pemasok</th><th class="n">Terjual</th><th class="n">Ditanggung</th><th class="n">Koreksi</th><th class="n">Dibayar</th><th class="n">Kewajiban</th><th class="n">Untung Kopsis</th></tr>
   ${ow.map(o=>`<tr><td>${esc(o.nama)}</td><td class="n">${fn(o.terjual)}</td><td class="n">${fn(o.ditanggung)}</td><td class="n">${fn(o.koreksi)}</td><td class="n">${fn(o.dibayar)}</td><td class="n">${fn(o.kewajiban)}</td><td class="n">${fn(o.untung)}</td></tr>`).join('')}
   <tr><th>Total</th><th class="n">${fn(sum('terjual'))}</th><th class="n">${fn(sum('ditanggung'))}</th><th class="n">${fn(sum('koreksi'))}</th><th class="n">${fn(sum('dibayar'))}</th><th class="n">${fn(sum('kewajiban'))}</th><th class="n">${fn(sum('untung'))}</th></tr></table></div>
   <h4>Posisi kas (kumulatif sejak awal)</h4><div class="wrap"><table>${kas.map(r=>`<tr><td>${r[0]}</td><td class="n">${fn(r[1])}</td></tr>`).join('')}</table></div>
   <p>${k.cocok?'✔ Kas cocok dengan saldo siswa.':'⚠ Kas TIDAK cocok. Periksa koreksi, refund, dan rekonsiliasi.'}</p>`;
  $('#lap').innerHTML=(k.cocok?'':'<div class="warn">⚠ Kas tidak cocok dengan saldo siswa. Selisih: '+rp(k.selisihAktual-k.selisihSeharusnya)+'</div>')+`<div class="row"><button class="btn sm" id="bLapCetak">Cetak / PDF</button></div><div class="wrap">${html}</div>`;
  const csv=['Pemasok,Terjual,Ditanggung,Koreksi,Dibayar,Kewajiban,Untung Kopsis'].concat(ow.map(o=>[o.nama,o.terjual,o.ditanggung,o.koreksi,o.dibayar,o.kewajiban,o.untung].map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(','))).concat(kas.map(r=>'"'+r[0]+'",'+r[1])).join('\n');
  S.rep={html,csv};});
$('#lap').onclick=e=>{if(e.target.id==='bLapCetak'&&S.rep)cetak(S.rep.html,true,S.rep.csv);};
$('#bLed').onclick=e=>run(e.target,async()=>{const r=await api('verifyLedger');
  $('#ledRes').innerHTML=r.length?`<div class="warn">${r.length} akun tidak cocok:</div>`+r.map(x=>`<div class="row"><span>${esc(x.nama)}</span><span>saldo ${rp(x.saldo)} / ledger ${rp(x.ledger)}</span></div>`).join(''):'<div class="cust">✔ Semua saldo sama dengan jumlah ledger.</div>';});
}
