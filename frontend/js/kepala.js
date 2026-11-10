if(guard('kepala')){
const S={cfg:{},u:{page:0,total:0},logPage:0,logo:null,csv:'',pins:[],imp:[]};
const D=()=>new Date().toLocaleDateString('sv-SE');
const ago=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.toLocaleDateString('sv-SE');};
const fn=n=>Number(n).toLocaleString('id-ID');
const tbl=(h,rows)=>`<table><tr>${h.map(x=>`<th class="${x[1]||''}">${x[0]}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map((c,i)=>`<td class="${h[i][1]||''}">${c}</td>`).join('')}</tr>`).join('')}</table>`;
const csvq=v=>'"'+String(v).replace(/"/g,'""')+'"';
const dl=(name,txt)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/csv'}));a.download=name;a.click();};
$('#ld').value=D();$('#ls').value=D();

$('#tabs').onclick=e=>{const t=e.target.dataset.t;if(!t)return;document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b===e.target));
  ['dash','akun','lap','set','log'].forEach(x=>$('#t-'+x).classList.toggle('hide',x!==t));
  if(t==='dash')dash();if(t==='akun'&&!$('#ul').innerHTML)users();if(t==='log'&&!$('#logT').innerHTML){S.logPage=0;logs(true);}};
async function boot(){const d=await api('init');S.cfg=d.cfgLengkap;applyTheme(d.cfg);$('#hdrName').textContent='Kepala · '+(d.cfg.nama_kantin||'');setForm();dash();}
boot().catch(e=>toast(e.message,1));

// ===== dasbor + persetujuan koreksi =====
async function dash(){const [d,k,a]=await Promise.all([api('dash'),api('koreksiList'),api('anomaly',{})]);
  const kp=(l,v,w)=>`<div class="card" ${w?'style="border-color:var(--er)"':''}><div class="mu">${l}</div><div class="big">${v}</div></div>`;
  $('#kp').innerHTML=kp('Penjualan hari ini',rp(d.penjualanHariIni))+kp('Saldo beredar',rp(d.saldoBeredar))+kp('Stok menipis',d.stokMenipis,d.stokMenipis>0)+kp('Kewajiban pemasok (bulan ini)',rp(d.kewajibanPemasok))+kp('Kas vs saldo',d.kasCocok?'Cocok ✔':'Selisih '+rp(d.selisihKas),!d.kasCocok)+kp('Input manual hari ini',d.manualHariIni);
  $('#kor').innerHTML=k.length?`<h3>Koreksi saldo menunggu persetujuan (${k.length})</h3>`+k.map(x=>`<div class="card" style="margin-bottom:6px"><b>${esc(x.nama)}</b> · tambah ${rp(x.nominal)}<div class="mu">${esc(x.alasan)} — diajukan ${esc(x.pengaju)}, ${esc(x.waktu)}</div><button class="btn sm" data-k="${esc(x.id)}" data-v="1">Setujui</button> <button class="btn sm red" data-k="${esc(x.id)}" data-v="0">Tolak</button></div>`).join(''):'';
  $('#ano').innerHTML=a.length?tbl([['Kasir'],['Transaksi','n'],['Manual','n'],['Batal','n'],['Susulan','n']],a.map(x=>[esc(x.kasir),x.transaksi,x.manual,x.batal,x.susulan])):'<span class="mu">Belum ada data</span>';}
$('#kor').onclick=e=>{const d=e.target.dataset;if(d.k)run(e.target,async()=>{await api('approveKoreksi',{id:d.k,setuju:d.v==='1'});toast(d.v==='1'?'Disetujui':'Ditolak');dash();});};

// ===== akun =====
async function users(){const r=await api('userList',{q:$('#uq').value,peran:$('#up').value,status:$('#us').value,page:S.u.page,size:30});S.u.total=r.total;S.users=r.rows;
  $('#ul').innerHTML=r.rows.map(u=>`<div class="card" style="margin-top:6px" data-u="${esc(u.id)}"><b>${esc(u.nama)}</b> <span class="tag">${esc(u.peran)}</span> ${u.status!=='Aktif'?`<span class="tag" style="background:#fde8e8">${esc(u.status)}</span>`:''}${u.gagal>=5?' <span class="tag" style="background:#fde8e8">terkunci</span>':''}<div class="mu">${esc(u.nomorInduk)} · ${esc(u.kelas||'-')} · saldo ${rp(u.saldo)}</div></div>`).join('')||'<p class="mu">Tidak ada akun</p>';
  $('#uPg').textContent=(S.u.page*30+1)+'–'+Math.min(S.u.total,S.u.page*30+30)+' dari '+S.u.total;}
let tq;['uq'].forEach(i=>$('#'+i).oninput=()=>{clearTimeout(tq);tq=setTimeout(()=>{S.u.page=0;users();},350);});$('#up').onchange=$('#us').onchange=()=>{S.u.page=0;users();};
$('#uPrev').onclick=()=>{if(S.u.page>0){S.u.page--;users();}};$('#uNext').onclick=()=>{if((S.u.page+1)*30<S.u.total){S.u.page++;users();}};
$('#ul').onclick=e=>{const c=e.target.closest('[data-u]');if(c)openU(S.users.find(x=>x.id===c.dataset.u));};
async function openU(u){const d=await api('userDetail',{id:u.id});S.cur=u;
  $('#dUb').innerHTML=`<h3 style="margin-top:0">${esc(u.nama)}</h3><div class="mu">${esc(u.peran)} · ${esc(u.nomorInduk)} · kelas ${esc(u.kelas||'-')} · ${esc(u.status)}</div><div>Saldo: <b>${rp(u.saldo)}</b></div>
   ${d.wali.length?`<div>Wali: ${d.wali.map(esc).join(', ')}</div>`:''}${d.anak.length?`<div>Anak: ${d.anak.map(esc).join(', ')}</div>`:''}
   <h3>Kartu</h3>${d.kartu.map(k=>`<div class="row"><span>${esc(k.kode)} <small class="mu">${esc(k.jenis)} · ${esc(k.status)}</small></span>${k.status==='Aktif'?`<button class="btn sm red" data-nk="${esc(k.kode)}">Nonaktifkan</button>`:''}</div>`).join('')||'<span class="mu">Belum ada kartu</span>'}
   <div class="row" style="border:0"><input type="text" id="kk" placeholder="Kode kartu baru" style="width:60%"><select id="kj" style="width:38%"><option value="barcode">barcode</option><option value="RFID">RFID</option></select></div><button class="btn sm" data-a="kartuBaru">Daftarkan kartu</button>
   ${S.cfg.foto_siswa_aktif==='Ya'&&(u.peran==='siswa'||u.peran==='guru')?`<h3>Foto</h3><img id="uf" class="hide" alt="" style="width:110px;height:110px;object-fit:cover;border-radius:2px;display:block;margin-bottom:6px"><input type="file" id="uff" accept="image/*">`:''}
   <h3>Tindakan</h3><input type="text" id="kpw" placeholder="Password baru (kosongkan = dibuat acak)" style="margin-bottom:6px"><button class="btn sm alt" data-a="resetPassword">Reset password</button> <button class="btn sm alt" data-a="buka">Buka kunci</button> <button class="btn sm ${u.status==='Aktif'?'red':'alt'}" data-a="${u.status==='Aktif'?'nonaktif':'aktif'}">${u.status==='Aktif'?'Nonaktifkan akun':'Aktifkan akun'}</button>
   ${u.peran==='siswa'?`<h3>Batas jajan harian (0 = ikut sekolah)</h3><div class="row" style="border:0"><input type="number" id="kb" value="${u.batas}" style="width:60%"><button class="btn sm" data-a="batasJajan">Simpan</button></div>`:''}
   ${u.peran==='wali'?`<h3>Email wali</h3><div class="row" style="border:0"><input type="text" id="ke" value="${esc(d.email)}" placeholder="email@contoh.com" style="width:65%"><button class="btn sm" data-a="email">Simpan</button></div><h3>Kaitkan anak</h3><input type="search" id="kw" placeholder="Cari nama anak"><div id="kwr"></div>`:''}<div id="uRes"></div>`;
  if(d.foto&&$('#uf'))api('fotoGet',{tipe:'siswa',id:u.id}).then(r=>{if(r.data){$('#uf').src=r.data;$('#uf').classList.remove('hide');}}).catch(()=>{});
  $('#dU').showModal();}
document.addEventListener('change',async e=>{if(e.target.id!=='uff'||!e.target.files[0])return;
  try{const data=await compressImg(e.target.files[0],240,70*1024);await api('fotoSet',{tipe:'siswa',id:S.cur.id,data});$('#uf').src=data;$('#uf').classList.remove('hide');toast('Foto tersimpan');}catch(err){toast(err.message,1);}});
$('#dUx').onclick=()=>{$('#dU').close();users();};
$('#dUb').onclick=e=>{const d=e.target.dataset,u=S.cur;
  if(d.nk)run(e.target,async()=>{if(!confirm('Nonaktifkan kartu ini?'))return;await api('userAdmin',{aksi:'nonaktifKartu',idPengguna:u.id,kode:d.nk});openU(u);});
  if(d.a)run(e.target,async()=>{
    if(d.a==='resetPassword'){const pw=($('#kpw').value||'').trim();if(!confirm('Reset password '+u.nama+(pw?' menjadi yang Anda ketik':' menjadi acak')+'? Pastikan identitas sudah diverifikasi.'))return;const r=await api('userAdmin',{aksi:'resetPassword',idPengguna:u.id,password:pw||undefined});$('#uRes').innerHTML=`<div class="cust">Username: <b>${esc(u.nomorInduk)}</b><br>Password baru: <span class="big">${esc(r.passwordBaru)}</span><br>${r.manual?'':'Pengguna diminta menggantinya saat login berikutnya. '}Sampaikan secara tertutup.</div>`;return;}
    if(d.a==='kartuBaru'){await api('userAdmin',{aksi:'kartuBaru',idPengguna:u.id,kode:$('#kk').value,jenis:$('#kj').value});openU(u);return;}
    if(d.a==='email'){await api('userAdmin',{aksi:'email',idPengguna:u.id,email:$('#ke').value});toast('Email tersimpan');return;}
    if(d.a==='batasJajan'){await api('userAdmin',{aksi:'batasJajan',idPengguna:u.id,nominal:$('#kb').value});toast('Tersimpan');return;}
    await api('userAdmin',{aksi:d.a,idPengguna:u.id});toast('Berhasil');$('#dU').close();users();});
  if(d.an)run(e.target,async()=>{await api('linkWali',{idWali:u.id,idAnak:d.an});toast('Terkaitkan');openU(u);});};
document.addEventListener('input',e=>{if(e.target.id!=='kw')return;clearTimeout(tq);tq=setTimeout(()=>run(null,async()=>{const r=await api('search',{q:e.target.value});
  $('#kwr').innerHTML=r.map(x=>`<div class="row"><span>${esc(x.nama)} <small class="mu">${esc(x.kelas)}</small></span><button class="btn sm" data-an="${esc(x.id)}">Kaitkan</button></div>`).join('');}),350);});

$('#bAdd').onclick=()=>{$('#aR').innerHTML='';$('#dA').showModal();};$('#aX').onclick=()=>{$('#dA').close();users();};
$('#aS').onclick=e=>run(e.target,async()=>{const r=await api('createUser',{nomorInduk:$('#an').value.trim(),nama:$('#am').value.trim(),peran:$('#ap').value,kelas:$('#ak').value,email:$('#ae').value,password:$('#aw').value||undefined,kartu:$('#ac').value.trim()||undefined});
  $('#aR').innerHTML=`<div class="cust">Akun dibuat.<br>Username: <b>${esc(r.nomorInduk)}</b><br>Password: <span class="big">${esc(r.passwordAwal)}</span><br>${r.manual?'':'Pengguna diminta mengganti saat login pertama. '}Sampaikan secara tertutup.</div>`;['an','am','ak','ae','ac','aw'].forEach(i=>$('#'+i).value='');});

// impor CSV (dikirim per 30 baris agar tidak melewati batas waktu Apps Script)
function parseCsv(t){return t.split(/\r?\n/).filter(l=>l.trim()).map(l=>{const o=[];let c='',q=false;for(const ch of l){if(ch==='"')q=!q;else if((ch===','||ch===';')&&!q){o.push(c.trim());c='';}else c+=ch;}o.push(c.trim());return o;});}
$('#bImp').onclick=()=>{$('#iP').textContent='';$('#iR').innerHTML='';$('#iS').disabled=true;$('#iDl').style.display='none';$('#iF').value='';$('#dI').showModal();};$('#iX').onclick=()=>{$('#dI').close();users();};
$('#iF').onchange=async e=>{const rows=parseCsv(await e.target.files[0].text());if(rows.length&&/nomor/i.test(rows[0][0]))rows.shift();
  S.imp=rows.filter(r=>r[0]&&r[1]).map(r=>({nomorInduk:r[0],nama:r[1],peran:(r[2]||'siswa').toLowerCase(),kelas:r[3]||'',email:r[4]||'',kartu:r[5]||undefined,password:r[6]||undefined}));
  $('#iP').textContent=S.imp.length+' baris siap diimpor';$('#iS').disabled=!S.imp.length;};
$('#iS').onclick=e=>run(e.target,async()=>{S.pins=[];const all=S.imp;
  for(let i=0;i<all.length;i+=30){$('#iP').textContent='Memproses '+Math.min(i+30,all.length)+' / '+all.length+'…';S.pins=S.pins.concat(await api('importUsers',{rows:all.slice(i,i+30)}));}
  const ok=S.pins.filter(x=>x.passwordAwal),bad=S.pins.filter(x=>x.error);$('#iP').textContent='Selesai: '+ok.length+' berhasil, '+bad.length+' gagal';
  $('#iR').innerHTML=bad.length?tbl([['Username'],['Kesalahan']],bad.map(x=>[esc(x.nomorInduk),esc(x.error)])):'';$('#iDl').style.display=ok.length?'block':'none';});
$('#iDl').onclick=()=>dl('password-awal.csv','username,passwordAwal\n'+S.pins.filter(x=>x.passwordAwal).map(x=>csvq(x.nomorInduk)+','+csvq(x.passwordAwal)).join('\n')+'\n');

// kenaikan kelas
$('#bNaik').onclick=()=>$('#dN').showModal();$('#nX').onclick=()=>$('#dN').close();
$('#nS').onclick=e=>run(e.target,async()=>{const map={};$('#nm').value.split('\n').forEach(l=>{const p=l.split('=');if(p.length===2&&p[0].trim())map[p[0].trim()]=p[1].trim();});
  const lulus=$('#nl').value.split(',').map(x=>x.trim()).filter(Boolean);if(!Object.keys(map).length&&!lulus.length)throw new Error('Isi pemetaan atau kelas lulus');
  if(!confirm('Jalankan kenaikan kelas untuk seluruh siswa? Tindakan ini tidak dapat dibatalkan massal.'))return;
  const r=await api('promote',{map,lulus});$('#dN').close();toast(r.naik+' naik kelas, '+r.lulus+' lulus');users();});

// ===== laporan =====
function cetak(html,csv){$('#struk').innerHTML=html;$('#struk').className='wide';$('#dStruk').className='w';S.csv=csv;$('#dStruk').showModal();}
$('#bCetak').onclick=()=>window.print();$('#bTutupS').onclick=()=>$('#dStruk').close();$('#bCsv').onclick=()=>dl('laporan-kepala.csv',S.csv);
document.querySelector('#t-lap .chips').onclick=e=>{const p=e.target.dataset.p;if(!p)return;$('#ls').value=D();$('#ld').value=p==='h'?D():p==='m'?ago(6):D().slice(0,8)+'01';};
$('#bLap').onclick=e=>run(e.target,async()=>{const dari=$('#ld').value,sampai=$('#ls').value;
  const [s,ow,k,a]=await Promise.all([api('salesReport',{dari,sampai}),api('owed',{dari,sampai}),api('cashCheck'),api('anomaly',{dari,sampai})]);
  const sum=f=>ow.reduce((x,o)=>x+o[f],0);
  const html=`<h3>Laporan ${esc(dari)} s/d ${esc(sampai)}</h3><div class="kp"><div class="card"><div class="mu">Penjualan</div><div class="big">${rp(s.penjualan)}</div></div><div class="card"><div class="mu">Keuntungan Kopsis</div><div class="big">${rp(s.untung)}</div></div><div class="card"><div class="mu">Deposit masuk</div><div class="big">${rp(s.deposit)}</div></div><div class="card"><div class="mu">Saldo beredar</div><div class="big">${rp(k.saldoBeredar)}</div></div></div>
   <h4>Penjualan harian</h4><div class="wrap">${tbl([['Tanggal'],['Transaksi','n'],['Total','n']],s.harian.map(x=>[esc(x.tgl),x.transaksi,fn(x.total)]))}</div>
   <h4>Barang terlaris</h4><div class="wrap">${tbl([['Barang'],['Jumlah','n'],['Nilai','n'],['Untung','n']],s.terlaris.map(x=>[esc(x.nama),x.jumlah,fn(x.nilai),fn(x.untung)]))}</div>
   <h4>Kewajiban &amp; pembayaran pemasok</h4><div class="wrap">${tbl([['Pemasok'],['Terjual','n'],['Dibayar','n'],['Kewajiban','n']],ow.map(o=>[esc(o.nama),fn(o.terjual),fn(o.dibayar),fn(o.kewajiban)]).concat([['<b>Total</b>',fn(sum('terjual')),fn(sum('dibayar')),fn(sum('kewajiban'))]]))}</div>
   <h4>Sisa stok (terendah dulu)</h4><div class="wrap">${tbl([['Barang'],['Stok','n']],s.stok.slice(0,15).map(x=>[esc(x.nama),x.stok]))}</div>
   <h4>Kejanggalan per kasir</h4><div class="wrap">${tbl([['Kasir'],['Transaksi','n'],['Manual','n'],['Batal','n']],a.map(x=>[esc(x.kasir),x.transaksi,x.manual,x.batal]))}</div>
   <p>${k.cocok?'✔ Kas cocok dengan saldo siswa.':'⚠ Kas tidak cocok. Selisih: '+rp(k.selisihAktual-k.selisihSeharusnya)}</p>`;
  const csv=['Tanggal,Transaksi,Total'].concat(s.harian.map(x=>[x.tgl,x.transaksi,x.total].join(','))).concat(['','Barang,Jumlah,Nilai,Untung']).concat(s.terlaris.map(x=>[csvq(x.nama),x.jumlah,x.nilai,x.untung].join(','))).concat(['','Pemasok,Terjual,Dibayar,Kewajiban']).concat(ow.map(o=>[csvq(o.nama),o.terjual,o.dibayar,o.kewajiban].join(','))).join('\n');
  $('#lap').innerHTML=`<div class="card" style="margin-top:10px"><button class="btn sm" id="bPr">Cetak / PDF / CSV</button><div class="wrap">${html}</div></div>`;S.rep={html,csv};});
$('#lap').onclick=e=>{if(e.target.id==='bPr')cetak(S.rep.html,S.rep.csv);};
let tc;$('#cq').oninput=e=>{clearTimeout(tc);tc=setTimeout(()=>run(null,async()=>{const r=await api('search',{q:e.target.value});
  $('#ch').innerHTML=r.map(x=>`<div class="row"><span>${esc(x.nama)} <small class="mu">${esc(x.kelas)}</small></span><button class="btn sm" data-h="${esc(x.id)}">Riwayat</button></div>`).join('');}),350);};
$('#ch').onclick=e=>{const id=e.target.dataset.h;if(id)run(e.target,async()=>{const r=await api('custHistory',{idPengguna:id,page:0,size:30});
  $('#chr').innerHTML=r.rows.map(o=>`<div class="row"><span>${esc(o.waktu)} <span class="tag">${esc(o.status)}</span><br><small class="mu">${o.items.map(i=>i.qty+'× '+esc(i.nama)).join(', ')}</small></span><b>${rp(o.total)}</b></div>`).join('')||'<span class="mu">Belum ada transaksi</span>';});};

// ===== pengaturan, identitas & tema =====
const PRE=[['Hijau tua','#14532d'],['Zamrud','#047857'],['Hijau daun','#3f8f3a'],['Hijau botol','#0b4a33']];
const ATUR=[['jam_batas_preorder','Jam batas pre-order hari yang sama (HH:mm)'],['jam_batas_ambil','Jam batas pengambilan pre-order (HH:mm)'],['batas_batal_menit','Batas pembatalan cepat (menit)'],['nominal_pin','Nominal yang meminta password pelanggan di kasir (Rp)'],['batas_jajan_default','Batas jajan harian siswa (Rp, 0 = nonaktif)'],['refund_persen','Persen pengembalian jika kebijakan sebagian'],['maks_darurat','Maksimal nominal mode darurat (Rp)'],['saldo_menipis','Ambang saldo menipis (Rp)']];
const PIL=[['kebijakan_refund','Pengembalian pre-order yang sudah diproses',[['penuh','Penuh'],['sebagian','Sebagian'],['tidak','Tidak dikembalikan']]],['cetak_struk','Cetak struk',[['Ya','Aktif'],['Tidak','Nonaktif']]],['preorder_aktif','Pre-order',[['Ya','Aktif'],['Tidak','Nonaktif']]],['notif_email_aktif','Notifikasi email wali (kuota email Google terbatas)',[['Tidak','Nonaktif'],['Ya','Aktif']]],['foto_siswa_aktif','Foto siswa di kasir (butuh izin orang tua dan sekolah)',[['Tidak','Nonaktif'],['Ya','Aktif']]],['kartu_format','Format kode kartu',[['teks','Apa adanya'],['hex_ke_desimal','Heksadesimal ke desimal']]],['kartu_urutan_byte','Urutan byte kartu',[['normal','Normal'],['balik','Dibalik']]]];
function setForm(){const c=S.cfg;
  $('#setBox').innerHTML=`<h3 style="margin-top:0">Identitas sekolah</h3>${[['nama_sekolah','Nama sekolah'],['nama_kantin','Nama kantin / aplikasi'],['alamat','Alamat'],['telepon','Nomor telepon'],['teks_struk','Teks tambahan struk']].map(f=>`<label>${f[1]}</label><input type="text" data-k="${f[0]}" value="${esc(c[f[0]]||'')}">`).join('')}
   <label>Logo (otomatis diperkecil, maks ± 33 KB)</label><input type="file" id="lg" accept="image/*">${c.logo?'<div class="mu">Logo tersimpan. Pilih file untuk mengganti.</div>':''}
   <h3>Warna tema</h3><div>${PRE.map(p=>`<button class="sw" data-c="${p[1]}" style="background:${p[1]}" title="${p[0]}"></button>`).join('')}<input type="color" id="cp" value="${esc(c.warna_utama||'#14532d')}" style="vertical-align:middle;width:50px;height:44px"> <input type="text" id="ch2" value="${esc(c.warna_utama||'#14532d')}" style="width:110px;display:inline-block"></div>
   <div class="prev" id="prev"><div class="h">Contoh header</div><div class="b"><span class="k">Tombol contoh</span> <span id="ctr" class="mu"></span></div></div>
   <h3>Aturan kantin</h3>${ATUR.map(f=>`<label>${f[1]}</label><input type="text" data-k="${f[0]}" value="${esc(c[f[0]]||'')}">`).join('')}
   ${PIL.map(f=>`<label>${f[1]}</label><select data-k="${f[0]}">${f[2].map(o=>`<option value="${o[0]}" ${c[f[0]]===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>`).join('')}
   <button class="btn" id="bSet" style="margin-top:12px">Simpan pengaturan</button>`;prev(c.warna_utama||'#14532d');}
function prev(g){if(!/^#[0-9a-f]{6}$/i.test(g)){$('#ctr').textContent='Kode warna harus seperti #14532d';return;}
  const el=$('#prev').style,on=lum(g)>.4?'#10201a':'#ffffff',l1=lum(g),l2=lum(on),r=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
  el.setProperty('--g',g);el.setProperty('--gl',mix(g,1,.88));el.setProperty('--on',on);$('#cp').value=g;$('#ch2').value=g;
  $('#ctr').textContent='Kontras teks '+r.toFixed(1)+':1 '+(r>=4.5?'✔ terbaca':'⚠ kurang terbaca, pilih warna lain');}
$('#setBox').onclick=e=>{if(e.target.dataset.c)prev(e.target.dataset.c);};
$('#setBox').oninput=e=>{if(e.target.id==='cp')prev(e.target.value);if(e.target.id==='ch2')prev(e.target.value);};
$('#setBox').onchange=async e=>{if(e.target.id!=='lg'||!e.target.files[0])return;try{S.logo=await logoFile(e.target.files[0]);toast('Logo siap disimpan ('+Math.round(S.logo.length*.75/1024)+' KB)');}catch(err){toast(err.message,1);e.target.value='';}};
function logoFile(f){return new Promise((res,rej)=>{
  if(f.type==='image/svg+xml'){const r=new FileReader();r.onload=()=>r.result.length<=45000?res(r.result):rej(new Error('SVG terlalu besar'));r.readAsDataURL(f);return;}
  const img=new Image();img.onload=()=>{let sc=Math.min(1,320/img.width,120/img.height),w=Math.round(img.width*sc),h=Math.round(img.height*sc);
    const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);let out=c.toDataURL('image/png');
    for(let q=.9;out.length>45000&&q>.3;q-=.15)out=c.toDataURL('image/webp',q);
    out.length>45000?rej(new Error('Logo terlalu detail, gunakan gambar yang lebih sederhana')):res(out);};
  img.onerror=()=>rej(new Error('File gambar tidak valid'));img.src=URL.createObjectURL(f);});}
$('#setBox').addEventListener('click',e=>{if(e.target.id!=='bSet')return;run(e.target,async()=>{
  const nilai={};document.querySelectorAll('#setBox [data-k]').forEach(i=>nilai[i.dataset.k]=i.value.trim());
  const g=$('#ch2').value.trim();if(!/^#[0-9a-f]{6}$/i.test(g))throw new Error('Kode warna tidak valid');nilai.warna_utama=g;if(S.logo)nilai.logo=S.logo;
  await api('saveCfg',{nilai});Object.assign(S.cfg,nilai);S.logo=null;applyTheme(S.cfg);toast('Pengaturan tersimpan');});});

// ===== pengarsipan =====
$('#arD').value=D().slice(0,8)+'01';
$('#bArsip').onclick=e=>run(e.target,async()=>{const d=$('#arD').value;if(!d)throw new Error('Pilih tanggal batas');
  if(!confirm('Arsipkan semua transaksi sebelum '+d+'?\nData dipindah ke Spreadsheet arsip dan tidak tampil lagi di aplikasi.'))return;
  const r=await api('arsip',{sebelum:d});
  $('#arR').innerHTML=`<div class="cust">Selesai. ${Object.keys(r.jumlah).map(k=>k+': '+r.jumlah[k]).join(', ')}<br>Kas ${r.kasCocok?'cocok ✔':'⚠ tidak cocok'} · Ledger ${r.ledgerCocok?'konsisten ✔':'⚠ tidak konsisten'}<br><a href="${esc(r.url)}" target="_blank" rel="noopener">Buka file arsip</a></div>`;});

// ===== log =====
async function logs(reset){const r=await api('logs',{page:S.logPage,size:40});
  const rows=r.rows.map(l=>`<tr><td>${esc(l.waktu)}</td><td>${esc(l.petugas)}</td><td>${esc(l.aksi)}</td><td>${esc(l.detail)}</td></tr>`).join('');
  if(reset)$('#logT').innerHTML='<tr><th>Waktu</th><th>Petugas</th><th>Aksi</th><th>Detail</th></tr>';$('#logT').insertAdjacentHTML('beforeend',rows);
  $('#logMore').classList.toggle('hide',(S.logPage+1)*40>=r.total);}
$('#logMore').onclick=e=>run(e.target,async()=>{S.logPage++;await logs();});
}
