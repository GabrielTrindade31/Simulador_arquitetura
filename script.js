const architectures = {
  3: { description: 'Cada instrução informa o destino e dois operandos. Não altera os dados originais.', instructions: [['ADD','Soma dois operandos'],['SUB','Subtrai o segundo do primeiro'],['MUL','Multiplica dois operandos'],['DIV','Divide o primeiro pelo segundo']], example: 'SUB R1, A, B', explain: 'Calcula A − B e armazena o resultado em R1.', code: '; Calcular (A - B) × C\nSUB R1, A, B\nMUL R2, R1, C' },
  2: { description: 'O primeiro operando também recebe o resultado. Use MOV para preservar os valores originais.', instructions: [['MOV','Copia um valor para o destino'],['ADD','Soma ao registrador destino'],['SUB','Subtrai do registrador destino'],['MUL','Multiplica o registrador destino'],['DIV','Divide o registrador destino']], example: 'SUB R1, B', explain: 'Subtrai B de R1 e guarda o resultado em R1.', code: '; Calcular (A - B) × C\nMOV R1, A\nSUB R1, B\nMUL R1, C' },
  1: { description: 'As operações usam o acumulador de forma implícita. LOAD e STORE movimentam os dados.', instructions: [['LOAD','Carrega um valor no acumulador'],['STORE','Salva o valor do acumulador'],['ADD','Soma um valor ao acumulador'],['SUB','Subtrai um valor do acumulador'],['MUL','Multiplica o acumulador'],['DIV','Divide o acumulador']], example: 'LOAD A  ·  SUB B', explain: 'Carrega A no acumulador e então subtrai B.', code: '; Calcular (A - B) × C\nLOAD A\nSUB B\nMUL C\nSTORE RESULT' },
  0: { description: 'Uma máquina de pilha usa operandos implícitos. PUSH empilha dados; as operações consomem o topo.', instructions: [['PUSH','Coloca um valor na pilha'],['POP','Retira o valor do topo'],['ADD','Soma os dois valores do topo'],['SUB','Subtrai os dois valores do topo'],['MUL','Multiplica os dois valores do topo'],['DIV','Divide os dois valores do topo']], example: 'PUSH A  ·  PUSH B  ·  SUB', explain: 'Empilha A e B; SUB consome ambos e empilha A − B.', code: '; Calcular (A - B) × C\nPUSH A\nPUSH B\nSUB\nPUSH C\nMUL\nPOP RESULT' }
};
const memory = { A:12, B:4, C:3, D:2, E:5, F:2, G:1, H:2, RESULT:0 };
let arch = 3, values = {}, cycle = 0;
const $ = id => document.getElementById(id);

function renderArchitecture(loadCode=true){
  const data=architectures[arch];
  $('archDescription').textContent=data.description;
  $('instructionCount').textContent=`${data.instructions.length} OPERAÇÕES`;
  $('instructionList').innerHTML=data.instructions.map(([op,desc])=>`<div class="instruction"><b>${op}</b><span>${desc}</span></div>`).join('');
  $('quickExample').textContent=data.example; $('exampleExplanation').textContent=data.explain;
  if(loadCode) $('codeEditor').value=data.code;
  if(arch===1){$('accumulator').checked=true;$('accumulator').disabled=true}else{$('accumulator').disabled=false}
  updateMachine(); updateLines(); resetState(false);
}
function updateMachine(){
  const regs=+$('registers').value; $('regValue').textContent=regs;
  $('machineId').textContent=`${arch}E–${String(regs).padStart(2,'0')}R–${$('accumulator').checked?'ACC':'STD'}`;
  renderRegisters();
}
function renderRegisters(){
  const count=+$('registers').value, accumulator=$('accumulator').checked;
  let html=accumulator?`<div class="register"><span>ACC</span><b>${values.ACC??'0x0000'}</b></div>`:'';
  for(let i=1;i<=count;i++) html+=`<div class="register"><span>R${i}</span><b>${values['R'+i]??'0x0000'}</b></div>`;
  $('registerList').innerHTML=html;
}
function resetState(clear=true){values={};cycle=0;$('cycleCount').textContent='CICLO 00';$('output').innerHTML='Aguardando execução<span class="blink">_</span>';renderRegisters();if(clear){$('codeEditor').value='';updateLines()}}
function valueOf(token){token=token?.toUpperCase();if(token in values)return Number(values[token]);if(token in memory)return memory[token];return Number(token)||0}
function execute(){
  values={}; cycle=0; const stack=[]; let acc=0;
  const lines=$('codeEditor').value.split('\n').map(x=>x.split(';')[0].trim()).filter(Boolean);
  try{for(const line of lines){cycle++;const [op,...args]=line.replaceAll(',',' ').split(/\s+/);const cmd=op.toUpperCase();
    if(arch===3){const [d,a,b]=args.map(x=>x.toUpperCase());values[d]=calculate(cmd,valueOf(a),valueOf(b))}
    else if(arch===2){const [d,s]=args.map(x=>x.toUpperCase());if(cmd==='MOV')values[d]=valueOf(s);else values[d]=calculate(cmd,valueOf(d),valueOf(s))}
    else if(arch===1){const target=args[0]?.toUpperCase();if(cmd==='LOAD')acc=valueOf(target);else if(cmd==='STORE')values[target]=acc;else acc=calculate(cmd,acc,valueOf(target));values.ACC=acc}
    else {if(cmd==='PUSH')stack.push(valueOf(args[0]));else if(cmd==='POP')values[args[0]?.toUpperCase()||'RESULT']=stack.pop()??0;else{const b=stack.pop(),a=stack.pop();stack.push(calculate(cmd,a,b))}}
  }}catch(e){$('output').textContent=`Erro: ${e.message}`;return}
  $('cycleCount').textContent=`CICLO ${String(cycle).padStart(2,'0')}`;renderRegisters();
  const result=values.RESULT ?? values.R2 ?? values.R1 ?? values.ACC ?? stack.at(-1) ?? 0;
  $('output').textContent=`Execução concluída · resultado = ${result}`;
}
function calculate(op,a,b){if(op==='ADD')return a+b;if(op==='SUB')return a-b;if(op==='MUL')return a*b;if(op==='DIV'){if(b===0)throw Error('divisão por zero');return a/b}throw Error(`instrução ${op} inválida`)}
function updateLines(){$('lineNumbers').textContent=$('codeEditor').value.split('\n').map((_,i)=>i+1).join('\n')}

document.querySelectorAll('.arch-card').forEach(btn=>btn.addEventListener('click',()=>{arch=+btn.dataset.arch;document.querySelectorAll('.arch-card').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-checked',b===btn)});renderArchitecture()}));
$('registers').addEventListener('input',updateMachine);$('accumulator').addEventListener('change',updateMachine);
$('codeEditor').addEventListener('input',updateLines);$('loadExample').addEventListener('click',()=>{ $('codeEditor').value=architectures[arch].code;updateLines() });
$('runBtn').addEventListener('click',execute);$('resetBtn').addEventListener('click',()=>resetState(true));
$('memoryGrid').innerHTML=Object.entries(memory).slice(0,4).map(([k,v])=>`<div class="memory-cell"><span>${k}</span>${v}</div>`).join('');
renderArchitecture();
