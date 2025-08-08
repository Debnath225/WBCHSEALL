
// Config
const QUESTION_COUNT = 30;         // default # questions (if available)
const AUTO_ADVANCE_MS = 1400;      // ms to wait before auto advance on answer
const EXCELLENT_TIME = 1400;       // how long to show the "Excellent" badge

// App state
let dataJSON = null;
let questionPool = [];
let shuffledQuestions = [];
let currentIndex = 0;
let score = 0;
let results = []; // store user answer records

// DOM refs
const chapterName = document.getElementById('chapterName');
const questionText = document.getElementById('questionText');
const optionsWrap = document.getElementById('optionsWrap');
const questionHint = document.getElementById('questionHint');
const progBar = document.getElementById('progBar');
const qIndex = document.getElementById('qIndex');
const scoreEl = document.getElementById('score');
const scorePercent = document.getElementById('scorePercent');
const scoreText = document.getElementById('scoreText');
const metaRight = document.getElementById('metaRight');
const numQEl = document.getElementById('numQ');
const excellentBadge = document.getElementById('excellentBadge');
const finalModal = document.getElementById('finalModal');
const finalScoreBig = document.getElementById('finalScoreBig');
const finalPercent = document.getElementById('finalPercent');
const finalMsg = document.getElementById('finalMsg');
const std = document.getElementById("std");

// Buttons
document.getElementById('btnRestart').addEventListener('click', restartQuiz);
document.getElementById('btnLoad').addEventListener('click', () => loadJSON(true));
document.getElementById('closeFinal').addEventListener('click', () => finalModal.style.display='none');
document.getElementById('exportJSON').addEventListener('click', exportResultsJSON);
document.getElementById('exportCSV').addEventListener('click', exportResultsCSV);

// confetti
const confettiCanvas = document.getElementById('confettiCanvas');
const confettiCtx = confettiCanvas.getContext('2d');
let confettiItems = [];
let confettiRunning = false;

function resizeCanvas(){
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// small utility
function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a; }
function uniq(a){ return [...new Set(a)]; }

// Build a pool of question objects from JSON.
// We'll create two types per formula if possible:
// - 'identify_formula': given name -> choose correct formula expression
// - 'term_meaning': given formula + term -> choose meaning of term
function buildQuestionPool(json){
  const pool = [];
  if(!json || !Array.isArray(json.chapters)) return pool;
  json.chapters.forEach(ch=>{
    const chapterTitle = ch.chapter || ch.name || "Chapter";
    if(!Array.isArray(ch.formulas)) return;
    ch.formulas.forEach(f=>{
      // Ensure fields exist
      const name = f.name || f.title || f.description || "Unnamed formula";
      const formulaExpr = f.formula || f.formula_text || f.expression || "";
      // identify_formula
      if(formulaExpr){
        pool.push({
          type: 'identify_formula',
          chapter: chapterTitle,
          name,
          correct: formulaExpr,
          description: f.description || "",
          origin: f
        });
      }
      // term_meaning for each term in terms object
      if(f.terms && typeof f.terms === 'object'){
        Object.entries(f.terms).forEach(([term,meaning])=>{
          pool.push({
            type: 'term_meaning',
            chapter: chapterTitle,
            name,
            term,
            correct: meaning,
            formula: formulaExpr,
            description: f.description || "",
            origin: f
          });
        });
      }
    });
  });
  return pool;
}

// Generate 4 options for a given question object
function generateOptions(q, pool){
  const opts = new Set();
  opts.add(q.correct);
  const tries = pool.slice(); shuffle(tries);
  for(let i=0;i<tries.length && opts.size<4;i++){
    const cand = tries[i];
    // choose a candidate option value depending on question type
    if(q.type === 'identify_formula'){
      const val = cand.correct; // another formula expression
      if(val && val !== q.correct) opts.add(val);
    } else if(q.type === 'term_meaning'){
      // candidate meaning: try to get a term meaning from random formula
      if(cand.type === 'term_meaning') {
        const val = cand.correct;
        if(val && val !== q.correct) opts.add(val);
      } else if(cand.type === 'identify_formula'){
        // fallback: take description or formula text as distractor
        const val = cand.description || cand.correct;
        if(val && val !== q.correct) opts.add(val);
      }
    }
  }
  // if still <4, pad with short placeholders (unlikely if pool big)
  while(opts.size < 4) opts.add((Math.random().toString(36).slice(2,9)));
  const arr = shuffle(Array.from(opts));
  return arr;
}

function prepareQuestions(pool, desiredCount){
  // shuffle pool then pick desiredCount unique questions
  const copy = shuffle(pool.slice());
  const pick = copy.slice(0, Math.min(desiredCount, copy.length));
  // attach options
  pick.forEach(q=>{
    q.options = generateOptions(q, pool);
  });
  return pick;
}

// Render current question
function renderQuestion(){
  if(!shuffledQuestions.length) {
    questionText.textContent = "No questions available.";
    optionsWrap.innerHTML = "";
    return;
  }
  const q = shuffledQuestions[currentIndex];
  chapterName.textContent = q.chapter || '—';
  let qtext = '';
  if(q.type === 'identify_formula'){
    qtext = `Which of the following is the correct formula for: "${q.name}"?`;
    questionHint.textContent = q.description || "";
  } else if(q.type === 'term_meaning'){
    qtext = `In the formula "${q.formula || ''}", what does "${q.term}" represent?`;
    questionHint.textContent = q.description || "";
  } else {
    qtext = q.name || "Identify the correct option";
  }
  questionText.textContent = qtext;

  // options
  optionsWrap.innerHTML = '';
  q.options.forEach(opt=>{
    const btn = document.createElement('button');
    btn.className = 'opt';
    btn.innerHTML = `<div style="font-weight:600">${opt}</div>`;
    btn.onclick = ()=>handleAnswer(btn, opt, q);
    optionsWrap.appendChild(btn);
  });

  // update progress & sidebar
  qIndex.textContent = `${currentIndex+1} / ${shuffledQuestions.length}`;
  const pct = Math.round(((currentIndex)/Math.max(1,shuffledQuestions.length))*100);
  progBar.style.width = pct + '%';
  numQEl.textContent = shuffledQuestions.length;
  scoreEl.textContent = score;
  scorePercent.textContent = `${Math.round((score/Math.max(1,shuffledQuestions.length))*100)}%`;
  scoreText.textContent = `Answered: ${currentIndex} • Remaining: ${Math.max(0, shuffledQuestions.length - currentIndex)}`;
  metaRight.textContent = `Loaded chapters: ${dataJSON && dataJSON.chapters ? dataJSON.chapters.length : 0}`;
}

// Handle answer click
let answering = false;
function handleAnswer(btn, choice, q){
  if(answering) return;
  answering = true;
  // disable all options immediately
  const allBtn = optionsWrap.querySelectorAll('.opt');
  allBtn.forEach(b=>{ b.classList.add('disabled'); b.disabled = true; });

  const correct = (choice === q.correct);
  // style chosen
  if(correct){
    btn.classList.add('correct');
    score++;
    showExcellent();
    launchConfetti();
  } else {
    btn.classList.add('incorrect');
    // reveal correct option:
    allBtn.forEach(b=>{
      if(b.innerText.trim() === q.correct){
        b.classList.add('correct');
      }
    });
  }

  // record result
  results.push({
    index: currentIndex,
    question: q.type === 'identify_formula' ? `Formula: ${q.name}` : `Term: ${q.term} in ${q.name}`,
    selected: choice,
    correct: q.correct,
    correctBool: correct,
    chapter: q.chapter
  });

  // update sidebar after small pause
  scoreEl.textContent = score;
  scorePercent.textContent = `${Math.round((score/Math.max(1,shuffledQuestions.length))*100)}%`;

  // auto advance
  setTimeout(()=>{
    answering = false;
    currentIndex++;
    if(currentIndex >= shuffledQuestions.length){
      showFinal();
    } else {
      renderQuestion();
    }
  }, AUTO_ADVANCE_MS);
}

// "Excellent" badge
function showExcellent(){
  excellentBadge.classList.add('show');
  setTimeout(()=> excellentBadge.classList.remove('show'), EXCELLENT_TIME);
}

/* ---------------- confetti ---------------- */
function launchConfetti(){
  // create particles
  confettiItems = [];
  const count = 80;
  for(let i=0;i<count;i++){
    confettiItems.push({
      x: Math.random()*confettiCanvas.width,
      y: -20 - Math.random()*300,
      r: 6 + Math.random()*8,
      d: Math.random()*Math.PI*2,
      vx: (Math.random()-0.5)*6,
      vy: 2 + Math.random()*6,
      color: `hsl(${Math.floor(Math.random()*360)} 90% 60%)`,
      rot: Math.random()*360,
      vr: (Math.random()-0.5)*12
    });
  }
  if(!confettiRunning) {
    confettiRunning = true;
    runConfetti();
  }
  // stop after 1.5s
  setTimeout(()=> confettiRunning = false, 1500);
}

function runConfetti(){
  if(!confettiRunning && confettiItems.length===0){ clearCanvas(); return; }
  confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
  confettiItems.forEach((p, i)=>{
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rot * Math.PI/180);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.r/2, -p.r/2, p.r, p.r*0.6);
    confettiCtx.restore();

    // physics
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12; // gravity
    p.rot += p.vr * 0.2;

    // remove if off-screen
    if(p.y > confettiCanvas.height + 50) confettiItems.splice(i,1);
  });
  if(confettiRunning || confettiItems.length) requestAnimationFrame(runConfetti);
}

function clearCanvas(){ confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height); }

/* ---------------- final screen ---------------- */
function showFinal(){
  // compute final stats
  finalModal.style.display = 'block';
  finalScoreBig.textContent = `${score} / ${shuffledQuestions.length}`;
  const pct = Math.round((score / Math.max(1,shuffledQuestions.length)) * 100);
  finalPercent.textContent = `${pct}%`;
  finalMsg.textContent = pct >= 80 ? "Excellent work — you're ready!" : pct >= 50 ? "Good effort — revise the weak areas." : "Keep practicing — try again!";
  // hide main UI visually by dimming (optional) - but we'll leave it
}

/* ---------------- exports ---------------- */
function exportResultsJSON(){
  const blob = new Blob([JSON.stringify({results,score,total:shuffledQuestions.length}, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'quiz-results.json'; a.click();
  URL.revokeObjectURL(url);
}
function exportResultsCSV(){
  const rows = [['index','question','selected','correct','isCorrect','chapter']];
  results.forEach(r => rows.push([r.index, r.question.replace(/"/g,'""'), r.selected.replace(/"/g,'""'), r.correct.replace(/"/g,'""'), r.correctBool, r.chapter]));
  const csv = rows.map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'quiz-results.csv'; a.click();
  URL.revokeObjectURL(url);
}

/* ---------------- start / restart / load ---------------- */
function restartQuiz(){
  if(!dataJSON){ loadJSON(); return; }
  // rebuild pool & shuffle
  questionPool = buildQuestionPool(dataJSON);
  shuffledQuestions = prepareQuestions(questionPool, QUESTION_COUNT);
  // ensure we have at least 6 questions
  if(shuffledQuestions.length < 6) shuffledQuestions = prepareQuestions(questionPool, Math.max(6, shuffledQuestions.length));
  currentIndex = 0; score = 0; results = [];
  finalModal.style.display = 'none';
  renderQuestion();
}

function prepareQuestions(pool, desired){
  // try to balance types: pick a mix of 'identify_formula' and 'term_meaning'
  const byType = {identify_formula: [], term_meaning: []};
  pool.forEach(q => {
    if(q.type === 'identify_formula') byType.identify_formula.push(q);
    else if(q.type === 'term_meaning') byType.term_meaning.push(q);
    else byType.identify_formula.push(q);
  });
  const chosen = [];
  let i=0;
  while(chosen.length < desired && (byType.identify_formula.length || byType.term_meaning.length)){
    // alternate picking type when possible
    const pickType = (i%2===0 && byType.identify_formula.length) ? 'identify_formula' : (byType.term_meaning.length ? 'term_meaning' : 'identify_formula');
    if(byType[pickType].length){
      const item = byType[pickType].splice(Math.floor(Math.random()*byType[pickType].length),1)[0];
      // generate options now to avoid repeats
      item.options = generateOptions(item, pool);
      chosen.push(item);
    }
    i++;
  }
  return shuffle(chosen);
}

async function loadJSON(force=false){
  try{
    // load physics.json from same folder
    let url;
    const getClass = localStorage.getItem('selectedClass');
    switch(getClass){
      case '5': url = 'physics-5.json'; break;
      case '6': url = 'physics-6.json'; break;
      case '7': url = 'physics-7.json'; break;
      case '8': url = 'physics-8.json'; break;
      case '9': url = 'physics-9.json'; break;
      case '10': url = 'physics-10.json'; break; 
      case '11': url = 'physics-11.json'; break;
      case '12': url = 'physics-12.json'; break;
      default: url = 'physics.json'; break; // default fallback
    }
    const res = await fetch(`${url}`, {cache: force ? 'reload' : 'default'});
    if(!res.ok) throw new Error('Failed to load physics.json — make sure it is served from same folder and accessible.');
    dataJSON = await res.json();
    metaRight.textContent = `Loaded: ${dataJSON.chapters ? dataJSON.chapters.length : '0'} chapters`;
    std.textContent =`${dataJSON.standerd ? dataJSON.standerd : 'No standard found'}`;
    // create pool & start
    questionPool = buildQuestionPool(dataJSON);
    numQEl.textContent = Math.min(QUESTION_COUNT, questionPool.length);
    // prepare and start quiz automatically
    shuffledQuestions = prepareQuestions(questionPool, QUESTION_COUNT);
    currentIndex = 0; score = 0; results = [];
    renderQuestion();
  }catch(err){
    questionText.textContent = 'Error loading physics.json — open console for details.';
    console.error(err);
    metaRight.textContent = 'Error loading JSON';
  }
}

// initial load
loadJSON();
