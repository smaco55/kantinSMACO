const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rp=n=>'Rp'+Number(n).toLocaleString('id-ID');
async function api(action,data){
  const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify(Object.assign({},data,{action,token:sessionStorage.getItem('tok')}))});
  const j=await r.json();
  if(!j.ok){ if(/Sesi berakhir/.test(j.error)&&action!=='login'){sessionStorage.clear();location.href='index.html';} throw new Error(j.error); }
  return j.data;
}
let _tt;function toast(m,err){const t=$('#toast');t.textContent=m;t.className=err?'er':'';t.style.display='block';clearTimeout(_tt);_tt=setTimeout(()=>t.style.display='none',err?5000:2500);}
// jalankan aksi dengan tombol dinonaktifkan (cegah klik ganda)
async function run(btn,fn){if(btn&&btn.disabled)return;if(btn)btn.disabled=true;try{return await fn();}catch(e){toast(e.message,1);}finally{if(btn)btn.disabled=false;}}
function poll(fn,ms,active){setInterval(()=>{if(!document.hidden&&(!active||active()))fn().catch(()=>{});},ms);}
function logout(){sessionStorage.clear();location.href='index.html';}
const STAFF=['kasir','bendahara','pencatat','kepala'];
const MENU=[['kepala','Dasbor','kepala.html'],['kasir','Kasir','kasir.html'],['bendahara','Bendahara','bendahara.html'],['pencatat','Pencatatan','pencatat.html']];
function guard(role){
  const r=sessionStorage.getItem('role');
  if(!sessionStorage.getItem('tok')||!(r===role||(r==='kepala'&&STAFF.includes(role)))){location.href='index.html';return false;}
  let t;const rs=()=>{clearTimeout(t);t=setTimeout(logout,30*60*1000);};['click','keydown','touchstart'].forEach(e=>addEventListener(e,rs));rs();
  chrome(role,r);
  if(STAFF.includes(role)){const w=()=>fetch(API_URL+'?ping=1').catch(()=>{});w();setInterval(()=>{if(!document.hidden)w();},240000);} // jaga server tetap siap (lebih cepat)
  return true;}
// bilah atas: nama pengguna, menu (khusus Kepala), tombol Ganti Password
function chrome(role,r){
  const h=document.querySelector('header'),out=h&&[...h.querySelectorAll('button')].find(b=>/Keluar/i.test(b.textContent));if(!h)return;
  const add=el=>out?h.insertBefore(el,out):h.appendChild(el);
  if(r==='kepala'){MENU.forEach(m=>{const a=document.createElement('a');a.href=m[2];a.textContent=m[1];if(m[0]===role)a.className='on';add(a);});}
  const who=document.createElement('span');who.className='who';who.textContent=sessionStorage.getItem('nama')||'';add(who);
  const b=document.createElement('button');b.textContent='Ganti Password';b.onclick=openPw;add(b);
  const d=document.createElement('dialog');d.id='dPw';d.innerHTML='<h3 style="margin-top:0">Ganti Password</h3><label>Password lama</label><input type="password" id="pwL" autocomplete="current-password"><label>Password baru (minimal 4 karakter)</label><input type="password" id="pwB" autocomplete="new-password"><label>Ulangi password baru</label><input type="password" id="pwU" autocomplete="new-password"><label style="display:flex;gap:6px;align-items:center;margin-top:8px"><input type="checkbox" id="pwS" style="width:auto"> Tampilkan password</label><button class="btn" id="pwOk" style="margin-top:10px">Simpan</button><button class="btn alt" id="pwX" style="margin-top:6px">Batal</button>';
  document.body.appendChild(d);
  $('#pwS').onchange=e=>['pwL','pwB','pwU'].forEach(i=>$('#'+i).type=e.target.checked?'text':'password');
  $('#pwX').onclick=()=>d.close();
  $('#pwOk').onclick=e=>run(e.target,async()=>{const a=$('#pwL').value,n=$('#pwB').value;
    if(n.length<4)throw new Error('Password baru minimal 4 karakter');if(n!==$('#pwU').value)throw new Error('Ulangi password baru tidak sama');
    await api('changePassword',{lama:a,baru:n});d.close();toast('Password berhasil diganti');});}
function openPw(){['pwL','pwB','pwU'].forEach(i=>$('#'+i).value='');$('#dPw').showModal();$('#pwL').focus();}
// tema: turunan warna otomatis + cek kontras
function mix(h,t,a){const n=parseInt(h.slice(1),16),r=n>>16,g=n>>8&255,b=n&255,T=t?255:0,f=x=>Math.round(x+(T-x)*a).toString(16).padStart(2,'0');return '#'+f(r)+f(g)+f(b);}
function lum(h){const n=parseInt(h.slice(1),16);return [n>>16,n>>8&255,n&255].map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);}
function applyTheme(c){if(!c||!/^#[0-9a-f]{6}$/i.test(c.warna_utama||''))return;const s=document.documentElement.style,g=c.warna_utama;
  s.setProperty('--g',g);s.setProperty('--gd',mix(g,0,.25));s.setProperty('--gl',mix(g,1,.88));s.setProperty('--ga',mix(g,1,.35));
  s.setProperty('--on',lum(g)>.4?'#10201a':'#fff');
  const h=$('#hdrName');if(h)h.textContent=c.nama_kantin||'Kantin';const lg=$('#hdrLogo');if(lg&&c.logo){lg.src=c.logo;lg.classList.remove('hide');}
  localStorage.setItem('theme',JSON.stringify(c));}

// PWA: pasang di layar utama (hanya aset statis)
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

// kompres foto di browser (JPEG, sisi terpanjang maks 'max' px, ukuran maks 'limit' byte)
function compressImg(file,max,limit){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>{
  const sc=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);
  c.getContext('2d').drawImage(img,0,0,c.width,c.height);let q=.85,out=c.toDataURL('image/jpeg',q);
  while(out.length*.75>limit&&q>.3){q-=.1;out=c.toDataURL('image/jpeg',q);}
  out.length*.75>limit?rej(new Error('Foto terlalu detail, coba foto lain')):res(out);};
  img.onerror=()=>rej(new Error('File gambar tidak valid'));img.src=URL.createObjectURL(file);});}
