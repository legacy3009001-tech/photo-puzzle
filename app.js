const $=s=>document.querySelector(s);
let size=4,imageURL=null,tileURLs=[],boardState=[],blank=0,moves=0,seconds=0,timerId=null,selectedIndex=null,ready=false;

document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll("[data-size]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-size]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");size=Number(b.dataset.size)}));
  $("#photoInput").addEventListener("change",e=>{const f=e.target.files&&e.target.files[0];if(f)loadPhoto(f)});
  $("#changePhoto").addEventListener("click",()=>$("#photoInput").click());
  $("#quit").addEventListener("click",()=>{stopTimer();ready=false;show("home")});
  $("#shuffleAgain").addEventListener("click",()=>{if(imageURL)startGame()});
  $("#hint").addEventListener("click",()=>$("#hintOverlay").classList.remove("hidden"));
  $("#closeHint").addEventListener("click",()=>$("#hintOverlay").classList.add("hidden"));
  // Restart button: explicitly starts a brand-new puzzle using the current photo.
  $("#again").addEventListener("click",restartCurrentPhoto);
  $("#newPhoto").addEventListener("click",()=>{stopTimer();ready=false;selectedIndex=null;$("#photoInput").value="";show("home")});
  if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js?v=5"));
});

function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));const target=$("#"+id);if(target)target.classList.add("active")}
function stopTimer(){if(timerId){clearInterval(timerId);timerId=null}}
function startTimer(){stopTimer();timerId=setInterval(()=>{seconds++;$("#timer").textContent=fmt(seconds)},1000)}
function fmt(s){return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}

async function loadPhoto(file){
  stopTimer();ready=false;selectedIndex=null;show("game");$("#board").innerHTML="";$("#loading").classList.remove("hidden");
  if(imageURL&&imageURL.startsWith("blob:"))URL.revokeObjectURL(imageURL);
  imageURL=URL.createObjectURL(file);$("#hintImage").src=imageURL;
  try{const img=await decodeImage(imageURL);await makeTiles(img);startGame()}
  catch(err){console.error(err);$("#loading").textContent="写真を読み込めませんでした。別の写真を選んでください。"}
}
function decodeImage(url){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url})}
async function makeTiles(img){
  const side=Math.min(img.naturalWidth,img.naturalHeight),sx=(img.naturalWidth-side)/2,sy=(img.naturalHeight-side)/2;
  const canvas=document.createElement("canvas");canvas.width=canvas.height=900;canvas.getContext("2d").drawImage(img,sx,sy,side,side,0,0,900,900);
  tileURLs=[];const tile=900/size;
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){const tc=document.createElement("canvas");tc.width=tc.height=300;tc.getContext("2d").drawImage(canvas,c*tile,r*tile,tile,tile,0,0,300,300);tileURLs.push(tc.toDataURL("image/jpeg",.88))}
}
function startGame(){
  if(!tileURLs.length){return}
  stopTimer();moves=0;seconds=0;selectedIndex=null;$("#moves").textContent="0";$("#timer").textContent="00:00";$("#loading").classList.add("hidden");
  boardState=Array.from({length:size*size},(_,i)=>i);blank=boardState.length-1;
  let prev=-1;
  for(let k=0;k<size*size*45;k++){const n=neighbors(blank).filter(x=>x!==prev);const x=n[Math.floor(Math.random()*n.length)];prev=blank;swap(blank,x)}
  if(isSolved())return startGame();
  ready=true;updateInstruction();render();show("game");startTimer();
}
function restartCurrentPhoto(){
  // Keep the selected photo and difficulty. Rebuild the pieces to make the restart
  // independent of any stale board state.
  if(!imageURL||!tileURLs.length)return;
  $("#hintOverlay").classList.add("hidden");
  $("#result").classList.remove("active");
  show("game");
  startGame();
}
function neighbors(i){const r=Math.floor(i/size),c=i%size,a=[];if(r)a.push(i-size);if(r<size-1)a.push(i+size);if(c)a.push(i-1);if(c<size-1)a.push(i+1);return a}
function swap(a,b){[boardState[a],boardState[b]]=[boardState[b],boardState[a]];if(boardState[a]===size*size-1)blank=a;if(boardState[b]===size*size-1)blank=b}
function selectOrMove(i){
  if(!ready)return;
  if(selectedIndex===null){if(boardState[i]===size*size-1)return;selectedIndex=i;updateInstruction();render();return}
  if(i===selectedIndex){selectedIndex=null;updateInstruction();render();return}
  const source=selectedIndex,destination=i,sourcePiece=boardState[source],destinationPiece=boardState[destination];
  if(destinationPiece===size*size-1){boardState[blank]=sourcePiece;boardState[source]=size*size-1;blank=source}
  else{boardState[blank]=destinationPiece;boardState[destination]=sourcePiece;boardState[source]=size*size-1;blank=source}
  moves++;$("#moves").textContent=moves;selectedIndex=null;updateInstruction();render();
  if(isSolved())finish();
}
function render(){
  const board=$("#board");board.style.gridTemplateColumns=`repeat(${size},1fr)`;board.innerHTML="";
  boardState.forEach((p,i)=>{const t=document.createElement("button");t.className="tile"+(p===size*size-1?" blank":"")+(i===selectedIndex?" selected":"");if(p!==size*size-1)t.style.backgroundImage=`url("${tileURLs[p]}")`;t.addEventListener("click",()=>selectOrMove(i));board.appendChild(t)});
}
function updateInstruction(){$("#instruction").textContent=selectedIndex===null?"動かしたいピースをタップしてください":"移動先のマスをタップしてください"}
function isSolved(){return boardState.every((p,i)=>p===i)}
function finish(){
  stopTimer();ready=false;
  const key="best-"+size,best=Number(localStorage.getItem(key))||0;
  if(!best||seconds<best)localStorage.setItem(key,String(seconds));
  $("#resultText").textContent=`タイム ${fmt(seconds)}　・　${moves}手`;
  $("#bestText").textContent=`ベストタイム：${fmt(Number(localStorage.getItem(key))||seconds)}`;
  show("result");
}
