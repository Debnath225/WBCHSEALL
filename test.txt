import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Embedded formula data (chapter-wise) — derived from WBCHSE Class 11 Physics formula set
const FORMULA_DATA = {
  board: "WBCHSE (Class 11 Physics - major topics)",
  notes:
    "Each formula object includes: name, formula, terms, and description.",
  chapters: [
    {
      chapter: "Physical World & Measurement",
      formulas: [
        {
          name: "Dimensional formula of a quantity",
          formula: "M^a L^b T^c",
          terms: {
            M: "dimension of mass",
            L: "dimension of length",
            T: "dimension of time",
            'a,b,c': "exponents specific to the quantity"
          },
          description:
            "Expresses any physical quantity in base dimensions of mass (M), length (L), and time (T)."
        },
        {
          name: "Percent error / Percentage uncertainty",
          formula: "percent_error = (|measured - true| / true) × 100",
          terms: {
            measured: "measured value of the quantity",
            true: "accepted/true value",
            percent_error: "relative error expressed as percentage"
          },
          description:
            "Gives relative deviation of measured value from true value as a percent."
        }
      ]
    },
    {
      chapter: "Kinematics (Rectilinear & Plane Motion)",
      formulas: [
        {
          name: "Displacement - time relation (constant acceleration)",
          formula: "s = u t + (1/2) a t^2",
          terms: {
            s: "displacement (m)",
            u: "initial velocity (m/s)",
            a: "acceleration (m/s^2)",
            t: "time elapsed (s)"
          },
          description:
            "Gives displacement after time t when acceleration a is constant and initial velocity is u."
        },
        {
          name: "Final velocity (constant acceleration)",
          formula: "v = u + a t",
          terms: {
            v: "final velocity (m/s)",
            u: "initial velocity (m/s)",
            a: "acceleration (m/s^2)",
            t: "time elapsed (s)"
          },
          description: "Relates initial and final velocities under constant acceleration."
        },
        {
          name: "Velocity–displacement relation (no time)",
          formula: "v^2 = u^2 + 2 a s",
          terms: {
            v: "final velocity (m/s)",
            u: "initial velocity (m/s)",
            a: "acceleration (m/s^2)",
            s: "displacement (m)"
          },
          description:
            "Links velocities and displacement without explicit time when acceleration is constant."
        },
        {
          name: "Projectile motion — components & range/height",
          formula:
            "u_x = u cosθ, u_y = u sinθ, t_total = (2 u sinθ) / g, R = (u^2 sin 2θ)/g, H = (u^2 sin^2 θ)/(2g)",
          terms: {
            u: "initial speed (m/s)",
            θ: "launch angle from horizontal",
            g: "acceleration due to gravity (~9.8 m/s^2)",
            R: "horizontal range (m)",
            H: "maximum height (m)"
          },
          description: "Standard relations for projectile motion (neglects air resistance)."
        }
      ]
    },
    {
      chapter: "Laws of Motion & Friction",
      formulas: [
        {
          name: "Newton's Second Law",
          formula: "F = m a",
          terms: { F: "net force (N)", m: "mass (kg)", a: "acceleration (m/s^2)" },
          description:
            "Net force on an object equals mass times acceleration; vector relation."
        },
        { name: "Momentum", formula: "p = m v", terms: { p: "momentum", m: "mass", v: "velocity" }, description: "Momentum = mass × velocity." },
        { name: "Impulse", formula: "J = Δp = F_avg Δt", terms: { J: "impulse", Δp: "change in momentum", F_avg: "average force", Δt: "time" }, description: "Impulse equals change in momentum." },
        { name: "Friction", formula: "f_s(max) = μ_s N, f_k = μ_k N", terms: { f_s_max: "max static friction", f_k: "kinetic friction", μ_s: "coeff of static friction", μ_k: "coeff of kinetic friction", N: "normal force" }, description: "Relations for frictional forces." }
      ]
    },
    {
      chapter: "Work, Energy & Power",
      formulas: [
        { name: "Work done by constant force", formula: "W = F ⋅ s = F s cosφ", terms: { W: "work (J)", F: "force (N)", s: "displacement (m)", φ: "angle between F and s" }, description: "Scalar product of force and displacement." },
        { name: "Kinetic Energy", formula: "K = (1/2) m v^2", terms: { K: "kinetic energy (J)", m: "mass (kg)", v: "speed (m/s)" }, description: "Energy of motion." },
        { name: "Work–Energy theorem", formula: "W_net = ΔK", terms: { W_net: "net work", ΔK: "change in kinetic energy" }, description: "Net work equals change in KE." },
        { name: "Power", formula: "P = dW/dt = F ⋅ v", terms: { P: "power (W)", F: "force (N)", v: "velocity (m/s)" }, description: "Rate of doing work." },
        { name: "Potential energy (near Earth)", formula: "U = m g h", terms: { U: "potential energy (J)", m: "mass (kg)", g: "gravity (m/s^2)", h: "height (m)" }, description: "Gravitational potential energy." }
      ]
    },
    {
      chapter: "System of Particles & Rotational Motion",
      formulas: [
        { name: "Center of mass (discrete)", formula: "R_cm = (Σ m_i r_i) / (Σ m_i)", terms: { R_cm: "center of mass position", m_i: "individual masses", r_i: "position vectors" }, description: "Weighted average position of mass distribution." },
        { name: "Torque", formula: "τ = r × F", terms: { τ: "torque (N·m)", r: "position vector", F: "force" }, description: "Tendency of force to rotate body." },
        { name: "Rotational kinematics", formula: "ω = ω_0 + α t; θ = ω_0 t + (1/2) α t^2; ω^2 = ω_0^2 + 2 α θ", terms: { ω: "angular velocity", ω_0: "initial angular velocity", α: "angular acceleration", θ: "angular displacement" }, description: "Analogues of linear kinematic equations for rotation." },
        { name: "Moment of inertia (discrete)", formula: "I = Σ m_i r_i^2", terms: { I: "moment of inertia", m_i: "mass", r_i: "distance from axis" }, description: "Resistance to angular acceleration." }
      ]
    },
    {
      chapter: "Gravitation",
      formulas: [
        { name: "Universal law of gravitation", formula: "F = G (m1 m2) / r^2", terms: { F: "force (N)", G: "grav const", m1: "mass 1", m2: "mass 2", r: "distance" }, description: "Mutual attractive force between two masses." },
        { name: "Gravitational potential energy", formula: "U = - G (m1 m2) / r", terms: { U: "potential energy", G: "grav const", m1: "mass 1", m2: "mass 2", r: "separation" }, description: "Potential energy of two masses." },
        { name: "g near Earth's surface", formula: "g = G M_E / R_E^2", terms: { g: "acc due to gravity", G: "grav const", M_E: "mass of Earth", R_E: "radius of Earth" }, description: "Surface gravitational acceleration." }
      ]
    },
    {
      chapter: "Properties of Bulk Matter",
      formulas: [
        { name: "Stress", formula: "σ = F / A", terms: { σ: "stress (Pa)", F: "force (N)", A: "area (m^2)" }, description: "Force per unit area." },
        { name: "Strain", formula: "ε = ΔL / L", terms: { ε: "strain", ΔL: "change in length", L: "original length" }, description: "Fractional change in length." },
        { name: "Hooke's law", formula: "σ = E ε", terms: { σ: "stress", E: "Young's modulus", ε: "strain" }, description: "Stress ∝ strain within elastic limit." },
        { name: "Hydrostatic pressure", formula: "P = P0 + ρ g h", terms: { P: "pressure at depth", P0: "surface pressure", ρ: "density", g: "gravity", h: "depth" }, description: "Pressure increases with depth." },
        { name: "Buoyant force", formula: "F_b = ρ_fluid V_sub g", terms: { F_b: "buoyant force", ρ_fluid: "fluid density", V_sub: "submerged volume", g: "gravity" }, description: "Upthrust equals weight of displaced fluid." }
      ]
    },
    {
      chapter: "Thermodynamics & Heat",
      formulas: [
        { name: "First law of thermodynamics", formula: "ΔU = Q - W", terms: { ΔU: "change in internal energy", Q: "heat added", W: "work done by system" }, description: "Energy conservation for thermodynamic systems." },
        { name: "Work (P-V)", formula: "W = ∫ P dV", terms: { W: "work", P: "pressure", V: "volume" }, description: "Area under P-V curve is work done." },
        { name: "Specific heat", formula: "Q = m c ΔT", terms: { Q: "heat", m: "mass", c: "specific heat", ΔT: "temperature change" }, description: "Heat required to raise temperature." },
        { name: "Latent heat", formula: "Q = m L", terms: { Q: "heat for phase change", m: "mass", L: "latent heat" }, description: "Heat for phase change at constant temperature." }
      ]
    },
    {
      chapter: "Kinetic Theory of Gases",
      formulas: [
        { name: "Ideal gas equation", formula: "PV = n R T", terms: { P: "pressure", V: "volume", n: "moles", R: "gas constant", T: "temperature" }, description: "Equation of state for ideal gases." },
        { name: "Avg kinetic energy per molecule", formula: "(1/2) m v_rms^2 = (3/2) k_B T", terms: { m: "mass of molecule", v_rms: "root-mean-square speed", k_B: "Boltzmann const", T: "temperature" }, description: "Relates molecular kinetic energy to temperature." },
        { name: "Pressure from molecular motion", formula: "P = (1/3) ρ v_rms^2", terms: { P: "pressure", ρ: "mass density", v_rms: "rms speed" }, description: "Kinetic theory relation for pressure." }
      ]
    },
    {
      chapter: "Oscillations & Waves",
      formulas: [
        { name: "SHM displacement", formula: "x(t) = A cos(ω t + φ)", terms: { x: "displacement", A: "amplitude", ω: "angular frequency", φ: "phase", t: "time" }, description: "Solution for simple harmonic motion." },
        { name: "Angular frequency & period", formula: "ω = 2π / T = 2π f", terms: { ω: "angular frequency", T: "period", f: "frequency" }, description: "Relation between ω, T and f." },
        { name: "Mass-spring SHM", formula: "ω = sqrt(k / m), T = 2π sqrt(m / k)", terms: { k: "spring constant", m: "mass" }, description: "Natural frequency and period for mass-spring system." },
        { name: "Wave speed", formula: "v = f λ", terms: { v: "wave speed", f: "frequency", λ: "wavelength" }, description: "Relation between speed, frequency and wavelength." }
      ]
    }
  ],
  sources: [
    "WBCHSE Physics syllabus (official)",
    "CBSE / NCERT and formula booklets",
    "Educational formula compendiums used for cross-checking"
  ]
};

// Utility: flatten formulas into list of questionable facts
function buildQuestionPool(data) {
  const pool = [];
  data.chapters.forEach((ch) => {
    ch.formulas.forEach((f) => {
      // Q-type 1: Identify formula by name
      pool.push({
        type: 'identify_formula',
        chapter: ch.chapter,
        name: f.name,
        correct: f.formula,
        options: generateOptions(f.formula, ch, data)
      });

      // Q-type 2: Identify term meaning (pick a random term)
      const termKeys = Object.keys(f.terms);
      if (termKeys.length) {
        const k = termKeys[Math.floor(Math.random() * termKeys.length)];
        pool.push({
          type: 'term_meaning',
          chapter: ch.chapter,
          name: f.name,
          term: k,
          correct: f.terms[k],
          options: generateTermOptions(f.terms[k], ch, data)
        });
      }

      // Q-type 3: Short description -> ask which formula matches the description
      pool.push({
        type: 'match_description',
        chapter: ch.chapter,
        name: f.name,
        correctName: f.name,
        options: generateNameOptions(f.name, ch, data)
      });
    });
  });
  return shuffleArray(pool);
}

function generateOptions(correctFormula, chapter, data) {
  const opts = new Set([correctFormula]);
  // pick random formulas from other chapters
  while (opts.size < 4) {
    const ch = data.chapters[Math.floor(Math.random() * data.chapters.length)];
    const f = ch.formulas[Math.floor(Math.random() * ch.formulas.length)];
    opts.add(f.formula);
  }
  return shuffleArray(Array.from(opts));
}

function generateTermOptions(correctTerm, chapter, data) {
  const opts = new Set([correctTerm]);
  while (opts.size < 4) {
    const ch = data.chapters[Math.floor(Math.random() * data.chapters.length)];
    const f = ch.formulas[Math.floor(Math.random() * ch.formulas.length)];
    const keys = Object.keys(f.terms);
    if (keys.length) {
      const val = f.terms[keys[Math.floor(Math.random() * keys.length)]];
      opts.add(val);
    }
  }
  return shuffleArray(Array.from(opts));
}

function generateNameOptions(correctName, chapter, data) {
  const opts = new Set([correctName]);
  while (opts.size < 4) {
    const ch = data.chapters[Math.floor(Math.random() * data.chapters.length)];
    const f = ch.formulas[Math.floor(Math.random() * ch.formulas.length)];
    opts.add(f.name);
  }
  return shuffleArray(Array.from(opts));
}

function shuffleArray(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Small confetti implementation using CSS animated divs
function Confetti({ burst }) {
  if (!burst) return null;
  const pieces = Array.from({ length: 24 });
  return (
    <div className="pointer-events-none fixed inset-0 flex items-start justify-center z-50">
      <div className="w-full h-0 relative" style={{ top: '10vh' }}>
        {pieces.map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: 0, opacity: 1, scale: 1 }}
            animate={{ y: 600 + Math.random() * 200, x: (Math.random() - 0.5) * 800, rotate: 720 }}
            transition={{ duration: 1.4 + Math.random() * 0.6 }}
            className="absolute w-3 h-3 rounded-sm"
            style={{
              left: `${Math.random() * 100}%`,
              background: `hsl(${Math.random() * 360}deg 80% 60%)`
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function FormulaQuizApp() {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [burst, setBurst] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const pool = buildQuestionPool(FORMULA_DATA).slice(0, 12); // start with 12 questions
    setQuestions(pool);
  }, []);

  if (!questions.length) return <div className="p-6">Loading quiz...</div>;

  const q = questions[index];

  function chooseOption(opt) {
    if (selected !== null) return; // prevent re-answer
    setSelected(opt);
    let isCorrect = false;
    if (q.type === 'identify_formula') {
      isCorrect = opt === q.correct;
    } else if (q.type === 'term_meaning') {
      isCorrect = opt === q.correct;
    } else if (q.type === 'match_description') {
      isCorrect = opt === q.correctName;
    }

    if (isCorrect) {
      setScore((s) => s + 1);
      setFeedback('Excellent!');
      setBurst(true);
      setTimeout(() => setBurst(false), 1600);
    } else {
      setFeedback('Not quite — the correct answer is highlighted.');
    }

    // auto-advance after short delay
    setTimeout(() => {
      setSelected(null);
      setFeedback(null);
      if (index + 1 < questions.length) {
        setIndex(index + 1);
      } else {
        setShowResult(true);
      }
    }, 1500);
  }

  function restart() {
    const pool = buildQuestionPool(FORMULA_DATA).slice(0, 12);
    setQuestions(pool);
    setIndex(0);
    setScore(0);
    setShowResult(false);
    setSelected(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 flex items-start justify-center">
      <Confetti burst={burst} />
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">WBCHSE Class-11 Physics — Formula Quiz</h1>
          <div className="text-sm text-slate-600">Question {index + 1} / {questions.length}</div>
        </header>

        {!showResult ? (
          <div>
            <section className="mb-4">
              <div className="text-sm text-indigo-700 font-medium">Chapter: {q.chapter}</div>
              <h2 className="text-xl font-bold mt-2">
                {q.type === 'identify_formula' && `Which of the following is the formula for "${q.name}"?`}
                {q.type === 'term_meaning' && `In the formula "${q.name}", what does "${q.term}" mean?`}
                {q.type === 'match_description' && `Which formula name best matches the concept "${q.name}"?`}
              </h2>
              {q.type === 'identify_formula' && (
                <p className="mt-2 text-slate-600 italic">(Pick the mathematical expression)</p>
              )}
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {q.options.map((opt, i) => {
                const isSelected = selected === opt;
                const isCorrect = (q.type === 'identify_formula' && opt === q.correct) || (q.type === 'term_meaning' && opt === q.correct) || (q.type === 'match_description' && opt === q.correctName);
                const showCorrect = selected !== null && isCorrect;
                return (
                  <button
                    key={i}
                    onClick={() => chooseOption(opt)}
                    className={`p-4 text-left rounded-xl border transition-shadow hover:shadow-md focus:outline-none relative ${isSelected ? 'ring-2 ring-indigo-400' : ''} ${showCorrect ? 'bg-green-50 border-green-400' : ''}`}
                  >
                    <div className="font-medium truncate">{typeof opt === 'string' && opt}</div>
                    <div className="text-sm text-slate-600 mt-1">{typeof opt === 'string' && opt.length > 120 ? opt : ''}</div>
                    {showCorrect && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full w-9 h-9 flex items-center justify-center">✓</motion.div>
                    )}
                    {selected !== null && isSelected && !isCorrect && (
                      <div className="absolute -top-3 -left-3 bg-red-500 text-white rounded-full w-9 h-9 flex items-center justify-center">✕</div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 text-sm text-slate-500 h-6">{feedback}</div>

            <div className="mt-6 flex justify-between items-center text-sm text-slate-600">
              <div>Score: {score}</div>
              <div>
                <button onClick={restart} className="px-3 py-1 bg-slate-100 rounded-md hover:bg-slate-200">Restart</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-block p-6 bg-indigo-600 text-white rounded-2xl shadow-xl">
              <div className="text-3xl font-bold">Your Score</div>
              <div className="text-6xl font-bold mt-4">{score} / {questions.length}</div>
              <div className="mt-2">{Math.round((score / questions.length) * 100)}% </div>
            </motion.div>

            <div className="mt-6 flex justify-center gap-3">
              <button onClick={restart} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md">Play again</button>
              <button onClick={() => { navigator.clipboard.writeText(JSON.stringify({ questions, score }, null, 2)); }} className="px-4 py-2 border rounded-md">Copy results (JSON)</button>
            </div>

            <div className="mt-6 text-sm text-slate-500">Tip: you can increase the number of questions by editing the source (questions slice length).</div>
          </div>
        )}
      </div>
    </div>
  );
}
