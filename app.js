const $=s=>document.querySelector(s);
let size=4, imageURL=null, tileURLs=[], boardState=[], blank=0, moves=0, seconds=0, timerId=null, startX=0,startY=0, ready=false;

document.querySelectorAll("[data-size]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-size]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");size=+b.dataset.size});
$("#photoInput").onchange=e=>{const f=e.target.files?.[0];if(f) loadPhoto(f)};
$("#changePhoto").onclick=()=>$("#photoInput").click();
$("#quit").onclick=()=>{stopTimer();show("home")};
$("#shuffleAgain").onclick=()=>{if(ready){shuffle();moves=0;seconds=0;$("#moves").textContent=0;$("#timer").textContent="00:00";render();startTimer()}};
$("#again").onclick=()=>{if(imageURL) startGame()};
$("#newPhoto").onclick=()=>{$("#photoInput").value="";show("home")};
$("#hint").onclick=()=>$("#hintOverlay").classList.remove("hidden");
$("#closeHint").onclick=()=>$("#hintOverlay").classList.add("hidden");

function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$("#"+id).classList.add("active")}
function stopTimer(){if(timerId){clearInterval(timerId);timerId=null}}
function startTimer(){stopTimer();timerId=setInterval(()=>{seconds++;$("#timer").textContent=fmt(seconds)},1000)}
function fmt(s){return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}

async function loadPhoto(file){
  stopTimer(); ready=false; show("game"); $("#board").innerHTML=""; $("#loading").classList.remove("hidden");
  imageURL=URL.createObjectURL(file); $("#hintImage").src=imageURL;
  try{
    const img=await decodeImage(imageURL);
    await makeTiles(img);
    startGame();
  }catch(err){
    console.error(err); $("#loading").textContent="写真を読み込めませんでした。別の写真を選んでください。";
  }
}
function decodeImage(url){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img); img.onerror=reject; img.src=url;
  });
}
async function makeTiles(img){
  const side=Math.min(img.naturalWidth,img.naturalHeight);
  const sx=(img.naturalWidth-side)/2, sy=(img.naturalHeight-side)/2;
  const canvas=document.createElement("canvas");
  canvas.width=canvas.height=900;
  const ctx=canvas.getContext("2d");
  ctx.drawImage(img,sx,sy,side,side,0,0,900,900);
  tileURLs=[];
  const n=size, tile=900/n;
  for(let r=0;r<n;r++){
    for(let c=0;c<n;c++){
      const tc=document.createElement("canvas"); tc.width=tc.height=300;
      tc.getContext("2d").drawImage(canvas,c*tile,r*tile,tile,tile,0,0,300,300);
      tileURLs.push(tc.toDataURL("image/jpeg",0.88));
    }
  }
}
function startGame(){
  moves=0;seconds=0;$("#moves").textContent="0";$("#timer").textContent="00:00";$("#loading").classList.add("hidden");
  boardState=Array.from({length:size*size},(_,i)=>i);blank=boardState.length-1;shuffle();ready=true;render();startTimer();
}
function neighbors(i){const r=Math.floor(i/size),c=i%size,a=[];if(r)a.push(i-size);if(r<size-1)a.push(i+size);if(c)a.push(i-1);if(c<size-1)a.push(i+1);return a}
function swap(a,b){[boardState[a],boardState[b]]=[boardState[b],boardState[a]];blank=b}
function shuffle(){let prev=-1;for(let k=0;k<size*size*45;k++){const n=neighbors(blank).filter(x=>x!==prev);const x=n[Math.floor(Math.random()*n.length)];prev=blank;swap(blank,x)}if(isSolved())shuffle()}
function render(){
  const board=$("#board"); board.style.gridTemplateColumns=`repeat(${size},1fr)`; board.innerHTML="";
  boardState.forEach((p,i)=>{
    const t=document.createElement("button"); t.className="tile"+(p===size*size-1?" blank":"");
    if(p!==size*size-1) t.style.backgroundImage=`url("${tileURLs[p]}")`;
    t.onclick=()=>move(i); board.appendChild(t);
  });
}
function move(i){
  if(!ready || !neighbors(blank).includes(i)) return;
  swap(blank,i);moves++;$("#moves").textContent=moves;render();if(isSolved())finish();
}
function isSolved(){return boardState.every((p,i)=>p===i)}
function finish(){
  stopTimer();ready=false;const key="best-"+size,best=+localStorage.getItem(key)||0;if(!best||seconds<best)localStorage.setItem(key,seconds);
  $("#resultText").textContent=`タイム ${fmt(seconds)}　・　${moves}手`;$("#bestText").textContent=`ベストタイム：${fmt(+localStorage.getItem(key))}`;show("result");
}
const board=$("#board");
board.addEventListener("pointerdown",e=>{startX=e.clientX;startY=e.clientY});
board.addEventListener("pointerup",e=>{
  const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.max(Math.abs(dx),Math.abs(dy))<25)return;
  const br=Math.floor(blank/size),bc=blank%size;let target=-1;
  if(Math.abs(dx)>Math.abs(dy)){if(dx>0&&bc>0)target=blank-1;if(dx<0&&bc<size-1)target=blank+1}
  else{if(dy>0&&br>0)target=blank-size;if(dy<0&&br<size-1)target=blank+size}
  if(target>=0)move(target);
});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"));
