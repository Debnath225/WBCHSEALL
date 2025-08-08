let questions = [];
let current = 0;
let score = 0;
let maxQuestions = 0; // will be detected automatically

const quizEl = document.getElementById('quiz');
const canvas = document.querySelector('.confetti');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let confettiParticles = [];

// Load JSON data
fetch('physics.json')
    .then(res => res.json())
    .then(data => {
        questions = generateQuestions(data);
        maxQuestions = questions.length; // detect automatically
        showQuestion();
    })
    .catch(err => {
        quizEl.innerHTML = `<p style="color:red;">Failed to load questions. Check physics.json</p>`;
        console.error(err);
    });

// Generate questions from JSON
function generateQuestions(data) {
    const qList = [];
    data.forEach(item => {
        const keys = Object.keys(item.terms);
        keys.forEach(term => {
            const correct = item.terms[term];
            const wrongOptions = [];
            while (wrongOptions.length < 3) {
                const randomFormula = data[Math.floor(Math.random() * data.length)];
                const randomTerm = Object.keys(randomFormula.terms)[0];
                const wrong = randomFormula.terms[randomTerm];
                if (wrong !== correct && !wrongOptions.includes(wrong)) {
                    wrongOptions.push(wrong);
                }
            }
            const options = [correct, ...wrongOptions].sort(() => Math.random() - 0.5);
            qList.push({
                question: `In the formula ${item.formula}, what does '${term}' represent?`,
                options,
                answer: correct
            });
        });
    });
    return qList.sort(() => Math.random() - 0.5);
}

// Show question
function showQuestion() {
    if (current >= maxQuestions) {
        quizEl.innerHTML = `
            <div class="score-screen">
                Quiz Over!<br>Your score: ${score} / ${maxQuestions}
                <br><br>
                <button onclick="restartQuiz()">Restart</button>
            </div>`;
        return;
    }
    const q = questions[current];
    quizEl.innerHTML = `
        <div class="question">(${current + 1}/${maxQuestions}) ${q.question}</div>
        <div class="options">
            ${q.options.map(opt => `<button>${opt}</button>`).join('')}
        </div>
    `;
    document.querySelectorAll('.options button').forEach(btn => {
        btn.addEventListener('click', () => selectAnswer(btn, q.answer));
    });
}

// Select answer
function selectAnswer(button, correctAnswer) {
    const buttons = document.querySelectorAll('.options button');
    buttons.forEach(btn => btn.disabled = true);
    if (button.textContent === correctAnswer) {
        button.classList.add('correct');
        score++;
        launchConfetti();
        setTimeout(() => {
            current++;
            showQuestion();
        }, 1200);
    } else {
        button.classList.add('incorrect');
        setTimeout(() => {
            current++;
            showQuestion();
        }, 1000);
    }
}

// Restart
function restartQuiz() {
    current = 0;
    score = 0;
    showQuestion();
}

// Confetti animation
function createConfetti() {
    for (let i = 0; i < 100; i++) {
        confettiParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 4,
            d: Math.random() * 50 + 50,
            color: `hsl(${Math.random()*360},100%,50%)`,
            tilt: Math.random() * 10 - 10
        });
    }
}
function drawConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiParticles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2, false);
        ctx.fillStyle = p.color;
        ctx.fill();
    });
    updateConfetti();
}
function updateConfetti() {
    confettiParticles.forEach(p => {
        p.y += Math.cos(p.d) + 1 + p.r/2;
        p.x += Math.sin(p.d);
    });
}
function launchConfetti() {
    confettiParticles = [];
    createConfetti();
    let duration = 1000;
    let end = Date.now() + duration;
    (function frame() {
        drawConfetti();
        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
}
