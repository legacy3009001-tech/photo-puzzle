const $=s=>document.querySelector(s);
let size=4,imageURL=null,tileURLs=[],boardState=[],blank=0,moves=0,seconds=0,timerId=null,selectedIndex=null,startX=0,startY=0,ready=false;

document.querySelectorAll("[data-size]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-size]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");size=+b.dataset.size});
$("#photoInput").onchange=e=>{const f=e.target.files?.[0];if(f)loadPhoto(f)};
$("#changePhoto").onclick=()=>$("#photoInput").click();
$("#quit").onclick=()=>{stopTimer();show("home")};
$("#shuffleAgain").onclick=()=>{if(ready){startGame()}};
$("#again").onclick=()=>{if(imageURL)startGame()};
$("#newPhoto").onclick=()=>{$("#photoInput").value="";show("home")};
$("#hint").onclick=()=>$("#hintOverlay").classList.remove("hidden");
$("#closeHint").onclick=()=>$("#hintOverlay").classList.add("hidden");

function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$("#"+id).classList.add("active")}
function stopTimer(){if(timerId){clearInterval(timerId);timerId=null}}
function startTimer(){stopTimer();timerId=setInterval(()=>{seconds++;$("#timer").textContent=fmt(seconds)},1000)}
function fmt(s){return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}

async function loadPhoto(file){
  stopTimer();ready=false;selectedIndex=null;show("game");$("#board").innerHTML="";$("#loading").classList.remove("hidden");
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
  moves=0;seconds=0;selectedIndex=null;$("#moves").textContent="0";$("#timer").textContent="00:00";$("#loading").classList.add("hidden");
  // Make a shuffled but always solvable starting position using random legal moves.
  boardState=Array.from({length:size*size},(_,i)=>i);blank=boardState.length-1;
  let prev=-1;
  for(let k=0;k<size*size*45;k++){const n=neighbors(blank).filter(x=>x!==prev);const x=n[Math.floor(Math.random()*n.length)];prev=blank;swap(blank,x)}
  if(isSolved())return startGame();
  ready=true;updateInstruction();render();startTimer();
}
function neighbors(i){const r=Math.floor(i/size),c=i%size,a=[];if(r)a.push(i-size);if(r<size-1)a.push(i+size);if(c)a.push(i-1);if(c<size-1)a.push(i+1);return a}
function swap(a,b){[boardState[a],boardState[b]]=[boardState[b],boardState[a]];if(boardState[a]===size*size-1)blank=a;if(boardState[b]===size*size-1)blank=b}

/* 子供向けの新しい操作方式：
   1) 動かしたいピースをタップ
   2) 移動先のマスをタップ
   - 空白が移動先なら、そのピースを空白へ移動
   - 別のピースがある場所なら、2つのピースを交換し、移動先にあったピースを空白へ移動
   つまり、移動先は盤面上のどこでもOK。
*/
function selectOrMove(i){
  if(!ready)return;
  if(selectedIndex===null){
    if(boardState[i]===size*size-1)return;
    selectedIndex=i;updateInstruction();render();return;
  }
  if(i===selectedIndex){selectedIndex=null;updateInstruction();render();return}
  // Move selected piece to the tapped destination.
  const source=selectedIndex;
  const destination=i;
  const sourcePiece=boardState[source];
  const destinationPiece=boardState[destination];
  if(destinationPiece===size*size-1){
    // Destination is the empty space.
    boardState[blank]=sourcePiece;
    boardState[source]=size*size-1;
    blank=source;
  }else{
    // The destination piece goes to the current empty square.
    boardState[blank]=destinationPiece;
    boardState[destination]=sourcePiece;
    boardState[source]=size*size-1;
    blank=source;
  }
  moves++;$("#moves").textContent=moves;selectedIndex=null;updateInstruction();render();
  if(isSolved())finish();
}
function render(){
  const board=$("#board");board.style.gridTemplateColumns=`repeat(${size},1fr)`;board.innerHTML="";
  boardState.forEach((p,i)=>{
    const t=document.createElement("button");t.className="tile"+(p===size*size-1?" blank":"")+(i===selectedIndex?" selected":"");
    if(p!==size*size-1)t.style.backgroundImage=`url("${tileURLs[p]}")`;
    t.onclick=()=>selectOrMove(i);board.appendChild(t);
  });
}
function updateInstruction(){
  $("#instruction").textContent=selectedIndex===null?"動かしたいピースをタップしてください":"移動先のマスをタップしてください";
}
function isSolved(){return boardState.every((p,i)=>p===i)}
function finish(){
  stopTimer();ready=false;const key="best-"+size,best=+localStorage.getItem(key)||0;if(!best||seconds<best)localStorage.setItem(key,seconds);
  $("#resultText").textContent=`タイム ${fmt(seconds)}　・　${moves}手`;$("#bestText").textContent=`ベストタイム：${fmt(+localStorage.getItem(key))}`;show("result");
}
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"));
