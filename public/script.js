/* ========================
   ELEMENT REFERENCES
======================== */
const display = document.getElementById("display");
const history = document.getElementById("history");
const historyPanel = document.getElementById("historyPanel");
const toggleBtn = document.getElementById("themeToggle");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

/* ========================
   BASIC CALCULATOR
======================== */
function append(value) {
    if (value === "π") {
        display.value += "π";
    } else {
        display.value += value;
    }
    playFeedback();
}


function clearAll() {
    display.value = "";
    history.textContent = "";
}

function deleteLast() {
    display.value = display.value.slice(0, -1);
}

/* ========================
   SCIENTIFIC BUTTON TEXT
======================== */
function sci(type) {
    display.value += type + "(";
}

/* ========================
   CALCULATION ENGINE
======================== */
function factorial(n) {
    n = Math.floor(n);
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
}

function calculate() {
    try {
        let exp = display.value;

        // Auto-close parentheses
        let open = (exp.match(/\(/g) || []).length;
        let close = (exp.match(/\)/g) || []).length;
        exp += ")".repeat(open - close);

        // Constants & operators
        exp = exp.replace(/π/g, "Math.PI");
        exp = exp.replace(/÷/g, "/").replace(/×/g, "*");
        exp = exp.replace(/\^/g, "**");

        // Factorial
        exp = exp.replace(/(\d+)!/g, (_, v) => `factorial(${v})`);

        // Trig (degrees)
        exp = exp.replace(/sin\(([^)]+)\)/g, (_, v) => `Math.sin((${v})*Math.PI/180)`);
        exp = exp.replace(/cos\(([^)]+)\)/g, (_, v) => `Math.cos((${v})*Math.PI/180)`);
        exp = exp.replace(/tan\(([^)]+)\)/g, (_, v) => `Math.tan((${v})*Math.PI/180)`);

        // Inverse trig (output in degrees)
        exp = exp.replace(/asin\(([^)]+)\)/g, (_, v) => `(Math.asin(${v})*180/Math.PI)`);
        exp = exp.replace(/acos\(([^)]+)\)/g, (_, v) => `(Math.acos(${v})*180/Math.PI)`);
        exp = exp.replace(/atan\(([^)]+)\)/g, (_, v) => `(Math.atan(${v})*180/Math.PI)`);

        // Log & sqrt
        exp = exp.replace(/log\(([^)]+)\)/g, (_, v) => `Math.log10(${v})`);
        exp = exp.replace(/sqrt\(([^)]+)\)/g, (_, v) => `Math.sqrt(${v})`);

        let result = Function('"use strict"; return (' + exp + ')')();

        history.textContent = display.value + " =";
        addToHistory(display.value, result);
        display.value = result;

    } catch {
        display.value = "Error";
    }
}


/* ========================
   HISTORY SYSTEM
======================== */
function addToHistory(exp, result) {
    if (!historyPanel) return;
    const div = document.createElement("div");
    div.textContent = `${exp} = ${result}`;
    historyPanel.appendChild(div);
    historyPanel.scrollTop = historyPanel.scrollHeight;
}

if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
        historyPanel.innerHTML = "";
    });
}
function addToHistory(exp, result) {
    fetch("/api/saveHistory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expression: exp, result: result })
    });

    const div = document.createElement("div");
    div.textContent = `${exp} = ${result}`;
    historyPanel.appendChild(div);
}

/* ========================
   MEMORY SYSTEM
======================== */
let memory = 0;
function memoryAdd() { memory += parseFloat(display.value) || 0; }
function memorySub() { memory -= parseFloat(display.value) || 0; }
function memoryRecall() { display.value = memory; }
function memoryClear() { memory = 0; }

/* ========================
   KEYBOARD SUPPORT
======================== */
document.addEventListener("keydown", (e) => {
    const active = document.activeElement;
    if (active.tagName === "INPUT") return;

    if (!isNaN(e.key) || "+-*/.%".includes(e.key)) append(e.key);
    else if (e.key === "Enter") calculate();
    else if (e.key === "Backspace") deleteLast();
    else if (e.key === "Escape") clearAll();
});

/* ========================
   THEME TOGGLE
======================== */
if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("light");
        toggleBtn.textContent = document.body.classList.contains("light") ? "🌞" : "🌙";
    });
}

/* ========================
   GRAPH PLOTTER
======================== */
let chart;
function plotGraph() {
    const func = document.getElementById("funcInput").value;
    const xVals = [], yVals = [];

    for (let x = -10; x <= 10; x += 0.5) {
        try {
            xVals.push(x);
            yVals.push(Function("x", "return " + func)(x));
        } catch {
            alert("Invalid function");
            return;
        }
    }

    if (chart) chart.destroy();
    chart = new Chart(document.getElementById("graphCanvas"), {
        type: "line",
        data: {
            labels: xVals,
            datasets: [{ label: "y = " + func, data: yVals, borderWidth: 2, fill: false }]
        }
    });
}

/* ========================
   EQUATION SOLVER
======================== */
function solveEquation() {
    const input = document.getElementById("eqInput").value.replace(/\s/g, "");
    const output = document.getElementById("solution");

    if (!input.includes("=")) {
        output.textContent = "Equation must contain '='";
        return;
    }

    let [left, right] = input.split("=");

    function parseSide(side) {
        side = side.replace(/-/g, "+-");
        let terms = side.split("+").filter(t => t !== "");
        let coeff = 0;
        let constant = 0;

        terms.forEach(term => {
            if (term.includes("x")) {
                let val = term.replace("x", "");
                if (val === "" || val === "+") val = 1;
                if (val === "-") val = -1;
                coeff += parseFloat(val);
            } else {
                constant += parseFloat(term);
            }
        });

        return { coeff, constant };
    }

    let L = parseSide(left);
    let R = parseSide(right);

    let finalCoeff = L.coeff - R.coeff;
    let finalConst = R.constant - L.constant;

    if (finalCoeff === 0) {
        output.textContent = "No unique solution.";
        return;
    }

    let x = finalConst / finalCoeff;
    output.textContent = `x = ${x}`;
}


/* ========================
   MATRIX CALCULATOR
======================== */
function getMatrix(prefix) {
    return [
        [parseFloat(document.getElementById(prefix+"11").value) || 0,
         parseFloat(document.getElementById(prefix+"12").value) || 0],
        [parseFloat(document.getElementById(prefix+"21").value) || 0,
         parseFloat(document.getElementById(prefix+"22").value) || 0]
    ];
}

function showMatrix(m) {
    document.getElementById("matrixResult").innerHTML =
        `[ ${m[0][0]} , ${m[0][1]} ]<br>[ ${m[1][0]} , ${m[1][1]} ]`;
}

function addMatrix() {
    let A = getMatrix("a"), B = getMatrix("b");
    showMatrix([[A[0][0]+B[0][0], A[0][1]+B[0][1]],
                [A[1][0]+B[1][0], A[1][1]+B[1][1]]]);
}

function mulMatrix() {
    let A = getMatrix("a"), B = getMatrix("b");
    showMatrix([[A[0][0]*B[0][0]+A[0][1]*B[1][0], A[0][0]*B[0][1]+A[0][1]*B[1][1]],
                [A[1][0]*B[0][0]+A[1][1]*B[1][0], A[1][0]*B[0][1]+A[1][1]*B[1][1]]]);
}

/* ========================
   QUADRATIC SOLVER
======================== */
function solveQuadratic() {
    let a = parseFloat(document.getElementById("qa").value);
    let b = parseFloat(document.getElementById("qb").value);
    let c = parseFloat(document.getElementById("qc").value);
    const output = document.getElementById("quadResult");

    // Validation
    if (isNaN(a) || isNaN(b) || isNaN(c)) {
        output.textContent = "Enter valid numbers.";
        return;
    }

    if (a === 0) {
        output.textContent = "Not quadratic (a cannot be 0).";
        return;
    }

    // Discriminant
    let d = b * b - 4 * a * c;

    if (d > 0) {
        // Two real roots
        let x1 = (-b + Math.sqrt(d)) / (2 * a);
        let x2 = (-b - Math.sqrt(d)) / (2 * a);
        output.textContent = `Two real roots: x₁ = ${x1}, x₂ = ${x2}`;
    }
    else if (d === 0) {
        // One real root
        let x = -b / (2 * a);
        output.textContent = `One real root: x = ${x}`;
    }
    else {
        // Complex roots
        let real = (-b / (2 * a)).toFixed(2);
        let imag = (Math.sqrt(-d) / (2 * a)).toFixed(2);
        output.textContent = `Complex roots: ${real} + ${imag}i , ${real} - ${imag}i`;
    }
}


/* ========================
   FEEDBACK
======================== */
const clickSound = new Audio("click.mp3");
function playFeedback() {
    clickSound.play();
    if (navigator.vibrate) navigator.vibrate(20);
}

/* ========================
   SERVICE WORKER
======================== */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
}
/* calculateInterest*/
function calculateInterest() {
    let P = parseFloat(document.getElementById("principal").value);
    let R = parseFloat(document.getElementById("rate").value);
    let T = parseFloat(document.getElementById("time").value);
    let type = document.getElementById("interestType").value;
    let freq = parseInt(document.getElementById("compoundFreq").value);
    let output = document.getElementById("interestResult");

    if (isNaN(P) || isNaN(R) || isNaN(T)) {
        output.textContent = "Enter valid numbers.";
        return;
    }

    let interest, total;

    if (type === "simple") {
        interest = (P * R * T) / 100;
        total = P + interest;
    } 
    else {
        total = P * Math.pow((1 + (R / 100) / freq), freq * T);
        interest = total - P;
    }

    output.innerHTML = `
        Interest Earned: ${interest.toFixed(2)} <br>
        Total Amount: ${total.toFixed(2)}
    `;
}
window.addEventListener("load", () => {
  document.querySelectorAll(".skeleton").forEach(el => {
    el.classList.remove("skeleton");
  });
});
function showTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.remove("active");
    });

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    document.getElementById(tabId).classList.add("active");

    event.target.classList.add("active");
}
window.addEventListener("load", async () => {
    const res = await fetch("/api/history");
    const data = await res.json();

    data.forEach(item => {
        const div = document.createElement("div");
        div.textContent = `${item.expression} = ${item.result}`;
        historyPanel.appendChild(div);
    });
});
function addToHistory(exp, result) {
    fetch("/api/saveHistory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expression: exp, result: result })
    });

    const div = document.createElement("div");
    div.textContent = `${exp} = ${result}`;
    historyPanel.appendChild(div);
}
