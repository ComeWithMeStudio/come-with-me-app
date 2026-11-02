import assert from 'node:assert/strict';
import {makeSession,makeBoard,neighbour,shortestPath} from '../../media/rozkazhy-meni/pryhody-mimi/stezhynky-mimi/routes.mjs';
// Independent breadth-first solver checks generation rather than repeating it.
function distance(b){const q=[[b.start,0]],seen=new Set([b.start]);for(const [i,d] of q){if(i===b.goal)return d;const r=Math.floor(i/b.size),c=i%b.size;for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){const rr=r+dr,cc=c+dc,j=rr*b.size+cc;if(rr>=0&&rr<b.size&&cc>=0&&cc<b.size&&!b.blocked.includes(j)&&!seen.has(j)){seen.add(j);q.push([j,d+1]);}}}return Infinity;}
for(let session=0;session<100;session++){
  const boards=makeSession();assert.equal(boards.length,12);
  for(const [n,b] of boards.entries()){
    assert.equal(distance(b),[3,6,9][Math.floor(n/4)]);
    assert(!b.blocked.includes(b.start));assert(!b.blocked.includes(b.goal));
    const path=shortestPath(b);assert.equal(path.length-1,distance(b));
    for(let i=1;i<path.length;i++)assert.equal(Math.abs(Math.floor(path[i]/b.size)-Math.floor(path[i-1]/b.size))+Math.abs(path[i]%b.size-path[i-1]%b.size),1);
  }
}
assert.equal(neighbour(0,'left',4),-1);assert.equal(neighbour(3,'right',4),-1);assert.equal(neighbour(0,'up',4),-1);assert.equal(neighbour(15,'down',4),-1);
const random=Math.random;try{Math.random=()=>0;for(let level=0;level<3;level++)assert.equal(distance(makeBoard(level)),[3,6,9][level]);}finally{Math.random=random;}
console.log('PASS: 1,200 generated routes, shortest-path difficulty, legal adjacent steps, grid boundaries and constant random source');
