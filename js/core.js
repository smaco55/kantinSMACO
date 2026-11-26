const VERSI='20261125a';
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rp=n=>'Rp'+Number(n).toLocaleString('id-ID');
const PAGE=location.pathname.split('/').pop()||'index.html';
async function api(action,data){
  const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify(Object.assign({},data,{action,token:sessionStorage.getItem('tok')}))});
  const j=await r.json();
  if(!j.ok){ if(/Sesi berakhir/.test(j.error)&&action!=='login'){sessionStorage.clear();location.href='index.html';} throw new Error(j.error); }
  if(action==='init'&&j.data&&j.data.izin)sessionStorage.setItem('izin',JSON.stringify(j.data.izin)); // izin selalu mengikuti pengaturan terbaru
  return j.data;
}
let _tt;function toast(m,err){const t=$('#toast');if(!t)return;t.textContent=m;t.className=err?'er':'';t.style.display='block';clearTimeout(_tt);_tt=setTimeout(()=>t.style.display='none',err?5500:2600);}
// jalankan aksi dengan tombol dinonaktifkan (cegah klik ganda)
async function run(btn,fn){if(btn&&btn.disabled)return;if(btn)btn.disabled=true;try{return await fn();}catch(e){toast(e.message,1);}finally{if(btn)btn.disabled=false;}}
function poll(fn,ms,active){setInterval(()=>{if(!document.hidden&&(!active||active()))fn().catch(()=>{});},ms);}
function logout(){sessionStorage.clear();location.href='index.html';}
const rid=()=>'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,8); // kunci transaksi: kirim ulang tidak jadi ganda

/* ===== menu & hak akses ===== */
const GRUP_NAMA={kepala:'Kepala Kantin / Admin',bendahara:'Bendahara',kasir:'Kasir',pencatat:'Petugas Pencatat / Gudang',pelanggan:'Pelanggan',wali:'Orang Tua (Wali)'};
const GP={kepala:'kepala.html',kasir:'kasir.html',bendahara:'bendahara.html',pencatat:'pencatat.html',pelanggan:'pelanggan.html',wali:'wali.html'};
const DEF={kepala:'dash',kasir:'jual',bendahara:'dep',pencatat:'hari',pelanggan:'pesan'};
// [fitur, nama menu, halaman, tab, kelompok, ikon]
const NAV=[
 ['kepala.dasbor','Dasbor','kepala.html','dash','Administrasi','grid'],['kepala.akun','Akun Pengguna','kepala.html','akun','Administrasi','users'],
 ['kepala.izin','Hak Akses','kepala.html','izin','Administrasi','shield'],['kepala.lap','Laporan','kepala.html','lap','Administrasi','file'],
 ['kepala.set','Pengaturan','kepala.html','set','Administrasi','sliders'],['kepala.log','Log Aktivitas','kepala.html','log','Administrasi','list'],
 ['kasir.jual','Penjualan','kasir.html','jual','Kasir','cart'],['kasir.antre','Antrean Pre-order','kasir.html','antre','Kasir','clock'],
 ['kasir.stok','Barang Habis','kasir.html','stok','Kasir','box'],['kasir.tutup','Tutup Kasir','kasir.html','tutup','Kasir','book'],
 ['bendahara.dep','Deposit Saldo','bendahara.html','dep','Bendahara','wallet'],['bendahara.kor','Koreksi & Refund','bendahara.html','kor','Bendahara','repeat'],
 ['bendahara.pem','Pemasok & Kopsis','bendahara.html','pem','Bendahara','truck'],['bendahara.kas','Kas & Laporan','bendahara.html','kas','Bendahara','book'],
 ['pencatat.hari','Barang Hari Ini','pencatat.html','hari','Gudang','grid'],['pencatat.masuk','Barang Masuk','pencatat.html','masuk','Gudang','box'],
 ['pencatat.rekap','Rekap Pesanan','pencatat.html','rekap','Gudang','list'],['pencatat.order','Pesan ke Pemasok','pencatat.html','order','Gudang','truck'],
 ['pencatat.barang','Data Barang','pencatat.html','barang','Gudang','edit'],['pencatat.pem','Data Pemasok','pencatat.html','pem','Gudang','users'],
 ['pencatat.retur','Retur & Opname','pencatat.html','retur','Gudang','repeat'],['pencatat.stok','Kartu Stok','pencatat.html','stok','Gudang','book'],
 ['pelanggan.pesan','Pesan Makanan','pelanggan.html','pesan','Pelanggan','cart'],['pelanggan.pes','Pesananku','pelanggan.html','pes','Pelanggan','list'],
 ['pelanggan.saldo','Saldo & PIN','pelanggan.html','saldo','Pelanggan','wallet'],
 ['wali.pantau','Pantau Anak','wali.html','','Orang Tua','heart']];
const ICON={grid:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',users:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
 shield:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8',
 sliders:'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
 cart:'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',clock:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
 box:'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
 wallet:'M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4z',edit:'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
 truck:'M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
 book:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',repeat:'M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3',
 heart:'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',menu:'M3 12h18M3 6h18M3 18h18'};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[n]||ICON.grid}"/></svg>`;
function izin(){try{return JSON.parse(sessionStorage.getItem('izin')||'[]');}catch(e){return [];}}
const bisa=f=>izin().includes(f);
function homeUrl(){const iz=izin(),g=sessionStorage.getItem('hak')||sessionStorage.getItem('grup'),h=GP[g];if(h&&iz.some(f=>f.split('.')[0]===g))return h;const n=NAV.find(x=>iz.includes(x[0]));return n?n[2]:'index.html';}
function guard(page){
  if(!sessionStorage.getItem('tok')){location.href='index.html';return false;}
  const iz=izin();
  if(!iz.some(f=>f.split('.')[0]===page)){const h=homeUrl();if(h&&h!==PAGE&&h!=='index.html')location.href=h;else logout();return false;}
  document.body.dataset.page=page;
  let t;const rs=()=>{clearTimeout(t);t=setTimeout(logout,30*60*1000);};['click','keydown','touchstart'].forEach(e=>addEventListener(e,rs));rs();
  chrome(page,iz);
  if(['kasir','bendahara','pencatat','kepala'].includes(page)){const w=()=>fetch(API_URL+'?ping=1').catch(()=>{});w();setInterval(()=>{if(!document.hidden)w();},240000);} // jaga server tetap siap (lebih cepat)
  return true;}

// kerangka halaman: menu samping, bilah atas, kotak ganti password
function chrome(page,iz){
  const grup=sessionStorage.getItem('grup'),nama=sessionStorage.getItem('nama')||'',main=document.querySelector('main');if(!main)return;
  const app=document.createElement('div');app.className='app';
  const side=document.createElement('aside');side.className='side';
  const sembunyi=grup==='kepala'?['pelanggan.html','wali.html']:[];
  const items=NAV.filter(n=>iz.includes(n[0])&&!sembunyi.includes(n[2]));let h='',cur='';
  items.forEach(n=>{if(n[4]!==cur){cur=n[4];h+=`<div class="gh">${n[4]}</div>`;}
    h+=(n[2]===PAGE&&n[3])?`<button type="button" data-t="${n[3]}">${ic(n[5])}<span>${n[1]}</span></button>`:`<a class="mi" href="${n[2]}${n[3]?'?t='+n[3]:''}">${ic(n[5])}<span>${n[1]}</span></a>`;});
  side.innerHTML=`<div class="brand"><img id="hdrLogo" class="hide" alt=""><div class="bt"><b id="hdrName">Kantin Digital</b><small id="hdrSek"></small></div></div><nav id="tabs">${h}</nav>
   <div class="me"><div class="who"><div class="av">${esc((nama||'?').trim().charAt(0).toUpperCase())}</div><div><div class="nm">${esc(nama)}</div><div class="rl">${esc(GRUP_NAMA[grup]||'')}</div></div></div>
   <div class="ac"><button type="button" id="bGp">Ganti Password</button><button type="button" id="bKeluar">Keluar</button></div><div class="ver">Versi ${VERSI}</div></div>`;
  const content=document.createElement('div');content.className='content';
  const top=document.createElement('div');top.className='top';
  top.innerHTML=`<button type="button" id="mb" aria-label="Menu">${ic('menu')}</button><h1 id="pgTitle"></h1>${page==='kasir'?'<span class="clk" id="clk"></span>':''}${page==='pelanggan'?'<span class="sal" id="saldoH"></span>':''}`;
  const scrim=document.createElement('div');scrim.className='scrim';
  main.parentNode.insertBefore(app,main);content.appendChild(top);content.appendChild(main);app.appendChild(side);app.appendChild(content);document.body.appendChild(scrim);
  const close=()=>document.body.classList.remove('mo');$('#mb').onclick=()=>document.body.classList.toggle('mo');scrim.onclick=close;
  $('#bKeluar').onclick=logout;$('#bGp').onclick=openPw;
  const own=[...side.querySelectorAll('#tabs button')],want=new URLSearchParams(location.search).get('t'),def=DEF[page];
  const target=own.find(b=>b.dataset.t===want)||own.find(b=>b.dataset.t===def)||own[0];
  const lbl=b=>b?b.textContent.trim():((NAV.find(n=>n[2]===PAGE)||[])[1]||'');
  $('#pgTitle').textContent=lbl(target)||'Kantin';
  if(target){if(target.dataset.t===def)target.classList.add('on');else setTimeout(()=>target.click(),0);}
  $('#tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b){$('#pgTitle').textContent=lbl(b);close();scrollTo(0,0);}});
  const d=document.createElement('dialog');d.id='dPw';d.innerHTML='<h3>Ganti Password</h3><label>Password lama</label><input type="password" id="pwL" autocomplete="current-password"><label>Password baru (minimal '+minPw()+' karakter)</label><input type="password" id="pwB" autocomplete="new-password"><label>Ulangi password baru</label><input type="password" id="pwU" autocomplete="new-password"><label style="display:flex;gap:6px;align-items:center;font-weight:400"><input type="checkbox" id="pwS"> Tampilkan password</label><button class="btn" id="pwOk" style="margin-top:14px">Simpan</button><button class="btn alt" id="pwX" style="margin-top:8px">Batal</button>';
  document.body.appendChild(d);
  $('#pwS').onchange=e=>['pwL','pwB','pwU'].forEach(i=>$('#'+i).type=e.target.checked?'text':'password');
  $('#pwX').onclick=()=>d.close();
  $('#pwOk').onclick=e=>run(e.target,async()=>{const a=$('#pwL').value,n=$('#pwB').value;
    if(n.length<minPw())throw new Error('Password baru minimal '+minPw()+' karakter');if(n!==$('#pwU').value)throw new Error('Ulangi password baru tidak sama');
    await api('changePassword',{lama:a,baru:n});d.close();toast('Password berhasil diganti');});
  try{applyTheme(JSON.parse(localStorage.getItem('theme')));}catch(e){}}
const minPw=()=>['kasir','bendahara','pencatat','kepala'].includes(sessionStorage.getItem('role'))?8:4;
function openPw(){['pwL','pwB','pwU'].forEach(i=>$('#'+i).value='');$('#dPw').showModal();$('#pwL').focus();}

/* ===== tema ===== */
function mix(h,t,a){const n=parseInt(h.slice(1),16),r=n>>16,g=n>>8&255,b=n&255,T=t?255:0,f=x=>Math.round(x+(T-x)*a).toString(16).padStart(2,'0');return '#'+f(r)+f(g)+f(b);}
function lum(h){const n=parseInt(h.slice(1),16);return [n>>16,n>>8&255,n&255].map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);}
function applyTheme(c){if(!c||!/^#[0-9a-f]{6}$/i.test(c.warna_utama||''))return;const s=document.documentElement.style,g=c.warna_utama;
  s.setProperty('--g',g);s.setProperty('--gd',mix(g,0,.25));s.setProperty('--gl',mix(g,1,.88));s.setProperty('--ga',mix(g,1,.35));
  s.setProperty('--on',lum(g)>.4?'#10201a':'#fff');
  const h=$('#hdrName');if(h)h.textContent=c.nama_kantin||'Kantin';const sk=$('#hdrSek');if(sk)sk.textContent=c.nama_sekolah||'';
  const lg=$('#hdrLogo');if(lg&&c.logo){lg.src=c.logo;lg.classList.remove('hide');}
  try{localStorage.setItem('theme',JSON.stringify(c));}catch(e){}}

/* ===== cetak: A4 / Folio (F4) / struk 58 mm, dicetak lewat dokumen bersih agar posisi tidak berantakan ===== */
const cfgNow=()=>{try{return JSON.parse(localStorage.getItem('theme'))||{};}catch(e){return {};}};
function kopHtml(){const c=cfgNow();return `<div class="kop">${c.logo?`<img src="${c.logo}" alt="">`:''}<div class="kt"><div class="k1">${esc(c.nama_sekolah||'')}</div><div class="k2">${esc(c.nama_kantin||'')}</div><div class="k3">${esc([c.alamat,c.telepon?'Telp. '+c.telepon:''].filter(Boolean).join(' · '))}</div></div></div><div class="gr"></div>`;}
const KERTAS={A4:['210mm','297mm','A4 (210 × 297 mm)'],F4:['210mm','330mm','Folio / F4 (210 × 330 mm)']};
function printCss(k,land){
  if(k==='struk')return '@page{size:58mm auto;margin:2mm}*{box-sizing:border-box}body{font:11.5px/1.35 ui-monospace,Menlo,Consolas,monospace;width:54mm;margin:0;color:#000}.r{display:flex;justify-content:space-between;gap:6px}hr{border:0;border-top:1px dashed #000;margin:5px 0}';
  const w=KERTAS[k]||KERTAS.A4,size=land?w[1]+' '+w[0]:w[0]+' '+w[1];
  return `@page{size:${size};margin:14mm 14mm 16mm}*{box-sizing:border-box}body{font:10.5pt/1.4 "Segoe UI",Arial,sans-serif;color:#111;margin:0}
.kop{display:flex;align-items:center;gap:14px}.kop img{height:58px;width:auto}.kt{flex:1;text-align:center}.k1{font-size:15pt;font-weight:700;text-transform:uppercase;letter-spacing:.4px}.k2{font-size:12pt;font-weight:600}.k3{font-size:9pt;color:#444;margin-top:1px}
.gr{border-top:3px double #111;margin:6px 0 12px}h3{font-size:12.5pt;margin:10px 0 4px;text-align:center}h4{font-size:11pt;margin:14px 0 5px;border-bottom:1px solid #888;padding-bottom:2px;page-break-after:avoid}
p{margin:4px 0}table{width:100%;border-collapse:collapse;margin:4px 0 10px;font-size:9.5pt}th,td{border:1px solid #777;padding:3.5px 6px;vertical-align:top;text-align:left}th{background:#e9ecea;font-weight:700}
td.n,th.n{text-align:right;white-space:nowrap}thead{display:table-header-group}tr{page-break-inside:avoid;break-inside:avoid}
.kp{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}.kp .card{flex:1 1 30%;border:1px solid #777;padding:5px 8px}.mu{color:#555}.big{font-size:12pt;font-weight:700}
.warn,.cust{border:1px solid #999;padding:5px 8px;margin:6px 0}.row{display:flex;justify-content:space-between;gap:12px;border-bottom:1px dotted #bbb;padding:2px 0}.tag{border:1px solid #777;padding:0 5px;font-size:9pt}
.ttd{display:flex;justify-content:space-around;margin-top:26px;page-break-inside:avoid}.ttd div{text-align:center;min-width:150px}.ttd .sp{height:62px}.tgl{text-align:right;margin-top:14px}details{display:block}summary{display:none}`;}
function printHtml(inner,o){o=o||{};const k=o.kertas||'A4',struk=k==='struk';
  const ttd=(!struk&&o.ttd&&o.ttd.length)?`<div class="tgl">${esc(cfgNow().alamat?'':'')}${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div><div class="ttd">${o.ttd.map(j=>`<div>${esc(j)}<div class="sp"></div>(............................)</div>`).join('')}</div>`:'';
  const f=document.createElement('iframe');f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';document.body.appendChild(f);
  const d=f.contentWindow.document;d.open();d.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(o.judul||'Cetak')}</title><style>${printCss(k,!!o.landscape)}</style></head><body>${struk||o.kop===false?'':kopHtml()}${inner}${ttd}</body></html>`);d.close();
  setTimeout(()=>{try{f.contentWindow.focus();f.contentWindow.print();}catch(e){toast('Gagal membuka jendela cetak',1);}setTimeout(()=>f.remove(),4000);},350);}
// pratinjau laporan + pilihan kertas (default dari pengaturan Admin)
function previewCetak(html,o){o=o||{};let d=$('#dPrev');
  if(!d){d=document.createElement('dialog');d.id='dPrev';d.className='xl';
    d.innerHTML='<h3>Pratinjau cetak</h3><div class="pvbar"><div><label>Ukuran kertas</label><select id="pvK"><option value="A4">A4 (210 × 297 mm)</option><option value="F4">Folio / F4 (210 × 330 mm)</option></select></div><div><label>Orientasi</label><select id="pvO"><option value="p">Potret</option><option value="l">Lanskap</option></select></div><button class="btn sm" id="pvP">Cetak</button><button class="btn sm alt hide" id="pvC">Unduh CSV</button><button class="btn sm alt hide" id="pvX">Unduh Excel</button><button class="btn sm alt" id="pvT">Tutup</button></div><div class="paper" id="pvB"></div>';
    document.body.appendChild(d);$('#pvT').onclick=()=>d.close();}
  $('#pvB').innerHTML=html;$('#pvK').value=cfgNow().kertas_laporan==='F4'?'F4':'A4';$('#pvO').value=o.landscape?'l':'p';
  $('#pvP').onclick=()=>printHtml(html,{kertas:$('#pvK').value,landscape:$('#pvO').value==='l',judul:o.judul,ttd:o.ttd});
  $('#pvC').classList.toggle('hide',!o.csv);$('#pvC').onclick=()=>unduhTeks((o.nama||'laporan')+'.csv',o.csv);
  $('#pvX').classList.toggle('hide',!o.xlsx);$('#pvX').onclick=()=>o.xlsx();d.showModal();}
function unduhTeks(nama,txt,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+txt],{type:type||'text/csv;charset=utf-8'}));a.download=nama;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
// struk (deposit/pembelian): tombol cetak / email mengikuti pengaturan Admin
function modeStruk(c,jenis){const m=(jenis==='beli'?c.struk_kasir:c.struk_bendahara)||'cetak';return {cetak:m==='cetak'||m==='cetak_email',email:m==='email'||m==='cetak_email',ada:m!=='tidak',otomatis:c.struk_otomatis==='Ya'&&(m==='email'||m==='cetak_email')};}
function strukHtml(c,judul,meta,items,totals,foot){return `<div style="text-align:center"><b>${esc(c.nama_sekolah||'')}</b><br>${esc(c.nama_kantin||'')}<br>${esc(c.alamat||'')}</div><hr><b>${esc(judul)}</b><br>${meta.map(esc).join('<br>')}<hr>${items.map(i=>`${esc(i[0])}<div class="r"><span>${esc(i[1])}</span><span>${esc(i[2])}</span></div>`).join('')}${items.length?'<hr>':''}${totals.map(t=>`<div class="r"><span>${t[2]?'<b>'+esc(t[0])+'</b>':esc(t[0])}</span><span>${t[2]?'<b>'+esc(t[1])+'</b>':esc(t[1])}</span></div>`).join('')}<hr><div style="text-align:center">${esc(foot||'')}</div>`;}

/* ===== baca berkas Excel (.xlsx) atau CSV untuk impor ===== */
function parseCsv(t){t=t.replace(/^\ufeff/,'');const first=t.split(/\r?\n/)[0]||'',sep=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';
  return t.split(/\r?\n/).filter(l=>l.trim()).map(l=>{const o=[];let c='',q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(ch==='"'){if(q&&l[i+1]==='"'){c+='"';i++;}else q=!q;}else if(ch===sep&&!q){o.push(c.trim());c='';}else c+=ch;}o.push(c.trim());return o;});}
async function inflateRaw(u8){const s=new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return new Uint8Array(await new Response(s).arrayBuffer());}
async function bacaXlsx(buf){
  if(typeof DecompressionStream==='undefined')throw new Error('Browser belum mendukung baca Excel. Gunakan Chrome/Edge terbaru atau simpan sebagai CSV.');
  const u=new Uint8Array(buf),dv=new DataView(buf),td=new TextDecoder();let e=u.length-22;while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;
  if(e<0)throw new Error('File Excel tidak valid');
  const cnt=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const F={};
  for(let i=0;i<cnt;i++){const nl=dv.getUint16(p+28,true),el=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true);F[td.decode(u.subarray(p+46,p+46+nl))]={m:dv.getUint16(p+10,true),c:dv.getUint32(p+20,true),o:dv.getUint32(p+42,true)};p+=46+nl+el+cl;}
  const get=async n=>{const f=F[n];if(!f)return null;const ln=dv.getUint16(f.o+26,true),le=dv.getUint16(f.o+28,true),st=f.o+30+ln+le,d=u.subarray(st,st+f.c);return td.decode(f.m===0?d:await inflateRaw(d));};
  const X=s=>new DOMParser().parseFromString(s,'application/xml');
  const ss=[];const sx=await get('xl/sharedStrings.xml');if(sx)[...X(sx).getElementsByTagName('si')].forEach(si=>ss.push([...si.getElementsByTagName('t')].map(t=>t.textContent).join('')));
  const wb=X(await get('xl/workbook.xml')),rel=X(await get('xl/_rels/workbook.xml.rels')),tg={};[...rel.getElementsByTagName('Relationship')].forEach(r=>tg[r.getAttribute('Id')]=r.getAttribute('Target'));
  const out=[];
  for(const sh of [...wb.getElementsByTagName('sheet')]){
    const id=sh.getAttribute('r:id')||sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');let t=(tg[id]||'').replace(/^\//,'');if(!/^xl\//.test(t))t='xl/'+t;
    const xs=await get(t);if(!xs)continue;const rows=[];
    [...X(xs).getElementsByTagName('row')].forEach(r=>{const a=[];[...r.getElementsByTagName('c')].forEach(c=>{const ref=c.getAttribute('r')||'',m=ref.match(/^([A-Z]+)/);let ci=0;if(m)for(const ch of m[1])ci=ci*26+ch.charCodeAt(0)-64;ci=Math.max(0,ci-1);
      const ty=c.getAttribute('t'),v=c.getElementsByTagName('v')[0],is=c.getElementsByTagName('is')[0];let val='';
      if(ty==='s'&&v)val=ss[Number(v.textContent)]||'';else if(ty==='inlineStr'&&is)val=[...is.getElementsByTagName('t')].map(x=>x.textContent).join('');else if(v)val=v.textContent;
      a[ci]=String(val).trim();});for(let i=0;i<a.length;i++)if(a[i]===undefined)a[i]='';if(a.some(x=>x!==''))rows.push(a);});
    out.push({name:sh.getAttribute('name'),rows});}
  return out;}
async function bacaBerkas(file){if(/\.(csv|txt)$/i.test(file.name))return [{name:'CSV',rows:parseCsv(await file.text())}];return bacaXlsx(await file.arrayBuffer());}

// PWA: pasang di layar utama (hanya aset statis)
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

// kompres foto di browser (JPEG, sisi terpanjang maks 'max' px, ukuran maks 'limit' byte)
function compressImg(file,max,limit){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>{
  const sc=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);
  c.getContext('2d').drawImage(img,0,0,c.width,c.height);let q=.85,out=c.toDataURL('image/jpeg',q);
  while(out.length*.75>limit&&q>.3){q-=.1;out=c.toDataURL('image/jpeg',q);}
  out.length*.75>limit?rej(new Error('Foto terlalu detail, coba foto lain')):res(out);};
  img.onerror=()=>rej(new Error('File gambar tidak valid'));img.src=URL.createObjectURL(file);});}
