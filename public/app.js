const slidesEl=document.querySelector('#slides');
const dotsEl=document.querySelector('#dots');
const login=document.querySelector('#login');
const gallery=document.querySelector('#gallery');
const form=document.querySelector('#login-form');
const err=document.querySelector('#login-error');
const audio=document.querySelector('#audio');
const musicPanel=document.querySelector('#music-panel');
const musicState=document.querySelector('#music-state');
const playToggle=document.querySelector('#play-toggle');
const muteToggle=document.querySelector('#mute-toggle');
const volume=document.querySelector('#volume');
const musicButton=document.querySelector('#music-button');
const logoutButton=document.querySelector('#logout-button');
const hint=document.querySelector('#scroll-hint');

const photoCount=10;
let active=0, mediaReady=false, wheelLock=false;

function buildSlides(){
  for(let i=1;i<=photoCount;i++){
    const section=document.createElement('section');
    section.className='slide';
    section.dataset.index=i-1;
    section.style.setProperty('--bg-image',`url("/api/media?key=photo-${String(i).padStart(2,'0')}.jpg")`);
    section.innerHTML=`<div class="photo-wrap"><img class="photo" loading="${i===1?'eager':'lazy'}" decoding="async" src="/api/media?key=photo-${String(i).padStart(2,'0')}.jpg" alt="Family memory ${i}"><span class="photo-glass"></span></div>`;
    slidesEl.appendChild(section);
    const dot=document.createElement('button');dot.className='dot';dot.dataset.index=i-1;dot.ariaLabel=`Go to photo ${i}`;dotsEl.appendChild(dot);
  }
  const final=document.createElement('section');final.className='slide final';final.innerHTML='<div class="final-content"><div class="small">UNTIL THE NEXT MEMORY</div><h2>Always together.</h2></div>';slidesEl.appendChild(final);
  [...dotsEl.children].forEach(d=>d.addEventListener('click',()=>goTo(+d.dataset.index)));
}
function goTo(i){const target=[...slidesEl.children][Math.max(0,Math.min(photoCount,i))];target?.scrollIntoView({behavior:'smooth',block:'start'});}
function setActive(i){
  active=Math.max(0,Math.min(photoCount,i));
  [...slidesEl.children].forEach((s,n)=>s.classList.toggle('active',n===active));
  [...dotsEl.children].forEach((d,n)=>d.classList.toggle('active',n===active));
  if(active>0) hint.style.opacity='0';
}
const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting && e.intersectionRatio>.65)setActive(+e.target.dataset.index)});
},{root:slidesEl,threshold:[.65]});
function setupObserver(){[...slidesEl.children].slice(0,photoCount).forEach(s=>observer.observe(s));}
async function loginRequest(username,password){
  const r=await fetch('/api/login',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({username,password})
  });
  let data={};
  try { data=await r.json(); } catch {}
  if(!r.ok) throw new Error(data.error || 'Login failed');
  return true;
}
async function isLoggedIn(){
  try{
    const r=await fetch('/api/session',{cache:'no-store'});
    if(!r.ok)return false;
    const data=await r.json();
    return data.authenticated===true;
  }catch{return false}
}
async function enterGallery(){
  login.hidden=true;gallery.hidden=false;buildSlides();setupObserver();setActive(0);
  audio.src='/api/media?key=family.mp3';audio.volume=.65;
  try{await audio.play();}catch{}
}
// Never embed the username/password in the page. Clear any browser-injected values on initial load.
const usernameInput=document.querySelector('#username');
const passwordInput=document.querySelector('#password');
requestAnimationFrame(()=>{usernameInput.value='';passwordInput.value='';});

form.addEventListener('submit',async e=>{
  e.preventDefault();err.hidden=true;
  try{
    const ok=await loginRequest(document.querySelector('#username').value.trim(),document.querySelector('#password').value);
    if(!ok)throw new Error();
    await enterGallery();
  }catch(error){
    err.textContent=error?.message || 'That username or password isn’t correct.';
    err.hidden=false;
    form.classList.remove('shake');void form.offsetWidth;form.classList.add('shake');
  }
});
slidesEl.addEventListener('wheel',e=>{
  if(Math.abs(e.deltaY)<10||wheelLock)return;
  e.preventDefault();wheelLock=true;goTo(active+(e.deltaY>0?1:-1));setTimeout(()=>wheelLock=false,700);
},{passive:false});
playToggle.addEventListener('click',async()=>{
  if(audio.paused){await audio.play();}else audio.pause();
});
audio.addEventListener('play',()=>{playToggle.textContent='❚❚';playToggle.ariaLabel='Pause music';musicState.textContent='Playing'});
audio.addEventListener('pause',()=>{playToggle.textContent='▶';playToggle.ariaLabel='Play music';musicState.textContent='Paused'});
volume.addEventListener('input',()=>audio.volume=+volume.value);
muteToggle.addEventListener('click',()=>{audio.muted=!audio.muted;muteToggle.textContent=audio.muted?'Unmute':'Mute'});
musicButton.addEventListener('click',()=>musicPanel.hidden=!musicPanel.hidden);
logoutButton.addEventListener('click',async()=>{
  await fetch('/api/logout',{method:'POST'});location.reload();
});
document.addEventListener('contextmenu',e=>{if(!gallery.hidden)e.preventDefault()});
document.addEventListener('dragstart',e=>{if(e.target.tagName==='IMG')e.preventDefault()});
isLoggedIn().then(ok=>{if(ok)enterGallery()});
