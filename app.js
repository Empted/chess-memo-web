const board = document.querySelector('#board'), status = document.querySelector('#status');
const start = document.querySelector('#start'), fresh = document.querySelector('#new');
const question = document.querySelector('#question'), answers = document.querySelector('#answers'), scoreEl = document.querySelector('#score');
const glyph = {P:'♙',N:'♘',B:'♗',R:'♖',Q:'♕',K:'♔',p:'♟',n:'♞',b:'♝',r:'♜',q:'♛',k:'♚'};
const names = ['Empty','Pawn','Knight','Bishop','Rook','Queen','King'];
let pos, whiteTurn, score, count, quiz, asked;

function loadFen(fen) { pos=Array.from({length:8},()=>Array(8).fill('')); fen.split(' ')[0].split('/').forEach((line,r)=>{let c=0;for(const ch of line){if(/\d/.test(ch))c+=+ch;else pos[r][c++]=ch;}}); whiteTurn=true; }
function draw(show=true) { board.innerHTML=''; for(let r=0;r<8;r++)for(let c=0;c<8;c++){const el=document.createElement('div');el.className=`square ${(r+c)%2?'dark':'light'}`;const p=pos[r][c];if(show&&p){const piece=document.createElement('img');piece.className='piece';piece.alt=pieceName(p);piece.src=`https://lichess1.org/assets/piece/cburnett/${p===p.toUpperCase()?'w':'b'}${p.toUpperCase()}.svg`;el.append(piece);}if(c===0)el.insertAdjacentHTML('afterbegin',`<span class="rank">${8-r}</span>`);if(r===7)el.insertAdjacentHTML('beforeend',`<span class="file">${String.fromCharCode(97+c)}</span>`);board.append(el);}}
function square(r,c){return String.fromCharCode(97+c)+(8-r)}
function pieceName(p){return !p?'Empty':({P:'Pawn',N:'Knight',B:'Bishop',R:'Rook',Q:'Queen',K:'King'})[p.toUpperCase()]}
function clearPath(fr,fc,tr,tc){let sr=Math.sign(tr-fr),sc=Math.sign(tc-fc);for(let r=fr+sr,c=fc+sc;r!==tr||c!==tc;r+=sr,c+=sc)if(pos[r][c])return false;return true;}
function canMove(p,fr,fc,tr,tc,capture){const dr=tr-fr,dc=tc-fc,t=p.toUpperCase(),w=p===p.toUpperCase();if(t==='P')return (!dc&&!capture&&(dr===(w?-1:1)||(dr===(w?-2:2)&&fr===(w?6:1)&&!pos[fr+(w?-1:1)][fc]))||(Math.abs(dc)===1&&dr===(w?-1:1)&&capture));if(t==='N')return Math.abs(dr)*Math.abs(dc)===2;if(t==='K')return Math.max(Math.abs(dr),Math.abs(dc))===1;if((t==='B'&&Math.abs(dr)!==Math.abs(dc))||(t==='R'&&dr&&dc)||(t==='Q'&&dr&&dc&&Math.abs(dr)!==Math.abs(dc)))return false;return clearPath(fr,fc,tr,tc);}
function castle(kingside){const r=whiteTurn?7:0,k=whiteTurn?'K':'k',rook=whiteTurn?'R':'r';pos[r][kingside?6:2]=k;pos[r][kingside?5:3]=rook;pos[r][4]=pos[r][kingside?7:0]='';whiteTurn=!whiteTurn;}
function applySan(raw){
  let san=raw.replace(/[+#!?]/g,'');
  if(san==='O-O'||san==='0-0') return castle(true);
  if(san==='O-O-O'||san==='0-0-0') return castle(false);
  const m=san.match(/^([KQRBN])?([a-h1-8]{0,2})x?([a-h][1-8])(?:=([QRBN]))?$/);
  if(!m) return;
  const kind=m[1]||'P', hint=m[2], tc=m[3].charCodeAt(0)-97, tr=8-(+m[3][1]);
  const wanted=whiteTurn?kind:kind.toLowerCase(), capture=san.includes('x');
  let found;
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) {
    const fileHint=!/[a-h]/.test(hint)||c===hint.match(/[a-h]/)[0].charCodeAt(0)-97;
    const rankHint=!/[1-8]/.test(hint)||r===8-(+hint.match(/[1-8]/)[0]);
    if(pos[r][c]===wanted && fileHint && rankHint && canMove(wanted,r,c,tr,tc,capture)) found=[r,c];
  }
  if(!found) return;
  const [fr,fc]=found;
  if(kind==='P'&&fc!==tc&&!pos[tr][tc]) pos[fr][tc]='';
  pos[tr][tc]=m[4]?(whiteTurn?m[4]:m[4].toLowerCase()):wanted;
  pos[fr][fc]=''; whiteTurn=!whiteTurn;
}
async function newPosition(){start.disabled=true;quiz=false;answers.innerHTML='';question.textContent='Memorize the position, then begin.';status.textContent='Loading a position from Lichess TV…';try{const pgn=await fetch('https://lichess.org/api/tv/rapid').then(r=>{if(!r.ok)throw Error();return r.text()});const moves=pgn.replace(/\[[^\]]*\]/g,'').trim().split(/\s+/).map(x=>x.replace(/^\d+\.{1,3}/,'')).filter(x=>x&&!/^(1-0|0-1|1\/2-1\/2|\*)$/.test(x));if(moves.length<2)throw Error();loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');const target=Math.floor(Math.random()*(moves.length-12))+12;moves.slice(0,target+1).forEach(applySan);status.textContent=`Lichess TV position · after move ${Math.ceil((target+1)/2)}. Take a moment to memorize it.`;}catch{loadFen('r1bq1rk1/pp2bppp/2n1pn2/2pp4/8/1P1P1NP1/PBP1PPBP/R2Q1RK1 w - - 0 8');status.textContent='Using a saved practice position (Lichess could not be reached).';}draw(true);start.disabled=false;}
function ask(){if(count===15){quiz=false;answers.innerHTML='';question.textContent=`Finished! You scored ${score} / 15.`;status.textContent='Choose a new position to practice again.';scoreEl.textContent=`Score: ${score} / 15`;return;}asked=[Math.floor(Math.random()*8),Math.floor(Math.random()*8)];question.textContent=`What piece is on ${square(...asked)}?`;answers.innerHTML='';names.forEach(name=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>{if(pieceName(pos[asked[0]][asked[1]])===name)score++;count++;scoreEl.textContent=`Score: ${score} / ${count}`;ask();};answers.append(b);});}
start.onclick=()=>{quiz=true;score=count=0;draw(false);start.disabled=true;status.textContent='Pieces hidden. Name what is on each square.';scoreEl.textContent='Score: 0 / 0';ask();};fresh.onclick=newPosition;newPosition();
