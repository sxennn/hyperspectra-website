const canvas = document.getElementById("scanCanvas");
const ctx = canvas.getContext("2d");
let paused = false;
let frame = 0;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawScan() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  ctx.save();
  ctx.translate(cx, cy);

  for (let i = 0; i < 46; i++) {
    const angle = i * 2.399 + frame * 0.003;
    const radius = 55 + ((i * 37 + frame * 0.22) % 145);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.72;
    const alpha = 0.12 + (i % 5) * 0.035;
    ctx.fillStyle = `rgba(117,221,201,${alpha})`;
    ctx.fillRect(x, y, 1 + (i % 3), 1);
  }

  ctx.strokeStyle = "rgba(183,227,61,.12)";
  ctx.lineWidth = 1;
  for (let r = 60; r < 155; r += 30) {
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.72, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  if (!paused) frame++;
  requestAnimationFrame(drawScan);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
drawScan();

const demoToggle = document.getElementById("demoToggle");
demoToggle.addEventListener("click", () => {
  paused = !paused;
  demoToggle.innerHTML = paused
    ? '<span class="pause-icon">▶</span> Resume simulation'
    : '<span class="pause-icon">Ⅱ</span> Pause simulation';
  document.getElementById("coreLabel").textContent = paused ? "PAUSED" : "SCANNING";
  document.querySelector(".scan-sweep").style.animationPlayState = paused ? "paused" : "running";
});

setInterval(() => {
  if (paused) return;
  const throughput = 420 + Math.round(Math.sin(Date.now() / 900) * 7);
  document.getElementById("throughputValue").textContent = throughput;
  document.getElementById("confidenceValue").textContent =
    (98.4 + Math.random() * 0.5).toFixed(1) + "%";
}, 900);

document.querySelectorAll(".anomaly").forEach((marker) => {
  marker.addEventListener("click", () => {
    document.querySelectorAll(".anomaly").forEach((item) => item.classList.remove("selected"));
    marker.classList.add("selected");
    document.getElementById("confidenceValue").textContent =
      Number(marker.dataset.confidence).toFixed(1) + "%";
    document.getElementById("coreLabel").textContent = marker.dataset.type.toUpperCase();
  });
});

const loopSteps = [
  { kicker:"LIVE ACQUISITION", title:"Scan", text:"Photon-counting bands capture material energy signatures as product moves at line speed.", label:"FRAME WINDOW", stat:"12 ms" },
  { kicker:"ENERGY SEPARATION", title:"Spectral decomposition", text:"Detected energy is decomposed into spectral bands to separate subtle material and density differences.", label:"SPECTRAL BANDS", stat:"24 channels" },
  { kicker:"MODEL INFERENCE", title:"AI classification", text:"A classification model compares signatures against known material profiles and confidence thresholds.", label:"INFERENCE STATE", stat:"Edge / live" },
  { kicker:"ACTIVE SEPARATION", title:"Automated rejection", text:"Confirmed anomalies trigger precise line-side separation while acceptable product continues forward.", label:"RESPONSE WINDOW", stat:"< 25 ms" },
  { kicker:"PROCESS OPTIMIZATION", title:"Process feedback", text:"Aggregated anomalies feed yield and process dashboards to identify upstream control opportunities.", label:"FEEDBACK LOOP", stat:"Continuous" }
];

const loopNodes = document.querySelectorAll(".loop-node");
function setLoopStep(index) {
  loopNodes.forEach((node, i) => node.classList.toggle("active", i === index));
  const step = loopSteps[index];
  document.getElementById("loopStepNo").textContent = `0${index + 1} / 05`;
  document.getElementById("loopStepName").textContent = step.title;
  document.getElementById("loopKicker").textContent = step.kicker;
  document.getElementById("loopDetailTitle").textContent = step.title;
  document.getElementById("loopDetailText").textContent = step.text;
  document.getElementById("loopStatLabel").textContent = step.label;
  document.getElementById("loopStatValue").textContent = step.stat;
  document.getElementById("detailProgress").style.width = `${(index + 1) * 20}%`;
  const circumference = 1370;
  document.querySelector(".loop-progress").style.strokeDashoffset =
    circumference - ((index + 1) / 5) * circumference;
}
loopNodes.forEach((node) => node.addEventListener("click", () => setLoopStep(Number(node.dataset.step))));
setLoopStep(0);

let loopIndex = 0;
let loopTimer = setInterval(() => {
  loopIndex = (loopIndex + 1) % loopSteps.length;
  setLoopStep(loopIndex);
}, 4200);
loopNodes.forEach((node) => node.addEventListener("click", () => {
  loopIndex = Number(node.dataset.step);
  clearInterval(loopTimer);
  loopTimer = setInterval(() => {
    loopIndex = (loopIndex + 1) % loopSteps.length;
    setLoopStep(loopIndex);
  }, 4200);
}));

const chartData = {
  roc: {
    kicker:"CLASSIFICATION PERFORMANCE",
    title:"Receiver operating characteristic",
    html:'<svg class="roc-chart" viewBox="0 0 760 410" role="img" aria-label="Illustrative ROC comparison chart"><g class="grid"><line x1="68" y1="40" x2="720" y2="40"/><line x1="68" y1="132" x2="720" y2="132"/><line x1="68" y1="224" x2="720" y2="224"/><line x1="68" y1="316" x2="720" y2="316"/><line x1="68" y1="40" x2="68" y2="360"/><line x1="231" y1="40" x2="231" y2="360"/><line x1="394" y1="40" x2="394" y2="360"/><line x1="557" y1="40" x2="557" y2="360"/><line x1="720" y1="40" x2="720" y2="360"/></g><g class="axis-labels"><text x="68" y="382">0</text><text x="231" y="382">25</text><text x="394" y="382">50</text><text x="557" y="382">75</text><text x="720" y="382">100</text><text x="68" y="66" transform="rotate(-90 68 66)">Sensitivity (%)</text><text x="394" y="405">False positive rate (%)</text></g><path class="conventional-line" d="M68,360 C120,290 180,220 250,164 C330,100 450,72 720,40"/><path class="multi-line" d="M68,360 C150,190 240,92 350,58 C460,30 580,38 720,40"/><g class="roc-point"><circle cx="350" cy="58" r="7"/><line x1="350" y1="58" x2="350" y2="360"/><line x1="68" y1="58" x2="350" y2="58"/></g></svg>'
  },
  histogram: {
    kicker:"MATERIAL SEPARATION",
    title:"Illustrative density histogram",
    html:'<svg class="histogram-chart" viewBox="0 0 760 410" role="img" aria-label="Illustrative density histogram"><g class="grid"><line x1="68" y1="40" x2="720" y2="40"/><line x1="68" y1="132" x2="720" y2="132"/><line x1="68" y1="224" x2="720" y2="224"/><line x1="68" y1="316" x2="720" y2="316"/></g><g fill="rgba(117,221,201,.25)" stroke="#75ddc9"><rect x="85" y="290" width="52" height="70"/><rect x="137" y="238" width="52" height="122"/><rect x="189" y="174" width="52" height="186"/><rect x="241" y="105" width="52" height="255"/><rect x="293" y="82" width="52" height="278"/><rect x="345" y="126" width="52" height="234"/><rect x="397" y="205" width="52" height="155"/><rect x="449" y="270" width="52" height="90"/></g><g fill="rgba(239,141,81,.35)" stroke="#ef8d51"><rect x="470" y="300" width="28" height="60"/><rect x="498" y="248" width="28" height="112"/><rect x="526" y="186" width="28" height="174"/><rect x="554" y="130" width="28" height="230"/><rect x="582" y="106" width="28" height="254"/><rect x="610" y="156" width="28" height="204"/><rect x="638" y="224" width="28" height="136"/><rect x="666" y="284" width="28" height="76"/></g><g class="axis-labels"><text x="68" y="382">0.8</text><text x="260" y="382">1.0</text><text x="450" y="382">1.2</text><text x="680" y="382">1.4 g/cm³</text><text x="68" y="66" transform="rotate(-90 68 66)">Relative frequency</text></g></svg>'
  },
  reject: {
    kicker:"FALSE-REJECT COMPARISON",
    title:"Illustrative reject-rate trend",
    html:'<svg class="reject-chart" viewBox="0 0 760 410" role="img" aria-label="Illustrative reject rate comparison"><g class="grid"><line x1="68" y1="40" x2="720" y2="40"/><line x1="68" y1="132" x2="720" y2="132"/><line x1="68" y1="224" x2="720" y2="224"/><line x1="68" y1="316" x2="720" y2="316"/></g><path d="M68,315 C130,300 190,278 250,260 C330,238 390,220 450,190 C530,155 610,128 720,102" fill="none" stroke="#737b78" stroke-width="3" stroke-dasharray="5 6"/><path d="M68,340 C130,328 190,310 250,284 C330,250 390,210 450,166 C530,112 610,82 720,58" fill="none" stroke="#b7e33d" stroke-width="3"/><g class="axis-labels"><text x="68" y="382">1</text><text x="230" y="382">4</text><text x="394" y="382">8</text><text x="550" y="382">12</text><text x="700" y="382">16 runs</text><text x="68" y="66" transform="rotate(-90 68 66)">False rejects (%)</text></g></svg>'
  }
};

document.querySelectorAll(".chart-tabs button").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".chart-tabs button").forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    const data = chartData[tab.dataset.chart];
    document.getElementById("chartKicker").textContent = data.kicker;
    document.getElementById("chartTitle").textContent = data.title;
    document.getElementById("chartWrap").innerHTML = data.html;
  });
});

const revealTargets = document.querySelectorAll(
  ".section-heading, .loop-layout, .performance-grid, .deployment-head, .deployment-grid, .team-head, .team-card, .cta-section"
);
revealTargets.forEach((target) => target.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach((target) => observer.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("visible"));
}

const stage = document.getElementById("orbitalStage");
if (stage && window.matchMedia("(pointer: fine)").matches) {
  stage.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
    stage.querySelector(".core").style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
    stage.querySelector(".orbit-b").style.transform = `translate(${x * -0.2}px, ${y * -0.2}px)`;
  });
  stage.addEventListener("pointerleave", () => {
    stage.querySelector(".core").style.transform = "";
    stage.querySelector(".orbit-b").style.transform = "";
  });
}

const flowCanvas = document.getElementById("flowCanvas");
const flowCtx = flowCanvas.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let flowWidth = 0;
let flowHeight = 0;
let flowFrame = 0;

function resizeFlowCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  flowWidth = window.innerWidth;
  flowHeight = window.innerHeight;
  flowCanvas.width = flowWidth * dpr;
  flowCanvas.height = flowHeight * dpr;
  flowCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeFlowCanvas);
resizeFlowCanvas();

function drawFlowBackground() {
  flowCtx.clearRect(0, 0, flowWidth, flowHeight);
  if (!reduceMotion) flowFrame++;

  const t = flowFrame * 0.002;
  const gradient = flowCtx.createRadialGradient(
    flowWidth * (0.65 + Math.sin(t * 1.2) * 0.08),
    flowHeight * (0.38 + Math.cos(t) * 0.06),
    20,
    flowWidth * 0.65,
    flowHeight * 0.38,
    flowWidth * 0.42
  );
  gradient.addColorStop(0, "rgba(117,221,201,.055)");
  gradient.addColorStop(.38, "rgba(183,227,61,.018)");
  gradient.addColorStop(1, "rgba(9,11,13,0)");
  flowCtx.fillStyle = gradient;
  flowCtx.fillRect(0, 0, flowWidth, flowHeight);

  flowCtx.save();
  flowCtx.globalAlpha = .12;
  flowCtx.strokeStyle = "#75ddc9";
  flowCtx.lineWidth = .5;
  for (let band = 0; band < 4; band++) {
    flowCtx.beginPath();
    const baseY = flowHeight * (.18 + band * .19);
    for (let x = -40; x <= flowWidth + 40; x += 22) {
      const y = baseY +
        Math.sin(x * .007 + t * (1.1 + band * .12) + band) * (18 + band * 5) +
        Math.cos(x * .013 - t * .7) * 7;
      if (x === -40) flowCtx.moveTo(x, y);
      else flowCtx.lineTo(x, y);
    }
    flowCtx.stroke();
  }
  flowCtx.restore();

  cursorParticles.forEach((particle, index) => {
    particle.x += (particle.targetX - particle.x) * .18;
    particle.y += (particle.targetY - particle.y) * .18;
    particle.life *= .94;
    if (particle.life > .08) {
      flowCtx.beginPath();
      flowCtx.fillStyle = `rgba(183,227,61,${particle.life * .55})`;
      flowCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      flowCtx.fill();
    }
  });

  if (!reduceMotion) requestAnimationFrame(drawFlowBackground);
}

const cursorParticles = Array.from({ length: 14 }, (_, index) => ({
  x: -100,
  y: -100,
  targetX: -100,
  targetY: -100,
  size: 1 + (index % 3) * .35,
  life: 0
}));
let particleIndex = 0;
let ringX = -100;
let ringY = -100;
const cursorDot = document.querySelector(".cursor-dot");
const cursorRing = document.querySelector(".cursor-ring");

if (window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("pointermove", (event) => {
    document.body.classList.add("cursor-active");
    cursorDot.style.transform = `translate(${event.clientX - 2.5}px,${event.clientY - 2.5}px)`;
    ringX += (event.clientX - ringX) * .16;
    ringY += (event.clientY - ringY) * .16;
    cursorRing.style.transform = `translate(${ringX - 17}px,${ringY - 17}px)`;

    const particle = cursorParticles[particleIndex++ % cursorParticles.length];
    particle.targetX = event.clientX + (Math.random() - .5) * 12;
    particle.targetY = event.clientY + (Math.random() - .5) * 12;
    particle.life = .7;
  });
  window.addEventListener("pointerleave", () => document.body.classList.remove("cursor-active"));
  document.querySelectorAll("a,button,.team-card,.loop-node").forEach((target) => {
    target.addEventListener("pointerenter", () => document.body.classList.add("cursor-hover"));
    target.addEventListener("pointerleave", () => document.body.classList.remove("cursor-hover"));
  });

  function animateCursorRing() {
    ringX += (ringX - ringX) * 0;
    ringY += (ringY - ringY) * 0;
    cursorRing.style.transform = `translate(${ringX - 17}px,${ringY - 17}px)`;
    if (!reduceMotion) requestAnimationFrame(animateCursorRing);
  }
  animateCursorRing();
}

drawFlowBackground();
