if(guard('wali')){
const S={kids:[],cur:0,cfg:{}};
const kid=()=>S.kids[S.cur];
async function boot(){const [d,k]=await Promise.all([api('init'),api('wali')]);S.cfg=d.cfg;applyTheme(d.cfg);$('#hdrName').textContent=(d.cfg.nama_kantin||'Kantin')+' · Wali';S.kids=k;render();}
boot().catch(e=>toast(e.message,1));
async function notif(aktif){const n=await api('waliNotif',aktif===undefined?{}:{aktif});
  $('#nt').innerHTML='<h3 style="margin-top:0">Notifikasi email</h3>'+(!n.sistemAktif?'<p class="mu">Fitur notifikasi belum diaktifkan oleh sekolah.</p>':!n.adaEmail?'<p class="mu">Alamat email Anda belum terdaftar. Hubungi Kepala Kantin.</p>':`<p>Ringkasan jajan harian dan peringatan saldo menipis dikirim ke <b>${esc(n.email)}</b> (maksimal satu email per hari, hanya jika ada aktivitas).</p><div class="row" style="border:0"><span class="tag">${n.aktif?'Aktif':'Nonaktif'}</span><button class="btn sm ${n.aktif?'alt':''}" id="bNt">${n.aktif?'Matikan':'Aktifkan'}</button></div>`);
  const b=$('#bNt');if(b)b.onclick=()=>run(b,()=>notif(!n.aktif));}
notif().catch(()=>{});
function render(){
  $('#empty').classList.toggle('hide',S.kids.length>0);$('#kid').classList.toggle('hide',!S.kids.length);if(!S.kids.length)return;
  $('#kids').innerHTML=S.kids.length>1?S.kids.map((a,i)=>`<button data-i="${i}" class="${i===S.cur?'on':''}">${esc(a.nama)}</button>`).join(''):'';
  const a=kid();$('#kn').textContent=a.nama+' · Kelas '+(a.kelas||'-');$('#ks').textContent=rp(a.saldo);
  $('#kw').innerHTML=a.saldo<Number(S.cfg.saldo_menipis||0)?'<div class="warn">Saldo menipis. Isi saldo dengan menyerahkan uang tunai ke bendahara kantin.</div>':'';
  // riwayat jajan dikelompokkan per tanggal
  const g={};a.riwayat.forEach(o=>{const t=String(o.waktu).slice(0,10);(g[t]=g[t]||[]).push(o);});
  $('#jj').innerHTML=Object.keys(g).map(t=>`<h4>${esc(t)} · ${rp(g[t].reduce((s,o)=>s+o.total-o.refund,0))}</h4>`+g[t].map(o=>`<div class="card" style="margin-bottom:6px"><div class="row" style="border:0"><span class="mu">${esc(String(o.waktu).slice(11,16))}${o.jenis==='preorder'?' · pre-order':''}</span><span class="tag">${esc(o.status)}</span></div>${o.items.map(i=>`<div class="row"><span>${i.qty} × ${esc(i.nama)}</span><span>${rp(i.qty*i.harga)}</span></div>`).join('')}<div class="row" style="border:0"><b>Total</b><b>${rp(o.total)}</b></div></div>`).join('')).join('')||'<p class="mu">Belum ada riwayat jajan</p>';
  $('#dd').innerHTML=a.deposit.map(d=>`<div class="row"><span>${esc(d.waktu)}</span><b>+ ${rp(d.nominal)}</b></div>`).join('')||'<p class="mu">Belum ada deposit</p>';
  $('#bs').textContent=a.batasSekolah>0?rp(a.batasSekolah)+' / hari':'Tidak dibatasi';$('#bm').textContent=a.batasJajan>0?rp(a.batasJajan)+' / hari':'Mengikuti sekolah';$('#bn').value=a.batasJajan;}
$('#kids').onclick=e=>{const i=e.target.dataset.i;if(i!==undefined){S.cur=Number(i);render();}};
$('#tabs').onclick=e=>{const t=e.target.dataset.t;if(!t)return;document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b===e.target));['jajan','dep','bts','akun'].forEach(x=>$('#t-'+x).classList.toggle('hide',x!==t));};
$('#bSave').onclick=e=>run(e.target,async()=>{const a=kid(),n=Number($('#bn').value);if(!(n>=0))throw new Error('Nominal tidak valid');
  await api('waliBatas',{idAnak:a.id,nominal:n});a.batasJajan=n;render();toast('Batas jajan tersimpan');});
$('#bPin').onclick=e=>run(e.target,async()=>{await api('changePin',{pinLama:$('#pl').value,pinBaru:$('#pb').value});$('#pl').value=$('#pb').value='';toast('PIN diganti');});
}
