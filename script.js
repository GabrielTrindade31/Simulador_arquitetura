const architectures = {
  3:{description:'Destino e dois operandos explícitos; os dados originais são preservados.',instructions:[['ADD','Soma A + B'],['SUB','Subtrai A − B'],['MUL','Multiplica A × B'],['DIV','Divide A ÷ B']],example:'SUB R1, A, B',explain:'Lê A e B, passa pela ULA e escreve em R1.',code:'; Calcular (A - B) × C\nSUB R1, A, B\nMUL R2, R1, C'},
  2:{description:'O registrador de destino também é o primeiro operando.',instructions:[['MOV','Copia um valor'],['ADD','Soma ao destino'],['SUB','Subtrai do destino'],['MUL','Multiplica o destino'],['DIV','Divide o destino']],example:'SUB R1, B',explain:'Lê R1 e B; o resultado volta para R1.',code:'; Calcular (A - B) × C\nMOV R1, A\nSUB R1, B\nMUL R1, C'},
  1:{description:'A ULA usa o acumulador implícito para todas as operações.',instructions:[['LOAD','Carrega no ACC'],['STORE','Salva o ACC'],['ADD','Soma ao ACC'],['SUB','Subtrai do ACC'],['MUL','Multiplica o ACC'],['DIV','Divide o ACC']],example:'LOAD A · SUB B',explain:'A vai ao ACC; B segue para a ULA; o resultado volta ao ACC.',code:'; Calcular (A - B) × C\nLOAD A\nSUB B\nMUL C\nSTORE RESULT'},
  0:{description:'Operandos ficam na pilha; as operações consomem os dois itens do topo.',instructions:[['PUSH','Empilha um valor'],['POP','Desempilha um valor'],['ADD','Soma o topo'],['SUB','Subtrai o topo'],['MUL','Multiplica o topo'],['DIV','Divide o topo']],example:'PUSH A · PUSH B · SUB',explain:'A e B entram na pilha; a ULA devolve A − B ao topo.',code:'; Calcular (A - B) × C\nPUSH A\nPUSH B\nSUB\nPUSH C\nMUL\nPOP RESULT'}
};
const $=id=>document.getElementById(id);
let arch=0, values={}, labels={}, memory={A:12,B:4,C:3,D:2,E:5,F:2,G:1,H:2,RESULT:0};
let program=[], pointer=0, stack=[], acc=0, traces=[];

function registerKeys(){return Array.from({length:+$('registers').value},(_,i)=>`R${i+1}`)}
function displayName(key){return labels[key]||key}
function resolveName(token){const upper=token?.toUpperCase();return Object.keys(labels).find(k=>labels[k].toUpperCase()===upper)||upper}
function read(token){const key=resolveName(token);if(key in values)return +values[key];if(key in memory)return +memory[key];const number=Number(key);if(Number.isNaN(number))throw Error(`operando “${token}” não encontrado`);return number}
function format(value){return Number.isFinite(+value)?String(+value):'0'}

function renderArchitecture(load=true){
  const data=architectures[arch];
  $('archDescription').textContent=data.description;$('instructionCount').textContent=`${data.instructions.length} OPS`;
  $('instructionList').innerHTML=data.instructions.map(([op,text])=>`<div class="instruction"><code>${op}</code><span>${text}</span></div>`).join('');
  $('quickExample').textContent=data.example;$('exampleExplanation').textContent=data.explain;
  if(load)$('codeEditor').value=data.code;
  $('accumulator').disabled=arch===1;if(arch===1)$('accumulator').checked=true;
  updateConfig();updateLines();resetMachine(false);
}
function updateConfig(){
  $('regValue').value=$('registers').value;
  $('memoryValue').value=$('memorySize').value;
  $('machineId').textContent=`${arch}E–${String($('registers').value).padStart(2,'0')}R–${String($('memorySize').value).padStart(2,'0')}M–${$('accumulator').checked?'ACC':'STD'}`;
  registerKeys().forEach(k=>{if(!(k in values))values[k]=0;if(!labels[k])labels[k]=k});renderRegisters();
}
function renderRegisters(){
  let keys=registerKeys();if($('accumulator').checked&&!keys.includes('ACC'))keys=['ACC',...keys];
  $('registerList').innerHTML=keys.map(key=>`<div class="register ${key===lastDestination?'changed':''}" data-key="${key}"><input class="reg-name" value="${displayName(key)}" aria-label="Nome de ${key}" title="Renomear ${key}"><span>${key}</span><input class="reg-value" type="number" value="${format(key==='ACC'?acc:values[key]||0)}" aria-label="Valor de ${displayName(key)}"></div>`).join('');
  document.querySelectorAll('.reg-name').forEach(input=>input.addEventListener('change',e=>{const key=e.target.closest('.register').dataset.key;const name=e.target.value.trim().replace(/\s+/g,'_');labels[key]=name||key;e.target.value=labels[key]}));
  document.querySelectorAll('.reg-value').forEach(input=>input.addEventListener('change',e=>{const key=e.target.closest('.register').dataset.key;if(key==='ACC')acc=+e.target.value||0;else values[key]=+e.target.value||0}));
}
function renderMemory(){
  const size=+$('memorySize').value;
  const entries=Object.entries(memory).filter(([key])=>key!=='RESULT');
  while(entries.length<size){const key=`M${String(entries.length).padStart(2,'0')}`;entries.push([key,0]);memory[key]=0}
  Object.keys(memory).filter(key=>key!=='RESULT'&&!entries.slice(0,size).some(([active])=>active===key)).forEach(key=>delete memory[key]);
  $('memoryGrid').innerHTML=entries.slice(0,size).map(([key,value],index)=>`<label><input class="memory-name" data-memory-index="${index}" value="${key}" aria-label="Endereço de memória ${index}"><input class="memory-value" type="number" data-memory="${key}" value="${value}" aria-label="Valor de memória ${key}"></label>`).join('');
  document.querySelectorAll('.memory-value').forEach(i=>i.addEventListener('change',e=>memory[e.target.dataset.memory]=+e.target.value||0));
  document.querySelectorAll('.memory-name').forEach(i=>i.addEventListener('change',e=>{const valueInput=e.target.nextElementSibling,oldKey=valueInput.dataset.memory,newKey=e.target.value.trim().toUpperCase().replace(/\s+/g,'_')||oldKey;if(newKey!==oldKey&&newKey in memory){e.target.value=oldKey;$('output').textContent=`O endereço ${newKey} já existe.`;return}memory[newKey]=memory[oldKey];if(newKey!==oldKey)delete memory[oldKey];valueInput.dataset.memory=newKey;e.target.value=newKey}));
}
let lastDestination='';
function resetMachine(clear=false){pointer=0;stack=[];acc=0;traces=[];lastDestination='';values={};registerKeys().forEach(k=>values[k]=0);if(clear)$('codeEditor').value='';updateLines();renderRegisters();renderTrace();setFlow();$('cycleCount').textContent='CICLO 00';$('output').textContent='Máquina pronta.'}
function parseProgram(){return $('codeEditor').value.split('\n').map((raw,index)=>({raw:raw.trim(),line:index+1,text:raw.split(';')[0].trim()})).filter(x=>x.text)}
function calculate(op,a,b){if(op==='ADD')return a+b;if(op==='SUB')return a-b;if(op==='MUL')return a*b;if(op==='DIV'){if(b===0)throw Error('divisão por zero');return a/b}throw Error(`instrução ${op} inválida`)}
function step(){
  if(pointer===0)program=parseProgram();if(pointer>=program.length){$('output').textContent='Programa concluído.';return false}
  const item=program[pointer],parts=item.text.replaceAll(',',' ').split(/\s+/),op=parts.shift().toUpperCase(),args=parts;let source='',operation=op,dest='',result;
  try{
    if(arch===3){const [d,a,b]=args.map(resolveName);const va=read(a),vb=read(b);result=calculate(op,va,vb);values[d]=result;source=`${displayName(a)} (${va}) + ${displayName(b)} (${vb})`;dest=`${displayName(d)} ← ${result}`;lastDestination=d}
    else if(arch===2){const [d,s]=args.map(resolveName);const vs=read(s);if(op==='MOV'){result=vs;source=`${displayName(s)} (${vs})`;operation='TRANSFERÊNCIA'}else{const vd=read(d);result=calculate(op,vd,vs);source=`${displayName(d)} (${vd}) + ${displayName(s)} (${vs})`}values[d]=result;dest=`${displayName(d)} ← ${result}`;lastDestination=d}
    else if(arch===1){const target=resolveName(args[0]),v=read(target);if(op==='LOAD'){acc=v;source=`${displayName(target)} (${v})`;operation='TRANSFERÊNCIA'}else if(op==='STORE'){values[target]=acc;source=`ACC (${acc})`;dest=`${displayName(target)} ← ${acc}`;lastDestination=target}else{const before=acc;acc=calculate(op,acc,v);source=`ACC (${before}) + ${displayName(target)} (${v})`}if(!dest){dest=`ACC ← ${acc}`;lastDestination='ACC'}result=acc}
    else if(op==='PUSH'){const v=read(args[0]);stack.push(v);source=`${displayName(resolveName(args[0]))} (${v})`;operation='EMPILHAR';dest=`PILHA ← ${v}`;result=v;lastDestination=''}
    else if(op==='POP'){result=stack.pop()??0;const d=resolveName(args[0]||'RESULT');values[d]=result;source=`TOPO (${result})`;operation='DESEMPILHAR';dest=`${displayName(d)} ← ${result}`;lastDestination=d}
    else{const b=stack.pop(),a=stack.pop();if(a===undefined||b===undefined)throw Error('pilha sem operandos suficientes');result=calculate(op,a,b);stack.push(result);source=`PILHA (${a}) + TOPO (${b})`;dest=`PILHA ← ${result}`;lastDestination=''}
    pointer++;traces.push({cycle:pointer,line:item.line,instruction:item.text,source,operation,dest});
    renderRegisters();renderTrace();setFlow(source,operation,dest);highlightLine(item.line);$('cycleCount').textContent=`CICLO ${String(pointer).padStart(2,'0')}`;$('output').textContent=pointer===program.length?`Concluído · resultado ${result}`:`Ciclo ${pointer} concluído · ${dest}`;return pointer<program.length;
  }catch(error){$('output').textContent=`Erro na linha ${item.line}: ${error.message}`;$('flowStatus').textContent='ERRO';return false}
}
function run(){if(pointer>=parseProgram().length)resetMachine(false);let guard=0;while(step()&&guard++<100){} }
function setFlow(source='—',op='—',dest='—'){$('flowSource').textContent=source;$('flowOp').textContent=op;$('flowDest').textContent=dest;$('flowStatus').textContent=source==='—'?'AGUARDANDO':`CICLO ${String(pointer).padStart(2,'0')}`;document.querySelectorAll('.unit,.bus').forEach(el=>{el.classList.remove('pulse');void el.offsetWidth;if(source!=='—')el.classList.add('pulse')})}
function renderTrace(){$('traceBody').innerHTML=traces.length?traces.map(t=>`<tr><td>${String(t.cycle).padStart(2,'0')}</td><td><code>${t.instruction}</code></td><td>${t.source}</td><td><b>${t.operation}</b></td><td>${t.dest}</td></tr>`).join(''):'<tr class="empty"><td colspan="5">Execute ou avance um ciclo para visualizar o caminho.</td></tr>'}
function updateLines(){$('lineNumbers').textContent=$('codeEditor').value.split('\n').map((_,i)=>i+1).join('\n')}
function highlightLine(line){$('lineNumbers').dataset.active=line;$('codeEditor').style.setProperty('--active-line',line)}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
function exportPdf(){
  const registerRows=registerKeys().map(key=>`<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(displayName(key))}</td><td>${escapeHtml(values[key]??0)}</td></tr>`).join('');
  const memoryRows=Object.entries(memory).map(([key,value])=>`<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(value)}</td></tr>`).join('');
  const traceRows=traces.length?traces.map(t=>`<tr><td>${t.cycle}</td><td><code>${escapeHtml(t.instruction)}</code></td><td>${escapeHtml(t.source)}</td><td>${escapeHtml(t.operation)}</td><td>${escapeHtml(t.dest)}</td></tr>`).join(''):'<tr><td colspan="5">O programa ainda não foi executado.</td></tr>';
  const report=window.open('','_blank','width=980,height=760');
  if(!report){$('output').textContent='Permita pop-ups para exportar o PDF.';return}
  report.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Pulso — Programa</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font:12px Arial;color:#102a43;margin:0}header{border-bottom:3px solid #2296df;padding-bottom:14px;margin-bottom:24px;display:flex;justify-content:space-between}h1{font-size:24px;margin:0}h2{font-size:14px;color:#1269a2;margin:24px 0 8px}small{color:#607d91}pre{background:#082b4c;color:#fff;padding:16px;border-radius:6px;white-space:pre-wrap;font:11px/1.6 monospace}table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #bfd5e4;padding:7px;text-align:left}th{background:#e8f4fb;color:#0b527f}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.meta{margin:4px 0 20px;color:#45657a}@media print{button{display:none}}</style></head><body><header><div><h1>PULSO</h1><small>Relatório do programa</small></div><b>${escapeHtml($('machineId').textContent)}</b></header><p class="meta"><b>Arquitetura:</b> ${arch} endereço(s) · <b>Ciclos executados:</b> ${pointer}</p><h2>Código Assembly</h2><pre>${escapeHtml($('codeEditor').value)}</pre><div class="grid"><section><h2>Registradores</h2><table><thead><tr><th>Registrador</th><th>Nome</th><th>Valor</th></tr></thead><tbody>${registerRows}</tbody></table></section><section><h2>Memória</h2><table><thead><tr><th>Endereço</th><th>Valor</th></tr></thead><tbody>${memoryRows}</tbody></table></section></div><h2>Rastreamento dos ciclos</h2><table><thead><tr><th>Ciclo</th><th>Instrução</th><th>Leitura</th><th>Operação</th><th>Escrita</th></tr></thead><tbody>${traceRows}</tbody></table><script>window.onload=()=>{window.print()};window.onafterprint=()=>window.close()<\/script></body></html>`);
  report.document.close();$('output').textContent='Relatório aberto. Escolha “Salvar como PDF” na impressão.';
}

document.querySelectorAll('.arch').forEach(btn=>btn.addEventListener('click',()=>{arch=+btn.dataset.arch;document.querySelectorAll('.arch').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-checked',b===btn)});renderArchitecture()}));
$('registers').addEventListener('input',updateConfig);$('memorySize').addEventListener('input',()=>{updateConfig();renderMemory()});$('accumulator').addEventListener('change',updateConfig);$('codeEditor').addEventListener('input',()=>{updateLines();pointer=0});
$('loadExample').addEventListener('click',()=>{ $('codeEditor').value=architectures[arch].code;updateLines();resetMachine(false)});$('exportPdf').addEventListener('click',exportPdf);$('resetBtn').addEventListener('click',()=>resetMachine(false));$('stepBtn').addEventListener('click',step);$('runBtn').addEventListener('click',run);
$('themeBtn').addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('themeBtn').querySelector('span').textContent=dark?'☀':'☾';$('themeBtn').querySelector('b').textContent=dark?'Tema claro':'Tema escuro';localStorage.setItem('cpu-theme',dark?'dark':'light')});
if(localStorage.getItem('cpu-theme')==='dark')$('themeBtn').click();renderMemory();renderArchitecture();
