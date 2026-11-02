// Paths are generated separately from presentation. Every route is reachable;
// difficulty is measured by the shortest path, never by a timer or move limit.
export const directions = Object.freeze({up:[-1,0,'угору'],right:[0,1,'праворуч'],down:[1,0,'униз'],left:[0,-1,'ліворуч']});
export function neighbour(index, dir, size) {
  const [dr,dc]=directions[dir],r=Math.floor(index/size)+dr,c=index%size+dc;
  return r<0||r>=size||c<0||c>=size ? -1 : r*size+c;
}
export function shortestPath(board, start=board.start, goal=board.goal) {
  const queue=[start],previous=new Map([[start,null]]);
  for(let i=0;i<queue.length;i++) {
    const at=queue[i];
    if(at===goal){const path=[];for(let p=goal;p!==null;p=previous.get(p))path.unshift(p);return path;}
    for(const dir of Object.keys(directions)){
      const next=neighbour(at,dir,board.size);
      if(next>=0&&!board.blocked.includes(next)&&!previous.has(next)){previous.set(next,at);queue.push(next);}
    }
  }
  return [];
}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makeBoard(level) {
  const size=level===0?4:5,length=[3,6,9][level],wallCount=[3,7,10][level];
  const cells=Array.from({length:size*size},(_,i)=>i);
  for(let trial=0;trial<120;trial++){
    const blocked=shuffle(cells).slice(0,wallCount),free=shuffle(cells.filter(i=>!blocked.includes(i)));
    for(const start of free){
      const board={size,blocked,start,goal:start};
      for(const goal of free){if(shortestPath(board,start,goal).length===length+1)return {...board,goal};}
    }
  }
  // Deterministic, connected fallback for even adversarial random sources.
  const corridor=size===4?[0,1,2,3,7,11,15]:[0,1,2,3,4,9,14,13,12,11,10,15,20,21,22,23,24];
  return {size,blocked:cells.filter(i=>!corridor.includes(i)),start:corridor[0],goal:corridor[length]};
}
export function makeSession(){
  const boards=[],seen=new Set();
  for(let n=0;n<12;n++){
    let board,signature;
    for(let attempt=0;attempt<30;attempt++){
      board=makeBoard(Math.floor(n/4));signature=JSON.stringify([board.start,board.goal,...board.blocked.slice().sort((a,b)=>a-b)]);
      if(!seen.has(signature))break;
    }
    seen.add(signature);boards.push(board);
  }
  return boards;
}
