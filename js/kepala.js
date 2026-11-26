if(guard('kepala')){
const S={cfg:{},u:{page:0,total:0,grup:'pelanggan'},sel:new Set(),hit:{},logPage:0,logo:null,kelas:[],users:[],cred:[],imp:[],cur:null,iz:null};
const D=()=>new Date().toLocaleDateString('sv-SE');
const ago=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.toLocaleDateString('sv-SE');};
const fn=n=>Number(n).toLocaleString('id-ID');
const tbl=(h,rows)=>`<table><tr>${h.map(x=>`<th class="${x[1]||''}">${x[0]}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map((c,i)=>`<td class="${h[i][1]||''}">${c}</td>`).join('')}</tr>`).join('')}</table>`;
const csvq=v=>'"'+String(v).replace(/"/g,'""')+'"';
const GR=[['pelanggan','Pelanggan','Siswa atau guru yang berbelanja di kantin'],['wali','Orang Tua','Orang tua/wali yang memantau jajan anak'],['kasir','Kasir','Melayani penjualan di kasir'],['bendahara','Bendahara','Mengelola deposit, kas, dan pemasok'],['pencatat','Pencatat / Gudang','Mencatat barang, stok, dan pesanan pemasok'],['kepala','Admin','Mengelola seluruh sistem']];
const GN=Object.fromEntries(GR.map(g=>[g[0],g[1]]));
const hakLabel=p=>p==='siswa'?'Pelanggan (Siswa)':p==='guru'?'Pelanggan (Guru)':(GN[p]||p);
$('#ld').value=D();$('#ls').value=D();

$('#tabs').onclick=e=>{const t=e.target.dataset.t;if(!t)return;document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b===e.target));
  ['dash','akun','izin','lap','set','log'].forEach(x=>$('#t-'+x).classList.toggle('hide',x!==t));
  if(t==='dash')dash();if(t==='akun'&&!S.akunInit){S.akunInit=1;users();}if(t==='izin')izinLoad();if(t==='log'&&!$('#logT').innerHTML){S.logPage=0;logs(true);}};
async function boot(){const d=await api('init');S.cfg=d.cfgLengkap;applyTheme(d.cfg);setForm();dash();}
boot().catch(e=>toast(e.message,1));

// ===== dasbor + persetujuan koreksi =====
async function dash(){const [d,k,a]=await Promise.all([api('dash'),api('koreksiList'),api('anomaly',{})]);
  const kp=(l,v,w)=>`<div class="card" ${w?'style="border-color:var(--er)"':''}><div class="mu">${l}</div><div class="big">${v}</div></div>`;
  $('#kp').innerHTML=kp('Penjualan hari ini',rp(d.penjualanHariIni))+kp('Saldo beredar',rp(d.saldoBeredar))+kp('Stok menipis',d.stokMenipis,d.stokMenipis>0)+kp('Kewajiban pemasok (bulan ini)',rp(d.kewajibanPemasok))+kp('Kas vs saldo',d.kasCocok?'Cocok ✔':'Selisih '+rp(d.selisihKas),!d.kasCocok)+kp('Input manual hari ini',d.manualHariIni)+kp('Pelanggan dengan PIN bawaan',d.pinDefault,d.pinDefault>0);
  $('#ars').innerHTML=d.arsipStatus?`<div class="${/^Tertunda/.test(d.arsipStatus)?'warn':'mu'}" style="margin-bottom:10px">Arsip otomatis: ${esc(d.arsipStatus)}</div>`:'';
  $('#kor').innerHTML=k.length?`<h3>Koreksi saldo menunggu persetujuan (${k.length})</h3>`+k.map(x=>`<div class="card" style="margin-bottom:8px"><b>${esc(x.nama)}</b> · tambah ${rp(x.nominal)}<div class="mu">${esc(x.alasan)} — diajukan ${esc(x.pengaju)}, ${esc(x.waktu)}</div><div class="chips" style="margin-top:6px"><button class="btn sm" data-k="${esc(x.id)}" data-v="1">Setujui</button><button class="btn sm red" data-k="${esc(x.id)}" data-v="0">Tolak</button></div></div>`).join(''):'';
  $('#ano').innerHTML=a.length?tbl([['Kasir'],['Transaksi','n'],['Manual','n'],['Batal','n'],['Susulan','n']],a.map(x=>[esc(x.kasir),x.transaksi,x.manual,x.batal,x.susulan])):'<span class="mu">Belum ada data</span>';}
$('#kor').onclick=e=>{const d=e.target.dataset;if(d.k)run(e.target,async()=>{await api('approveKoreksi',{id:d.k,setuju:d.v==='1'});toast(d.v==='1'?'Disetujui':'Ditolak');dash();});};

// ===== daftar akun =====
const filt=()=>({grup:S.u.grup,q:$('#uq').value,kelas:$('#uk').value,status:$('#us').value,aktivasi:$('#ua').value});
async function users(){
  const r=await api('userList',Object.assign(filt(),{page:S.u.page,size:25}));
  S.u.total=r.total;S.users=r.rows;S.hit=r.hitung||{};S.kelas=r.kelas||[];S.angk=r.angkatan||[];
  const cur=$('#uk').value;$('#uk').innerHTML='<option value="">Semua kelas</option>'+S.kelas.map(k=>`<option ${k===cur?'selected':''}>${esc(k)}</option>`).join('');
  $('#uk').classList.toggle('hide',S.u.grup!=='pelanggan');seg();renderUsers();}
function seg(){$('#gseg').innerHTML=GR.map(g=>`<button data-g="${g[0]}" class="${S.u.grup===g[0]?'on':''}">${g[1]}<span class="ct">${S.hit[g[0]]||0}</span></button>`).join('');}
$('#gseg').onclick=e=>{const g=e.target.closest('button');if(!g)return;S.u.grup=g.dataset.g;S.u.page=0;S.sel.clear();$('#uk').value='';users();};
function renderUsers(){const pel=S.u.grup==='pelanggan';
  $('#bulk').classList.remove('hide');updSel();
  const rows=S.users.map(u=>`<tr><td><input type="checkbox" data-sel="${esc(u.id)}" ${S.sel.has(u.id)?'checked':''}></td>
   <td><b>${esc(u.nama)}</b><div class="mu" style="font-size:12.5px">${esc(u.username)}${u.nis?' · '+esc(u.nis):''}</div></td>
   <td>${pel?esc(u.kelas||'-')+`<div class="mu" style="font-size:12.5px">${u.peran==='guru'?'Guru':'Siswa'}</div>`:esc(GN[u.grup]||u.peran)}</td>
   <td>${u.status==='Aktif'?'<span class="bdg ok">Aktif</span>':u.status==='Lulus'?'<span class="bdg mu">Lulus</span>':'<span class="bdg er">Nonaktif</span>'}${u.terkunci?' <span class="bdg er">Terkunci</span>':''}</td>
   <td>${u.aktivasi?`<span class="bdg ok" title="Password sudah diperbarui pemilik">✔ Aktivasi ${esc(u.aktivasi)}</span>`:'<span class="bdg wr">Belum aktivasi</span>'}</td>
   ${pel?`<td>${u.pinDiganti?'<span class="bdg ok">✔ PIN diganti</span>':'<span class="bdg mu">PIN bawaan</span>'}${u.pinGagal>=5?' <span class="bdg er">PIN terkunci</span>':''}</td><td class="n">${rp(u.saldo)}</td>`:''}
   <td class="n" style="white-space:nowrap"><button class="btn sm alt" data-u="${esc(u.id)}">Kelola</button> ${u.status==='Aktif'?`<button class="btn sm redo" data-off="${esc(u.id)}">Nonaktifkan</button>`:`<button class="btn sm alt" data-on="${esc(u.id)}">Aktifkan</button>`}</td></tr>`).join('');
  $('#ut').innerHTML=`<thead><tr><th><input type="checkbox" id="chkAll"></th><th>Nama / Username</th><th>${pel?'Kelas':'Hak Akses'}</th><th>Status</th><th>Aktivasi</th>${pel?'<th>PIN</th><th class="n">Saldo</th>':''}<th></th></tr></thead><tbody>${rows||`<tr><td colspan="9" class="mu" style="text-align:center;padding:26px">Tidak ada akun</td></tr>`}</tbody>`;
  $('#uPg').textContent=S.u.total?((S.u.page*25+1)+'–'+Math.min(S.u.total,S.u.page*25+25)+' dari '+S.u.total):'0 akun';}
function updSel(){$('#selInfo').textContent=S.sel.size?S.sel.size+' akun dipilih':'Centang akun untuk reset password massal';$('#bRsel').disabled=!S.sel.size;}
let tq;$('#uq').oninput=()=>{clearTimeout(tq);tq=setTimeout(()=>{S.u.page=0;users();},350);};$('#uk').onchange=$('#us').onchange=$('#ua').onchange=()=>{S.u.page=0;users();};
$('#uPrev').onclick=()=>{if(S.u.page>0){S.u.page--;users();}};$('#uNext').onclick=()=>{if((S.u.page+1)*25<S.u.total){S.u.page++;users();}};
$('#ut').onclick=e=>{const t=e.target,d=t.dataset;
  if(t.id==='chkAll'){S.users.forEach(u=>t.checked?S.sel.add(u.id):S.sel.delete(u.id));renderUsers();return;}
  if(d.sel){t.checked?S.sel.add(d.sel):S.sel.delete(d.sel);updSel();return;}
  if(d.u)openU(S.users.find(x=>x.id===d.u));
  if(d.off){const u=S.users.find(x=>x.id===d.off);if(confirm('Nonaktifkan akun '+u.nama+'?\nAkun tidak bisa login dan tidak bisa dipakai belanja. Saldo tetap aman dan akun dapat diaktifkan kembali.'))run(t,async()=>{await api('userAdmin',{aksi:'nonaktif',idPengguna:d.off});toast('Akun dinonaktifkan');users();});}
  if(d.on)run(t,async()=>{await api('userAdmin',{aksi:'aktif',idPengguna:d.on});toast('Akun diaktifkan');users();});};
$('#bSelAll').onclick=e=>run(e.target,async()=>{const r=await api('userList',Object.assign(filt(),{idsOnly:1}));r.ids.forEach(i=>S.sel.add(i));renderUsers();toast(r.ids.length+' akun dipilih');});
$('#bRsel').onclick=e=>run(e.target,async()=>{const ids=[...S.sel];
  if(!confirm('Reset password '+ids.length+' akun menjadi password acak baru?\nPassword lama tidak berlaku lagi dan pemilik wajib aktivasi ulang saat login. Daftar password akan diunduh sebagai Excel.'))return;
  let all=[];for(let i=0;i<ids.length;i+=50){toast('Memproses '+Math.min(i+50,ids.length)+' / '+ids.length+'…');all=all.concat(await api('resetMassal',{ids:ids.slice(i,i+50)}));}
  unduhKred(all.map(x=>({nama:x.nama,kelas:x.kelas,email:x.email,username:x.username,peran:x.peran,pass:x.passwordBaru})),'password-baru');S.sel.clear();toast(all.length+' password direset. Berkas Excel diunduh.');users();});

// ----- unduh daftar akun & password (Excel) untuk dikirim lewat email -----
function unduhKred(list,nama){const url=location.origin+location.pathname.replace(/[^/]*$/,'index.html'),kn=S.cfg.nama_kantin||'Kantin';
  const head=['No','Nama','Hak Akses','Kelas','Username (untuk login)','Email tujuan','Password sementara','Alamat aplikasi','Isi pesan email'];
  const pesan=x=>`Yth. ${x.nama}, akun ${kn} Anda siap digunakan. Alamat: ${url} | Hak Akses: ${hakLabel(x.peran)} | Username: ${x.username} | Password sementara: ${x.pass}. Saat login pertama Anda diminta membuat password baru${/siswa|guru/.test(x.peran)?' dan PIN transaksi 6 angka':''}. Jangan berikan password atau PIN kepada siapa pun.`;
  const rows=[['Daftar akun dan password sementara - '+kn],['RAHASIA: kirim ke masing-masing pemilik lewat email lalu hapus berkas ini.'],[],head].concat(list.map((x,i)=>[i+1,x.nama,hakLabel(x.peran),x.kelas||'',x.username,x.email||'',x.pass,url,pesan(x)]));
  unduhXlsx(nama+'-'+D(),[{name:'Daftar Akun',rows,headRow:3,boldRows:[0]}]);}

// ----- kelola satu akun -----
async function openU(u){const d=await api('userDetail',{id:u.id});S.cur=u;const pel=u.grup==='pelanggan';
  $('#dUb').innerHTML=`<h3>${esc(u.nama)} ${u.status==='Aktif'?'<span class="bdg ok">Aktif</span>':'<span class="bdg er">'+esc(u.status)+'</span>'}</h3>
   <div class="mu">${esc(hakLabel(u.peran))} · Username: <b>${esc(u.username)}</b>${u.nis?' · NIS/NIP '+esc(u.nis):''}${pel?' · kelas '+esc(u.kelas||'-'):''}</div>
   <div style="margin:8px 0">${u.aktivasi?`<span class="bdg ok">✔ Aktivasi ${esc(u.aktivasi)}</span>`:'<span class="bdg wr">Belum aktivasi</span>'} ${pel?(u.pinDiganti?'<span class="bdg ok">✔ PIN diganti</span>':'<span class="bdg mu">PIN bawaan 123456</span>'):''} ${u.terkunci?'<span class="bdg er">Akun terkunci</span>':''}</div>
   ${pel?`<div>Saldo: <b>${rp(u.saldo)}</b></div>`:''}${d.wali.length?`<div>Wali: ${d.wali.map(esc).join(', ')}</div>`:''}${d.anak.length?`<div>Anak: ${d.anak.map(esc).join(', ')}</div>`:''}
   <h4>Data akun</h4><div class="fgrid"><div><label>Nama</label><input type="text" id="enm" value="${esc(u.nama)}"></div>${pel?`<div><label>Kelas</label><input type="text" id="ekl" list="dlKelas" value="${esc(u.kelas||'')}"><datalist id="dlKelas">${S.kelas.map(k=>`<option value="${esc(k)}">`).join('')}</datalist></div><div><label>NIS / NIP</label><input type="text" id="enis" value="${esc(u.nis||'')}"></div>`:''}<div><label>Email</label><input type="email" id="eem" value="${esc(u.email||'')}"></div></div>
   <button class="btn sm" data-a="ubah" style="margin-top:10px">Simpan data</button>
   <h4>Keamanan</h4><div class="fgrid"><div class="full"><label>Password baru (kosongkan = dibuat acak)</label><input type="text" id="kpw" placeholder="Dibuat otomatis" autocomplete="off"></div></div>
   <div class="chips" style="margin-top:8px"><button class="btn sm alt" data-a="resetPassword">Reset password</button><button class="btn sm alt" data-a="buka">Buka kunci</button>${pel?`<button class="btn sm alt" data-a="resetPinKartu">Reset PIN ke 123456</button>`:''}</div>
   ${pel?`<div class="mu" style="margin-top:6px">PIN transaksi: ${d.pinGagal>=5?'<b style="color:var(--er)">TERKUNCI</b>':d.pinDefault?'<b>masih bawaan 123456</b>':'sudah diganti pemilik'}</div>`:''}<div id="uRes"></div>
   <h4>Status akun</h4><div class="chips">${u.status==='Aktif'?'<button class="btn sm red" data-a="nonaktif">Nonaktifkan akun</button>':'<button class="btn sm" data-a="aktif">Aktifkan akun</button>'}</div>
   ${pel?`<div class="warn" style="border-left-color:var(--er);background:#fff3f1"><b>Kartu pelajar hilang?</b><div class="mu">Satu langkah: akun dinonaktifkan dan semua kartu diblokir. Saldo tetap aman dan dapat dipakai kembali setelah akun diaktifkan dan kartu pengganti didaftarkan.</div><button class="btn sm red" style="margin-top:6px" data-a="kartuHilang">Laporkan kartu hilang</button></div>
   <h4>Kartu</h4>${d.kartu.map(k=>`<div class="row"><span>${esc(k.kode)} <small class="mu">${esc(k.jenis)} · ${k.status==='Aktif'?'Aktif':'<b style="color:var(--er)">DIBLOKIR</b>'}</small></span>${k.status==='Aktif'?`<button class="btn sm redo" data-nk="${esc(k.kode)}">Blokir</button>`:`<button class="btn sm alt" data-bk="${esc(k.kode)}">Buka blokir</button>`}</div>`).join('')||'<span class="mu">Belum ada kartu</span>'}
   <div class="fgrid" style="margin-top:6px"><div><label>Kode kartu baru</label><input type="text" id="kk"></div><div><label>Jenis</label><select id="kj"><option value="barcode">Barcode</option><option value="RFID">RFID</option></select></div></div><button class="btn sm" data-a="kartuBaru" style="margin-top:8px">Daftarkan kartu</button>
   ${S.cfg.foto_siswa_aktif==='Ya'?`<h4>Foto</h4><img id="uf" class="hide" alt="" style="width:110px;height:110px;object-fit:cover;border-radius:10px;display:block;margin-bottom:6px"><input type="file" id="uff" accept="image/*">`:''}
   ${u.peran==='siswa'?`<h4>Batas jajan harian (0 = ikut sekolah)</h4><div class="row" style="border:0"><input type="number" id="kb" value="${u.batas}" style="width:60%"><button class="btn sm" data-a="batasJajan">Simpan</button></div>`:''}`:''}
   ${u.peran==='wali'?`<h4>Kaitkan anak</h4><input type="search" id="kw" placeholder="Cari nama anak"><div id="kwr"></div>`:''}`;
  if(d.foto&&$('#uf'))api('fotoGet',{tipe:'siswa',id:u.id}).then(r=>{if(r.data){$('#uf').src=r.data;$('#uf').classList.remove('hide');}}).catch(()=>{});
  $('#dU').showModal();}
document.addEventListener('change',async e=>{if(e.target.id!=='uff'||!e.target.files[0])return;
  try{const data=await compressImg(e.target.files[0],240,70*1024);await api('fotoSet',{tipe:'siswa',id:S.cur.id,data});$('#uf').src=data;$('#uf').classList.remove('hide');toast('Foto tersimpan');}catch(err){toast(err.message,1);}});
$('#dUx').onclick=()=>{$('#dU').close();users();};
$('#dUb').onclick=e=>{const d=e.target.dataset,u=S.cur;
  if(d.bk)run(e.target,async()=>{await api('userAdmin',{aksi:'bukaBlokirKartu',idPengguna:u.id,kode:d.bk});toast('Blokir dibuka');openU(u);});
  if(d.nk)run(e.target,async()=>{if(!confirm('Blokir kartu ini? Kartu langsung tidak bisa dipakai belanja.'))return;await api('userAdmin',{aksi:'nonaktifKartu',idPengguna:u.id,kode:d.nk});openU(u);});
  if(d.a)run(e.target,async()=>{
    if(d.a==='ubah'){await api('userAdmin',{aksi:'ubah',idPengguna:u.id,nama:$('#enm').value,email:$('#eem').value,kelas:$('#ekl')?$('#ekl').value:undefined,nis:$('#enis')?$('#enis').value:undefined});toast('Data akun disimpan');return;}
    if(d.a==='resetPassword'){const pw=($('#kpw').value||'').trim();if(!confirm('Reset password '+u.nama+(pw?' menjadi yang Anda ketik':' menjadi acak')+'? Pastikan identitas sudah diverifikasi.'))return;
      const r=await api('userAdmin',{aksi:'resetPassword',idPengguna:u.id,password:pw||undefined});
      $('#uRes').innerHTML=`<div class="cust" style="margin-top:8px">Username: <b>${esc(u.username)}</b><br>Password baru: <span class="big">${esc(r.passwordBaru)}</span><br>${r.manual?'':'Pemilik wajib membuat password baru'+(u.grup==='pelanggan'?' dan PIN':'')+' saat login berikutnya. '}Sampaikan secara tertutup.<div style="margin-top:8px"><button class="btn sm alt" id="uXl">Unduh Excel</button></div></div>`;
      $('#uXl').onclick=()=>unduhKred([{nama:u.nama,kelas:u.kelas,email:u.email,username:u.username,peran:u.peran,pass:r.passwordBaru}],'password-'+u.username.replace(/[^\w.-]/g,'_'));return;}
    if(d.a==='kartuHilang'){if(!confirm('Laporkan kartu '+u.nama+' hilang?\nAkun dinonaktifkan dan SEMUA kartu diblokir sekarang.'))return;const r=await api('userAdmin',{aksi:'kartuHilang',idPengguna:u.id});toast('Akun dinonaktifkan, '+r.jumlah+' kartu diblokir');$('#dU').close();users();return;}
    if(d.a==='resetPinKartu'){if(!confirm('Kembalikan PIN '+u.nama+' ke 123456 (dan buka kuncinya)? Pastikan identitas sudah diverifikasi.'))return;await api('userAdmin',{aksi:'resetPinKartu',idPengguna:u.id});toast('PIN kembali 123456');users();openU(u);return;}
    if(d.a==='kartuBaru'){await api('userAdmin',{aksi:'kartuBaru',idPengguna:u.id,kode:$('#kk').value,jenis:$('#kj').value});openU(u);return;}
    if(d.a==='batasJajan'){await api('userAdmin',{aksi:'batasJajan',idPengguna:u.id,nominal:$('#kb').value});toast('Tersimpan');return;}
    if(d.a==='nonaktif'&&!confirm('Nonaktifkan akun '+u.nama+'?'))return;
    await api('userAdmin',{aksi:d.a,idPengguna:u.id});toast('Berhasil');$('#dU').close();users();});
  if(d.an)run(e.target,async()=>{await api('linkWali',{idWali:u.id,idAnak:d.an});toast('Terkaitkan');openU(u);});};
document.addEventListener('input',e=>{if(e.target.id!=='kw')return;clearTimeout(tq);tq=setTimeout(()=>run(null,async()=>{const r=await api('search',{q:e.target.value});
  $('#kwr').innerHTML=r.map(x=>`<div class="row"><span>${esc(x.nama)} <small class="mu">${esc(x.kelas)}</small></span><button class="btn sm" data-an="${esc(x.id)}">Kaitkan</button></div>`).join('');}),350);});

// ----- tambah akun (bertahap, interaktif) -----
const W={step:1,grup:'pelanggan',jenis:'siswa',pw:'auto',anak:[],res:null};
function stp(n){W.step=n;[...$('#aSt').children].forEach((i,k)=>i.classList.toggle('on',k<n));}
$('#bAdd').onclick=()=>{W.grup=S.u.grup;W.jenis='siswa';W.pw='auto';W.anak=[];W.res=null;stp(1);wiz1();$('#dA').showModal();};
function wiz1(){$('#aB').innerHTML=`<h3>Akun baru untuk siapa?</h3><p class="mu" style="margin-top:0">Pilih hak akses akun yang akan dibuat.</p><div class="tiles">${GR.map(g=>`<button type="button" class="tile ${W.grup===g[0]?'on':''}" data-g="${g[0]}"><b>${g[1]}</b><span>${g[2]}</span></button>`).join('')}</div>
  <div class="chips" style="margin-top:16px"><button class="btn sm" id="w1n">Lanjut</button><button class="btn sm alt" id="w1x">Batal</button></div>`;
  $('#aB').onclick=e=>{const t=e.target.closest('.tile');if(t){W.grup=t.dataset.g;wiz1();}if(e.target.id==='w1n'){stp(2);wiz2();}if(e.target.id==='w1x')$('#dA').close();};}
const opt=(arr,sel)=>arr.map(o=>`<option value="${esc(o)}" ${o===sel?'selected':''}>${esc(o)}</option>`).join('');
function wiz2(){const g=W.grup,pel=g==='pelanggan';
  $('#aB').innerHTML=`<h3>Data ${GN[g]}</h3><div class="fgrid">
   ${pel?`<div class="full"><label>Jenis pelanggan</label><div class="seg" id="wJ"><button type="button" data-j="siswa" class="${W.jenis==='siswa'?'on':''}">Siswa</button><button type="button" data-j="guru" class="${W.jenis==='guru'?'on':''}">Guru / Karyawan</button></div></div>`:''}
   <div class="full"><label>Nama lengkap</label><input type="text" id="wN" autocomplete="off"></div>
   ${pel?`<div><label>${W.jenis==='siswa'?'Kelas':'Keterangan / Unit'}</label><select id="wK"><option value="">Pilih…</option>${opt(S.kelas)}<option value="__baru">＋ Tambah baru…</option></select><input type="text" id="wKB" class="hide" placeholder="Tulis nama baru" style="margin-top:6px"></div><div><label>${W.jenis==='siswa'?'NIS':'NIP'} (opsional)</label><input type="text" id="wS" autocomplete="off"></div>`:''}
   ${(pel||g==='wali')?`<div class="full"><label>Email ${pel?'(dipakai sebagai username)':'(opsional, dipakai sebagai username)'}</label><input type="email" id="wE" autocomplete="off" placeholder="nama@email.com"></div>`:''}
   ${!pel?`<div class="full"><label>Username${g==='wali'?' (kosongkan = pakai email)':''}</label><input type="text" id="wU" autocapitalize="none" autocomplete="off"></div>`:''}
   ${pel?`<div class="full"><label>Kode kartu (opsional, scan atau ketik)</label><input type="text" id="wC" autocomplete="off"></div>`:''}
   <div class="full"><label>Password awal</label><div class="seg" id="wP"><button type="button" data-p="auto" class="${W.pw==='auto'?'on':''}">Dibuat otomatis</button><button type="button" data-p="manual" class="${W.pw==='manual'?'on':''}">Tentukan sendiri</button></div><input type="text" id="wPw" class="${W.pw==='manual'?'':'hide'}" placeholder="Minimal '+(['pelanggan','wali'].includes(g)?4:8)+' karakter" style="margin-top:6px" autocomplete="off"></div>
   ${g==='wali'?`<div class="full"><label>Anak yang dipantau</label><input type="search" id="wA" placeholder="Cari nama anak lalu pilih"><div id="wAr"></div><div class="chips" id="wAc" style="margin-top:6px"></div></div>`:''}</div>
  <div class="chips" style="margin-top:16px"><button class="btn sm" id="w2s">Buat akun</button><button class="btn sm alt" id="w2b">Kembali</button></div>`;
  chipsAnak();
  $('#aB').onclick=e=>{const t=e.target;
    if(t.closest('#wJ')&&t.dataset.j){W.jenis=t.dataset.j;const v=[$('#wN').value];wiz2();$('#wN').value=v[0];}
    if(t.closest('#wP')&&t.dataset.p){W.pw=t.dataset.p;[...$('#wP').children].forEach(b=>b.classList.toggle('on',b.dataset.p===W.pw));$('#wPw').classList.toggle('hide',W.pw!=='manual');}
    if(t.dataset.ap){const a=W.sr.find(x=>x.id===t.dataset.ap);if(a&&!W.anak.find(x=>x.id===a.id))W.anak.push(a);chipsAnak();}
    if(t.dataset.rm){W.anak=W.anak.filter(x=>x.id!==t.dataset.rm);chipsAnak();}
    if(t.id==='w2b'){stp(1);wiz1();}
    if(t.id==='w2s')run(t,simpanAkun);};
  const k=$('#wK');if(k)k.onchange=()=>$('#wKB').classList.toggle('hide',k.value!=='__baru');
  const a=$('#wA');if(a)a.oninput=()=>{clearTimeout(tq);tq=setTimeout(()=>run(null,async()=>{W.sr=await api('search',{q:a.value});$('#wAr').innerHTML=W.sr.map(x=>`<div class="row"><span>${esc(x.nama)} <small class="mu">${esc(x.kelas)}</small></span><button type="button" class="btn sm alt" data-ap="${esc(x.id)}">Pilih</button></div>`).join('');}),350);};}
function chipsAnak(){const c=$('#wAc');if(c)c.innerHTML=W.anak.map(a=>`<span class="bdg ok">${esc(a.nama)} <button type="button" data-rm="${esc(a.id)}" style="border:0;background:none;color:var(--er);cursor:pointer;padding:0 0 0 4px">✕</button></span>`).join('');}
async function simpanAkun(){const g=W.grup,pel=g==='pelanggan',v=id=>($(id)?$(id).value.trim():'');
  let kelas=v('#wK');if(kelas==='__baru')kelas=v('#wKB');
  const peran=pel?W.jenis:g,r=await api('createUser',{peran,nama:v('#wN'),kelas,nis:v('#wS'),email:v('#wE'),username:v('#wU'),kartu:v('#wC')||undefined,password:W.pw==='manual'?v('#wPw'):undefined,anak:W.anak.map(a=>a.id)});
  W.res=r;stp(3);
  $('#aB').innerHTML=`<h3>✔ Akun berhasil dibuat</h3><div class="cust">Nama: <b>${esc(r.nama)}</b><br>Hak akses: <b>${esc(hakLabel(r.peran))}</b><br>Username: <b>${esc(r.username)}</b><br>Password awal: <span class="big">${esc(r.passwordAwal)}</span><br><span class="mu">${r.manual?'Password ditentukan admin.':'Pemilik akan diminta membuat password baru'+(pel?' dan PIN':'')+' saat login pertama.'}</span></div>
   <div class="chips"><button class="btn sm" id="w3x">Unduh Excel</button><button class="btn sm alt" id="w3n">Tambah akun lagi</button><button class="btn sm alt" id="w3c">Selesai</button></div>`;
  $('#aB').onclick=e=>{if(e.target.id==='w3x')unduhKred([{nama:r.nama,kelas:r.kelas,email:r.email,username:r.username,peran:r.peran,pass:r.passwordAwal}],'akun-'+r.username.replace(/[^\w.-]/g,'_'));
    if(e.target.id==='w3n'){W.anak=[];stp(2);wiz2();}if(e.target.id==='w3c'){$('#dA').close();users();}};}
$('#dA').addEventListener('close',()=>{if(S.akunInit)users();});

// ----- impor dari Excel / CSV -----
const normH=s=>String(s||'').toLowerCase().replace(/\(.*?\)/g,'').replace(/\*/g,'').trim();
const HAK={kasir:'kasir',bendahara:'bendahara',pencatat:'pencatat',gudang:'pencatat','petugas pencatat':'pencatat',admin:'kepala',kepala:'kepala','kepala kantin':'kepala'};
$('#iTpl').onclick=()=>unduhXlsx('template-impor-akun',[
 {name:'Petunjuk',rows:[['TEMPLATE IMPOR AKUN KANTIN'],[],['1. Isi sheet sesuai jenis akun: Pelanggan, Orang Tua, atau Petugas.'],['2. Kolom bertanda * wajib diisi.'],['3. Username pelanggan otomatis memakai email. Password dibuat acak oleh sistem.'],['4. Hak Akses petugas: Kasir, Bendahara, Pencatat, atau Admin.'],['5. Kolom Email Anak (sheet Orang Tua) diisi email pelanggan anaknya; pisahkan dengan titik koma bila lebih dari satu.'],['6. Hapus baris contoh, lalu simpan dan unggah berkas ini.'],['7. Setelah impor, unduh daftar password awal (Excel) untuk dikirim ke email masing-masing.']],headRow:-1,boldRows:[0]},
 {name:'Pelanggan',rows:[['Nama*','Jenis* (Siswa/Guru)','Kelas','Email*','NIS/NIP','Kode Kartu'],['Contoh Siswa','Siswa','X-1','contoh.siswa@sekolah.sch.id','12345','']],headRow:0},
 {name:'Orang Tua',rows:[['Nama*','Email*','Email Anak'],['Contoh Wali','contoh.wali@email.com','contoh.siswa@sekolah.sch.id']],headRow:0},
 {name:'Petugas',rows:[['Nama*','Username*','Hak Akses* (Kasir/Bendahara/Pencatat/Admin)'],['Contoh Kasir','kasir1','Kasir']],headRow:0}]);
$('#bImp').onclick=()=>{S.imp=[];S.cred=[];$('#iP').textContent='';$('#iV').innerHTML='';$('#iR').innerHTML='';$('#iS').disabled=true;$('#iDl').classList.add('hide');$('#iF').value='';$('#iA').classList.remove('hide');$('#iS2').classList.remove('on');$('#iS3').classList.remove('on');$('#dI').showModal();};
$('#iX').onclick=()=>{$('#dI').close();users();};
function parseImport(sheets){const out=[],notes=[];
  sheets.forEach(sh=>{if(!sh.rows.length||/petunjuk/i.test(sh.name))return;const H=sh.rows[0].map(normH),ix=n=>H.findIndex(h=>h===n||h.startsWith(n)),body=sh.rows.slice(1).filter(r=>r.some(x=>x));
    const tipe=(H.includes('email anak')||/orang tua|wali/i.test(sh.name))?'wali':H.includes('jenis')?'pel':H.some(h=>h.startsWith('hak akses'))?'staff':'';
    if(!tipe){notes.push('Sheet "'+sh.name+'" dilewati (judul kolom tidak dikenali)');return;}
    const g=(r,n)=>{const i=ix(n);return i<0?'':(r[i]||'');};
    body.forEach(r=>{if(/^contoh\b/i.test(g(r,'nama')))return;
      if(tipe==='pel')out.push({peran:/guru|karyawan/i.test(g(r,'jenis'))?'guru':'siswa',nama:g(r,'nama'),kelas:g(r,'kelas'),email:g(r,'email'),nis:g(r,'nis'),kartu:g(r,'kode kartu')||undefined});
      else if(tipe==='wali')out.push({peran:'wali',nama:g(r,'nama'),email:g(r,'email'),anak:g(r,'email anak')});
      else out.push({peran:HAK[normH(g(r,'hak akses'))]||normH(g(r,'hak akses')),nama:g(r,'nama'),username:g(r,'username')});});});
  return {rows:out,notes};}
async function bacaImp(f){if(!f)return;try{const r=parseImport(await bacaBerkas(f));S.imp=r.rows;
  const c={};r.rows.forEach(x=>c[hakLabel(x.peran)]=(c[hakLabel(x.peran)]||0)+1);
  $('#iP').innerHTML=r.rows.length?'<b>'+r.rows.length+' baris siap diimpor</b>: '+Object.keys(c).map(k=>k+' '+c[k]).join(', ')+r.notes.map(n=>'<div class="warn">'+esc(n)+'</div>').join(''):'<div class="warn">Tidak ada data yang bisa dibaca. Gunakan template dan isi minimal satu baris. '+esc(r.notes.join('; '))+'</div>';
  $('#iV').innerHTML=r.rows.length?tbl([['Nama'],['Hak Akses'],['Kelas'],['Username / Email']],r.rows.slice(0,6).map(x=>[esc(x.nama),esc(hakLabel(x.peran)),esc(x.kelas||'-'),esc(x.email||x.username||'')]))+(r.rows.length>6?'<div class="mu">… dan '+(r.rows.length-6)+' baris lainnya</div>':''):'';
  $('#iS').disabled=!r.rows.length;$('#iS2').classList.toggle('on',!!r.rows.length);}catch(e){toast(e.message,1);}}
$('#iF').onchange=e=>bacaImp(e.target.files[0]);
['dragover','dragleave','drop'].forEach(ev=>$('#iDrop').addEventListener(ev,e=>{e.preventDefault();$('#iDrop').classList.toggle('on',ev==='dragover');if(ev==='drop'&&e.dataTransfer.files[0])bacaImp(e.dataTransfer.files[0]);}));
$('#iS').onclick=e=>run(e.target,async()=>{S.cred=[];const all=S.imp,bad=[];
  for(let i=0;i<all.length;i+=40){$('#iP').textContent='Memproses '+Math.min(i+40,all.length)+' / '+all.length+'…';
    (await api('importUsers',{rows:all.slice(i,i+40)})).forEach(x=>{if(x.passwordAwal)S.cred.push({nama:x.nama,kelas:x.kelas,email:x.email,username:x.username,peran:x.peran,pass:x.passwordAwal});else bad.push(x);});}
  $('#iP').innerHTML='<b>Selesai: '+S.cred.length+' akun berhasil dibuat, '+bad.length+' bermasalah.</b>';$('#iS3').classList.add('on');
  $('#iR').innerHTML=bad.length?'<h4>Perlu diperbaiki</h4>'+tbl([['Nama'],['Username / Email'],['Masalah']],bad.map(x=>[esc(x.nama||''),esc(x.username||''),esc(x.error||x.catatan||'')])):'';
  $('#iDl').classList.toggle('hide',!S.cred.length);if(S.cred.length)unduhKred(S.cred,'akun-baru');});
$('#iDl').onclick=()=>unduhKred(S.cred,'akun-baru');


// ----- kirim akun ke email secara massal (per kelas / per angkatan) -----
const K={mode:'reset',scope:'kelas',val:'',belum:true,rows:[],file:'',ids:[],adaEmail:0,kuota:-1};
const angk=k=>{const t=String(k||'').trim().toUpperCase().split(/[\s\-._\/]+/)[0]||'',m=t.match(/^(\d+)[A-Z]*$/);return m?m[1]:t;};
$('#bKirim').onclick=()=>{Object.assign(K,{mode:'reset',scope:'kelas',val:'',belum:true,rows:[],file:'',ids:[]});renderK();$('#dK').showModal();};
function kOpsi(){const kl=K.mode==='reset'?S.kelas:[...new Set(K.rows.map(r=>r.kelas).filter(Boolean))].sort(),an=K.mode==='reset'?S.angk:[...new Set(K.rows.map(r=>angk(r.kelas)).filter(Boolean))].sort();return {kl,an};}
function renderK(){const o=kOpsi(),reset=K.mode==='reset',list=K.scope==='kelas'?o.kl:K.scope==='angkatan'?o.an:[];
  if(K.scope!=='semua'&&!list.includes(K.val))K.val=list[0]||'';
  $('#kB').innerHTML=`<h3>Kirim akun ke email</h3>
   <div class="seg" id="kM"><button type="button" data-m="reset" class="${reset?'on':''}">Buat password baru &amp; kirim</button><button type="button" data-m="excel" class="${reset?'':'on'}">Kirim dari Excel yang sudah diunduh</button></div>
   ${reset?'<div class="warn">Sistem membuat <b>password baru</b> untuk tiap pelanggan lalu mengirimkannya ke email mereka. Password pada Excel yang diunduh sebelumnya <b>tidak berlaku lagi</b> bagi akun yang diproses.</div>'
    :`<div class="mu" style="margin:10px 0 4px">Gunakan berkas Excel daftar akun yang sebelumnya diunduh dari aplikasi. Password pada berkas tetap berlaku. Akun yang password-nya sudah diubah atau sudah aktivasi dilewati otomatis.</div><input type="file" id="kF" accept=".xlsx,.csv,text/csv">${K.rows.length?`<div class="mu" style="margin-top:6px"><b>${K.rows.length}</b> akun terbaca dari "${esc(K.file)}"</div>`:''}`}
   ${(reset||K.rows.length)?`<label>Kirim untuk</label><div class="seg" id="kS"><button type="button" data-s="kelas" class="${K.scope==='kelas'?'on':''}">Per kelas</button><button type="button" data-s="angkatan" class="${K.scope==='angkatan'?'on':''}">Per angkatan</button><button type="button" data-s="semua" class="${K.scope==='semua'?'on':''}">Semua pelanggan</button></div>
   ${K.scope!=='semua'?`<select id="kV" style="margin-top:8px">${list.map(v=>`<option value="${esc(v)}" ${v===K.val?'selected':''}>${K.scope==='angkatan'?'Angkatan ':'Kelas '}${esc(v)}</option>`).join('')||'<option value="">(belum ada data)</option>'}</select>`:''}
   ${reset?`<label style="display:flex;gap:8px;align-items:center;font-weight:400;margin-top:10px"><input type="checkbox" id="kB2" ${K.belum?'checked':''}> Hanya akun yang belum aktivasi (disarankan)</label>`:''}
   <div id="kPv" class="cust" style="margin-top:12px">Menghitung…</div>`:''}
   <div id="kPr" class="mu"></div><div id="kRs" class="wrap"></div>
   <div class="chips" style="margin-top:12px"><button class="btn sm" id="kGo" disabled>Kirim sekarang</button><button class="btn sm alt" id="kX">Tutup</button></div>`;
  if(reset||K.rows.length)kPreview();}
async function kPreview(){const pv=$('#kPv');
  if(K.mode==='reset'){const r=await api('userList',{grup:'pelanggan',status:'Aktif',kelas:K.scope==='kelas'?K.val:'',angkatan:K.scope==='angkatan'?K.val:'',aktivasi:K.belum?'belum':'',idsOnly:1});
    K.ids=r.ids;K.adaEmail=r.adaEmail;K.kuota=r.kuota;
    pv.innerHTML=`<b>${r.ids.length}</b> akun akan diproses, <b>${r.adaEmail}</b> di antaranya memiliki email.${r.ids.length-r.adaEmail?` <span style="color:var(--er)">${r.ids.length-r.adaEmail} tanpa email akan dilewati.</span>`:''}<div class="mu">Sisa kuota email Google hari ini: ${r.kuota<0?'tidak diketahui':r.kuota}</div>${r.kuota>=0&&r.adaEmail>r.kuota?'<div class="warn">Kuota tidak cukup untuk semua. Kirim per kelas lebih kecil, atau lanjutkan besok.</div>':''}`;
    $('#kGo').disabled=!r.adaEmail;}
  else{const rows=kRows();pv.innerHTML=`<b>${rows.length}</b> akun dalam pilihan ini.`;$('#kGo').disabled=!rows.length;}}
const kRows=()=>K.rows.filter(r=>K.scope==='semua'||(K.scope==='kelas'?r.kelas===K.val:angk(r.kelas)===K.val));
async function kBaca(f){try{const sheets=await bacaBerkas(f);let out=[];
  sheets.forEach(sh=>{const hi=sh.rows.findIndex(r=>r.some(c=>/username/i.test(c)));if(hi<0)return;const H=sh.rows[hi].map(normH),ix=n=>H.findIndex(h=>h.startsWith(n));
    const u=ix('username'),p=ix('password'),k=ix('kelas'),n=ix('nama');
    sh.rows.slice(hi+1).forEach(r=>{if(r[u]&&r[p])out.push({username:r[u],password:r[p],kelas:k>=0?r[k]:'',nama:n>=0?r[n]:''});});});
  if(!out.length)throw new Error('Kolom Username dan Password tidak ditemukan. Gunakan berkas daftar akun yang diunduh dari aplikasi.');
  K.rows=out;K.file=f.name;K.scope='kelas';renderK();}catch(e){toast(e.message,1);}}
$('#kB').addEventListener('change',e=>{const t=e.target;
  if(t.id==='kF'&&t.files[0])kBaca(t.files[0]);if(t.id==='kV'){K.val=t.value;kPreview();}if(t.id==='kB2'){K.belum=t.checked;kPreview();}});
$('#kB').addEventListener('click',e=>{const t=e.target;
  if(t.closest('#kM')&&t.dataset.m){K.mode=t.dataset.m;K.scope='kelas';K.val='';renderK();}
  if(t.closest('#kS')&&t.dataset.s){K.scope=t.dataset.s;K.val='';renderK();}
  if(t.id==='kX'){$('#dK').close();users();}
  if(t.id==='kGo')run(t,kKirim);});
async function kKirim(){const url=location.origin+location.pathname.replace(/[^/]*$/,'index.html'),reset=K.mode==='reset';
  const items=reset?K.ids:kRows(),label=K.scope==='semua'?'semua pelanggan':(K.scope==='angkatan'?'angkatan ':'kelas ')+K.val;
  if(!confirm('Kirim akun ke email untuk '+items.length+' akun ('+label+')?'+(reset?'\nPassword baru dibuat dan password lama tidak berlaku.':'\nBerkas Excel dipakai apa adanya.')))return;
  const hasil=[];let kuota=-1;$('#kGo').disabled=true;
  for(let i=0;i<items.length;i+=12){$('#kPr').textContent='Mengirim '+Math.min(i+12,items.length)+' / '+items.length+'… jangan tutup jendela ini';
    try{const r=await api('kirimAkun',reset?{mode:'reset',ids:items.slice(i,i+12),url}:{mode:'excel',rows:items.slice(i,i+12).map(x=>({username:x.username,password:x.password})),url});r.hasil.forEach(x=>hasil.push(x));kuota=r.kuota;}
    catch(e){toast(e.message,1);$('#kPr').innerHTML='<b style="color:var(--er)">Pengiriman dihentikan: '+esc(e.message)+'</b>';break;}}
  const ok=hasil.filter(x=>x.status==='terkirim'),bad=hasil.filter(x=>x.status!=='terkirim');
  if(hasil.length)$('#kPr').innerHTML=`<b>Selesai: ${ok.length} terkirim, ${bad.length} gagal/dilewati.</b>${kuota>=0?' Sisa kuota email hari ini: '+kuota+'.':''}`;
  $('#kRs').innerHTML=bad.length?'<h4>Tidak terkirim</h4>'+tbl([['Nama'],['Kelas'],['Email'],['Alasan']],bad.map(x=>[esc(x.nama),esc(x.kelas||''),esc(x.email||''),esc(x.status)])):'';
  if(reset)kPreview();}

// kenaikan kelas
$('#bNaik').onclick=()=>$('#dN').showModal();$('#nX').onclick=()=>$('#dN').close();
$('#nS').onclick=e=>run(e.target,async()=>{const map={};$('#nm').value.split('\n').forEach(l=>{const p=l.split('=');if(p.length===2&&p[0].trim())map[p[0].trim()]=p[1].trim();});
  const lulus=$('#nl').value.split(',').map(x=>x.trim()).filter(Boolean);if(!Object.keys(map).length&&!lulus.length)throw new Error('Isi pemetaan atau kelas lulus');
  if(!confirm('Jalankan kenaikan kelas untuk seluruh siswa? Tindakan ini tidak dapat dibatalkan massal.'))return;
  const r=await api('promote',{map,lulus});$('#dN').close();toast(r.naik+' naik kelas, '+r.lulus+' lulus');users();});

// ===== hak akses =====
async function izinLoad(){S.iz=await api('izinInfo');renderIzin();}
function renderIzin(){const d=S.iz,G=d.grup;let mod='',rows='';
  d.fitur.forEach(f=>{if(f.modul!==mod){mod=f.modul;rows+=`<tr class="gr"><td colspan="${G.length+2}">${esc(mod)}</td></tr>`;}
    rows+=`<tr><td><b>${esc(f.nama)}</b><div class="mu" style="font-size:12px">${esc(f.ket)}</div></td>`+G.map(g=>f.lock?'<td class="c mu">—</td>':`<td class="c"><label class="tg" style="margin:0"><input type="checkbox" data-f="${f.k}" data-g="${g.k}" ${f.now.includes(g.k)?'checked':''}><i></i></label></td>`).join('')+`<td class="c"><label class="tg" style="margin:0"><input type="checkbox" checked disabled><i></i></label></td></tr>`;});
  $('#iT').innerHTML=`<thead><tr><th>Fitur</th>${G.map(g=>`<th class="c">${esc(g.nama)}</th>`).join('')}<th class="c">Admin</th></tr></thead><tbody>${rows}</tbody>`;}
$('#iSimpan').onclick=e=>run(e.target,async()=>{const m={};S.iz.fitur.forEach(f=>{if(!f.lock)m[f.k]=[];});
  document.querySelectorAll('#iT input[data-f]').forEach(c=>{if(c.checked)m[c.dataset.f].push(c.dataset.g);});
  await api('saveIzin',{matrix:m});toast('Hak akses disimpan. Menu pengguna menyesuaikan saat login/muat ulang berikutnya.');await izinLoad();});
$('#iReset').onclick=()=>{document.querySelectorAll('#iT input[data-f]').forEach(c=>{const f=S.iz.fitur.find(x=>x.k===c.dataset.f);c.checked=f.def.includes(c.dataset.g);});toast('Dikembalikan ke bawaan. Klik "Simpan hak akses" untuk menerapkan.');};

// ===== laporan =====
document.querySelector('#t-lap .chips').onclick=e=>{const p=e.target.dataset.p;if(!p)return;$('#ls').value=D();$('#ld').value=p==='h'?D():p==='m'?ago(6):D().slice(0,8)+'01';};
$('#bLap').onclick=e=>run(e.target,async()=>{const dari=$('#ld').value,sampai=$('#ls').value;
  const [s,ow,k,a]=await Promise.all([api('salesReport',{dari,sampai}),api('owed',{dari,sampai}),api('cashCheck'),api('anomaly',{dari,sampai})]);
  const sum=f=>ow.reduce((x,o)=>x+o[f],0);
  const html=`<h3>Laporan Kantin</h3><p style="text-align:center;margin-top:0">Periode ${esc(dari)} s/d ${esc(sampai)}</p><div class="kp"><div class="card"><div class="mu">Penjualan</div><div class="big">${rp(s.penjualan)}</div></div><div class="card"><div class="mu">Keuntungan Kopsis</div><div class="big">${rp(s.untung)}</div></div><div class="card"><div class="mu">Deposit masuk</div><div class="big">${rp(s.deposit)}</div></div><div class="card"><div class="mu">Saldo beredar</div><div class="big">${rp(k.saldoBeredar)}</div></div></div>
   <h4>Penjualan harian</h4><div class="wrap">${tbl([['Tanggal'],['Transaksi','n'],['Total','n']],s.harian.map(x=>[esc(x.tgl),x.transaksi,fn(x.total)]))}</div>
   <h4>Barang terlaris</h4><div class="wrap">${tbl([['Barang'],['Jumlah','n'],['Nilai','n'],['Untung','n']],s.terlaris.map(x=>[esc(x.nama),x.jumlah,fn(x.nilai),fn(x.untung)]))}</div>
   <h4>Kewajiban &amp; pembayaran pemasok</h4><div class="wrap">${tbl([['Pemasok'],['Terjual','n'],['Dibayar','n'],['Kewajiban','n']],ow.map(o=>[esc(o.nama),fn(o.terjual),fn(o.dibayar),fn(o.kewajiban)]).concat([['<b>Total</b>',fn(sum('terjual')),fn(sum('dibayar')),fn(sum('kewajiban'))]]))}</div>
   <h4>Sisa stok (terendah dulu)</h4><div class="wrap">${tbl([['Barang'],['Stok','n']],s.stok.slice(0,15).map(x=>[esc(x.nama),x.stok]))}</div>
   <h4>Kejanggalan per kasir</h4><div class="wrap">${tbl([['Kasir'],['Transaksi','n'],['Manual','n'],['Batal','n']],a.map(x=>[esc(x.kasir),x.transaksi,x.manual,x.batal]))}</div>
   <p>${k.cocok?'✔ Kas cocok dengan saldo pelanggan.':'⚠ Kas tidak cocok. Selisih: '+rp(k.selisihAktual-k.selisihSeharusnya)}</p>`;
  const csv=['Tanggal,Transaksi,Total'].concat(s.harian.map(x=>[x.tgl,x.transaksi,x.total].join(','))).concat(['','Barang,Jumlah,Nilai,Untung']).concat(s.terlaris.map(x=>[csvq(x.nama),x.jumlah,x.nilai,x.untung].join(','))).concat(['','Pemasok,Terjual,Dibayar,Kewajiban']).concat(ow.map(o=>[csvq(o.nama),o.terjual,o.dibayar,o.kewajiban].join(','))).join('\n');
  S.rep={html,csv};$('#lap').innerHTML=`<div class="card" style="margin-top:12px"><div class="chips" style="margin-bottom:8px"><button class="btn sm" id="bPr">Cetak / Pratinjau</button></div><div class="wrap">${html}</div></div>`;});
$('#lap').onclick=e=>{if(e.target.id==='bPr')previewCetak(S.rep.html,{csv:S.rep.csv,nama:'laporan-kepala',judul:'Laporan Kantin',ttd:['Kepala Kantin']});};
let tc;$('#cq').oninput=e=>{clearTimeout(tc);tc=setTimeout(()=>run(null,async()=>{const r=await api('search',{q:e.target.value});
  $('#ch').innerHTML=r.map(x=>`<div class="row"><span>${esc(x.nama)} <small class="mu">${esc(x.kelas)}</small></span><button class="btn sm alt" data-h="${esc(x.id)}">Riwayat</button></div>`).join('');}),350);};
$('#ch').onclick=e=>{const id=e.target.dataset.h;if(id)run(e.target,async()=>{const r=await api('custHistory',{idPengguna:id,page:0,size:30,hari:Number($('#chd').value),ringkas:1});
  $('#chr').innerHTML=(r.ringkas?`<div class="cust"><b>Belanja pada periode ini: ${rp(r.belanja)}</b>${r.ringkas.length?`<table style="margin-top:6px"><tr><th>Barang</th><th class="n">Jumlah</th><th class="n">Nilai</th></tr>${r.ringkas.slice(0,10).map(x=>`<tr><td>${esc(x.nama)}</td><td class="n">${x.jumlah}</td><td class="n">${rp(x.nilai)}</td></tr>`).join('')}</table>`:''}</div>`:'')+r.rows.map(o=>`<div class="row"><span>${esc(o.waktu)} <span class="tag">${esc(o.status)}</span><br><small class="mu">${o.items.map(i=>i.qty+'× '+esc(i.nama)).join(', ')}</small></span><b>${rp(o.total)}</b></div>`).join('')||'<span class="mu">Belum ada transaksi</span>';});};

// ===== pengaturan, identitas & tema =====
const PRE=[['Hijau tua','#14532d'],['Zamrud','#047857'],['Biru tua','#1e3a8a'],['Hijau botol','#0b4a33'],['Marun','#7f1d1d'],['Abu gelap','#334155']];
function setForm(){const c=S.cfg;
  const inp=(k,l,t,x)=>`<div><label>${l}</label><input type="${t||'text'}" data-k="${k}" value="${esc(c[k]||'')}" ${x||''}></div>`;
  const sel=(k,l,o)=>`<div><label>${l}</label><select data-k="${k}">${o.map(x=>`<option value="${x[0]}" ${String(c[k])===x[0]?'selected':''}>${x[1]}</option>`).join('')}</select></div>`;
  const YT=[['Ya','Aktif'],['Tidak','Nonaktif']],STR=[['cetak','Cetak struk'],['email','Kirim ke email pelanggan'],['cetak_email','Cetak dan email (pilih saat transaksi)'],['tidak','Tidak ada struk']];
  const hm=[0,1,2,3,4,5,6,7].map(n=>[String(n),n===0?'Hari yang sama dengan tanggal ambil':n===1?'H-1 (sehari sebelum tanggal ambil)':'H-'+n+' ('+n+' hari sebelum tanggal ambil)']);
  $('#setBox').innerHTML=`
  <div class="card"><h3 style="margin-top:0">Identitas sekolah</h3><div class="fgrid">${inp('nama_sekolah','Nama sekolah')}${inp('nama_kantin','Nama kantin / aplikasi')}<div class="full">${inp('alamat','Alamat')}</div>${inp('telepon','Nomor telepon')}${inp('teks_struk','Teks tambahan struk')}</div>
   <label>Logo sekolah (otomatis diperkecil, tampil di halaman login, menu, struk, dan kop laporan)</label><div class="row" style="border:0;justify-content:flex-start;gap:14px"><img id="lgPrev" alt="" class="${c.logo?'':'hide'}" src="${c.logo?esc(c.logo):''}" style="height:64px;max-width:160px;object-fit:contain;border:1px solid var(--bd);border-radius:8px;padding:4px;background:#fff"><input type="file" id="lg" accept="image/*"></div></div>
  <div class="card" style="margin-top:14px"><h3 style="margin-top:0">Warna tema</h3><div>${PRE.map(p=>`<button type="button" class="sw" data-c="${p[1]}" style="background:${p[1]}" title="${p[0]}"></button>`).join('')}<input type="color" id="cp" value="${esc(c.warna_utama||'#14532d')}" style="vertical-align:middle;width:50px;min-height:42px;padding:2px"> <input type="text" id="ch2" value="${esc(c.warna_utama||'#14532d')}" style="width:110px;display:inline-block"></div>
   <div class="prev" id="prev"><div class="h">Contoh header</div><div class="b"><span class="k">Tombol contoh</span> <span id="ctr" class="mu"></span></div></div></div>
  <div class="card" style="margin-top:14px"><h3 style="margin-top:0">Pemesanan pre-order</h3><div class="fgrid">${sel('preorder_aktif','Pre-order',YT)}${inp('jam_batas_preorder','Jam batas pemesanan','time','required')}${sel('preorder_h_minus','Pemesanan ditutup',hm)}${inp('jam_batas_ambil','Jam batas pengambilan','time','required')}${inp('batas_batal_menit','Batas pembatalan cepat (menit)','number','min="0"')}${sel('kebijakan_refund','Pengembalian pesanan yang sudah diproses',[['penuh','Penuh'],['sebagian','Sebagian'],['tidak','Tidak dikembalikan']])}${inp('refund_persen','Persen pengembalian jika sebagian','number','min="0" max="100"')}</div>
   <p class="mu" style="margin-bottom:0">Jam batas berlaku pada hari penutupan yang dipilih. Contoh: H-1 pukul 14:00 berarti pesanan untuk besok ditutup hari ini pukul 14:00.</p></div>
  <div class="card" style="margin-top:14px"><h3 style="margin-top:0">Keuangan &amp; keamanan</h3><div class="fgrid">${inp('batas_jajan_default','Batas jajan harian siswa (Rp, 0 = nonaktif)','number','min="0"')}${inp('maks_darurat','Maksimal nominal mode darurat (Rp)','number','min="0"')}${inp('saldo_menipis','Ambang saldo menipis (Rp)','number','min="0"')}${sel('pin_kasir_wajib','PIN pelanggan di kasir',[['Ya','Wajib'],['Tidak','Tidak wajib']])}${sel('pin_pesan_wajib','PIN pelanggan saat pesan lewat aplikasi',[['Ya','Wajib'],['Tidak','Tidak wajib']])}</div></div>
  <div class="card" style="margin-top:14px"><h3 style="margin-top:0">Struk &amp; email</h3><div class="fgrid">${sel('struk_kasir','Struk pembelian di Kasir',STR)}${sel('struk_bendahara','Bukti deposit di Bendahara',STR)}${sel('struk_otomatis','Kirim email otomatis setelah transaksi',[['Tidak','Tidak (kirim manual dengan tombol)'],['Ya','Ya (jika pelanggan punya email)']])}${sel('notif_email_aktif','Notifikasi email wali (kuota email Google terbatas)',[['Tidak','Nonaktif'],['Ya','Aktif']])}</div>
   <p class="mu" style="margin-bottom:0">Pengiriman email memakai akun Google pemilik skrip (kuota harian terbatas). Pelanggan perlu memiliki email di data akunnya.</p></div>
  <div class="card" style="margin-top:14px"><h3 style="margin-top:0">Cetak laporan</h3><div class="fgrid">${sel('kertas_laporan','Ukuran kertas bawaan',[['A4','A4 (210 × 297 mm)'],['F4','Folio / F4 (210 × 330 mm)']])}</div></div>
  <div class="card" style="margin-top:14px"><h3 style="margin-top:0">Kartu, foto &amp; arsip</h3><div class="fgrid">${sel('foto_siswa_aktif','Foto pelanggan di kasir (butuh izin orang tua dan sekolah)',[['Tidak','Nonaktif'],['Ya','Aktif']])}${sel('kartu_format','Format kode kartu',[['teks','Apa adanya'],['hex_ke_desimal','Heksadesimal ke desimal']])}${sel('kartu_urutan_byte','Urutan byte kartu',[['normal','Normal'],['balik','Dibalik']])}${sel('arsip_otomatis','Arsip otomatis tiap bulan',YT)}${inp('arsip_simpan_bulan','Data yang disimpan di aplikasi (bulan terakhir)','number','min="1"')}</div></div>
  <button class="btn" id="bSet" style="margin-top:16px;position:sticky;bottom:12px;box-shadow:0 6px 20px rgba(0,0,0,.2)">Simpan pengaturan</button>`;prev(c.warna_utama||'#14532d');}
function prev(g){if(!/^#[0-9a-f]{6}$/i.test(g)){$('#ctr').textContent='Kode warna harus seperti #14532d';return;}
  const el=$('#prev').style,on=lum(g)>.4?'#10201a':'#ffffff',l1=lum(g),l2=lum(on),r=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
  el.setProperty('--g',g);el.setProperty('--gl',mix(g,1,.88));el.setProperty('--on',on);$('#cp').value=g;$('#ch2').value=g;
  $('#ctr').textContent='Kontras teks '+r.toFixed(1)+':1 '+(r>=4.5?'✔ terbaca':'⚠ kurang terbaca, pilih warna lain');}
$('#setBox').onclick=e=>{if(e.target.dataset.c)prev(e.target.dataset.c);};
$('#setBox').oninput=e=>{if(e.target.id==='cp'||e.target.id==='ch2')prev(e.target.value);};
$('#setBox').onchange=async e=>{if(e.target.id!=='lg'||!e.target.files[0])return;try{S.logo=await logoFile(e.target.files[0]);$('#lgPrev').src=S.logo;$('#lgPrev').classList.remove('hide');toast('Logo siap disimpan ('+Math.round(S.logo.length*.75/1024)+' KB). Klik Simpan pengaturan.');}catch(err){toast(err.message,1);e.target.value='';}};
function logoFile(f){return new Promise((res,rej)=>{
  if(f.type==='image/svg+xml'){const r=new FileReader();r.onload=()=>r.result.length<=45000?res(r.result):rej(new Error('SVG terlalu besar'));r.readAsDataURL(f);return;}
  const img=new Image();img.onload=()=>{let sc=Math.min(1,320/img.width,320/img.height),w=Math.round(img.width*sc),h=Math.round(img.height*sc);
    const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);let out=c.toDataURL('image/png');
    for(let q=.9;out.length>45000&&q>.3;q-=.15)out=c.toDataURL('image/webp',q);
    out.length>45000?rej(new Error('Logo terlalu detail, gunakan gambar yang lebih sederhana')):res(out);};
  img.onerror=()=>rej(new Error('File gambar tidak valid'));img.src=URL.createObjectURL(f);});}
$('#setBox').addEventListener('click',e=>{if(e.target.id!=='bSet')return;run(e.target,async()=>{
  const nilai={};document.querySelectorAll('#setBox [data-k]').forEach(i=>nilai[i.dataset.k]=i.value.trim());
  ['jam_batas_preorder','jam_batas_ambil'].forEach(k=>{if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(nilai[k]||''))throw new Error('Pilih jam batas dengan pemilih waktu (contoh 09:00)');});
  const g=$('#ch2').value.trim();if(!/^#[0-9a-f]{6}$/i.test(g))throw new Error('Kode warna tidak valid');nilai.warna_utama=g;if(S.logo)nilai.logo=S.logo;
  await api('saveCfg',{nilai});Object.assign(S.cfg,nilai);S.logo=null;applyTheme(S.cfg);toast('Pengaturan tersimpan');});});

// ===== pengarsipan =====
$('#arD').value=D().slice(0,8)+'01';
$('#bArsip').onclick=e=>run(e.target,async()=>{const d=$('#arD').value;if(!d)throw new Error('Pilih tanggal batas');
  if(!confirm('Arsipkan semua transaksi sebelum '+d+'?\nData dipindah ke Spreadsheet arsip dan tidak tampil lagi di aplikasi.'))return;
  const r=await api('arsip',{sebelum:d});
  $('#arR').innerHTML=`<div class="cust" style="margin-top:10px">Selesai. ${Object.keys(r.jumlah).map(k=>k+': '+r.jumlah[k]).join(', ')}<br>Kas ${r.kasCocok?'cocok ✔':'⚠ tidak cocok'} · Ledger ${r.ledgerCocok?'konsisten ✔':'⚠ tidak konsisten'}<br><a href="${esc(r.url)}" target="_blank" rel="noopener">Buka file arsip</a></div>`;});

// ===== log =====
async function logs(reset){const r=await api('logs',{page:S.logPage,size:40});
  const rows=r.rows.map(l=>`<tr><td>${esc(l.waktu)}</td><td>${esc(l.petugas)}</td><td>${esc(l.aksi)}</td><td>${esc(l.detail)}</td></tr>`).join('');
  if(reset)$('#logT').innerHTML='<tr><th>Waktu</th><th>Petugas</th><th>Aksi</th><th>Detail</th></tr>';$('#logT').insertAdjacentHTML('beforeend',rows);
  $('#logMore').classList.toggle('hide',(S.logPage+1)*40>=r.total);}
$('#logMore').onclick=e=>run(e.target,async()=>{S.logPage++;await logs();});
}
