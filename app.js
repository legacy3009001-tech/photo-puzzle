const $=s=>document.querySelector(s);
let size=4, imageURL=null, pieces=[], blank=0, moves=0, seconds=0, timerId=null, startX=0,startY=0;

document.querySelectorAll("[data-size]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-size]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");size=+b.dataset.size});
$("#photoInput").onchange=e=>{const f=e.target.files?.[0];if(f){imageURL=URL.createObjectURL(f);$("#hintImage").src=imageURL;startGame()}};
$("#changePhoto").onclick=()=>$("#photoInput").click();
$("#quit").onclick=()=>{stopTimer();show("home")};
$("#shuffleAgain").onclick=()=>startGame();
$("#again").onclick=()=>startGame();
$("#newPhoto").onclick=()=>{$("#photoInput").value="";show("home")};
$("#hint").onclick=()=>$("#hintOverlay").classList.remove("hidden");
$("#closeHint").onclick=()=>$("#hintOverlay").classList.add("hidden");

function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$("#"+id).classList.add("active")}
function startGame(){show("game");moves=0;seconds=0;$("#moves").textContent=0;$("#timer").textContent="00:00";$("#hintImage").src=imageURL;build();shuffle();render();stopTimer();timerId=setInterval(()=>{seconds++;$("#timer").textContent=fmt(seconds)},1000)}
function stopTimer(){if(timerId){clearInterval(timerId);timerId=null}}
function fmt(s){return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}
function build(){pieces=Array.from({length:size*size},(_,i)=>i);blank=pieces.length-1}
function neighbors(i){let r=Math.floor(i/size),c=i%size,a=[];if(r)a.push(i-size);if(r<size-1)a.push(i+size);if(c)a.push(i-1);if(c<size-1)a.push(i+1);return a}
function swap(a,b){[pieces[a],pieces[b]]=[pieces[b],pieces[a]];blank=b}
function shuffle(){let prev=-1, count=size*size*35;for(let k=0;k<count;k++){let n=neighbors(blank).filter(x=>x!==prev);let x=n[Math.floor(Math.random()*n.length)];prev=blank;swap(blank,x)}if(isSolved())shuffle()}
function render(){const board=$("#board");board.style.gridTemplateColumns=`repeat(${size},1fr)`;board.innerHTML="";pieces.forEach((p,i)=>{let t=document.createElement("button");t.className="tile"+(p===size*size-1?" blank":"");if(p!==size*size-1){const row=Math.floor(p/size),col=p%size;t.style.backgroundImage=`url("${imageURL}")`;t.style.backgroundSize=`${size*100}% ${size*100}%`;t.style.backgroundPosition=`${col*100/(size-1)}% ${row*100/(size-1)}%`}t.onclick=()=>move(i);board.appendChild(t)});}
function move(i){if(!neighbors(blank).includes(i))return;swap(blank,i);moves++;$("#moves").textContent=moves;render();if(isSolved())finish()}
function isSolved(){return pieces.every((p,i)=>p===i)}
function finish(){stopTimer();let key="best-"+size,best=+localStorage.getItem(key)||0;if(!best||seconds<best)localStorage.setItem(key,seconds);$("#resultText").textContent=`タイム ${fmt(seconds)}　・　${moves}手`;$("#bestText").textContent=`ベストタイム：${fmt(+localStorage.getItem(key))}`;show("result")}
const board=$("#board");board.addEventListener("pointerdown",e=>{startX=e.clientX;startY=e.clientY});board.addEventListener("pointerup",e=>{let dx=e.clientX-startX,dy=e.clientY-startY;if(Math.max(Math.abs(dx),Math.abs(dy))<25)return;let br=Math.floor(blank/size),bc=blank%size,target=-1;if(Math.abs(dx)>Math.abs(dy)){if(dx>0&&bc>0)target=blank-1;if(dx<0&&bc<size-1)target=blank+1}else{if(dy>0&&br>0)target=blank-size;if(dy<0&&br<size-1)target=blank+size}if(target>=0)move(target)});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"));
