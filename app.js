/* ============================================================
   1. FIREBASE-KONFIGURATION
   Byt ut värdena nedan mot din egen config från Firebase Console
   (Project settings -> General -> Your apps -> SDK setup and config)
   ============================================================ */
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAm8SfU8t8vT7Jzu8YAhENjiudEpDhswo8",
  authDomain: "no4-schema.firebaseapp.com",
  projectId: "no4-schema",
  storageBucket: "no4-schema.firebasestorage.app",
  messagingSenderId: "480458374454",
  appId: "1:480458374454:web:192740991daba67d984797",
  measurementId: "G-TVPDYHDTKF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

/* Byt till valfritt lösenord för admin-fliken (enbart UI-skydd, ej riktig säkerhet) */
const ADMIN_PASSWORD = "Pubdata7101";

/* ============================================================
   2. HJÄLPFUNKTIONER FÖR DATUM/MÅNADER
   ============================================================ */
const MONTH_NAMES = ["januari","februari","mars","april","maj","juni","juli","augusti","september","oktober","november","december"];
const WEEKDAY_NAMES = ["söndag","måndag","tisdag","onsdag","torsdag","fredag","lördag"];

function todayDate() { return new Date(); }

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthKeyToName(key) {
  const [y, m] = key.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function addMonthsToKey(key, delta) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}

// Alla onsdagar (3) och fredagar (5) i en given månad "YYYY-MM"
function getShiftDatesInMonth(key) {
  const [y, m] = key.split("-").map(Number);
  const dates = [];
  const d = new Date(y, m - 1, 1);
  while (d.getMonth() === m - 1) {
    const day = d.getDay();
    if (day === 3 || day === 5) {
      dates.push({
        iso: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,
        label: `${WEEKDAY_NAMES[day][0].toUpperCase()}${WEEKDAY_NAMES[day].slice(1)} ${d.getDate()}/${d.getMonth()+1}`,
        weekday: day === 3 ? "onsdag" : "fredag"
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function formatDateNice(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const wd = WEEKDAY_NAMES[date.getDay()];
  return `${wd.charAt(0).toUpperCase() + wd.slice(1)} ${d}/${m}`;
}

/* ============================================================
   3. FLIKAR
   ============================================================ */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

/* ============================================================
   4. FLIK: FORMULÄR
   ============================================================ */
const today = todayDate();
const currentKey = monthKey(today);
// Formuläret gäller alltid NÄSTA månad (deadline är den 20:e)
const formTargetMonth = addMonthsToKey(currentKey, 1);

function initForm() {
  document.getElementById("form-title").textContent = `Formulär – ${monthKeyToName(formTargetMonth)}`;
  document.getElementById("form-subtitle").textContent = `Svara innan den 20:e denna månaden. Om du inte svarar alls antas du vilja jobba 1 pass och vara tillgänglig alla datum.`;

  const dates = getShiftDatesInMonth(formTargetMonth);
  const container = document.getElementById("dateCheckboxes");
  container.innerHTML = "";

  const allLabel = document.createElement("label");
  allLabel.innerHTML = `<input type="checkbox" id="availableAll" /> Jag är tillgänglig alla datum :D`;
  container.appendChild(allLabel);

  dates.forEach(dt => {
    const lbl = document.createElement("label");
    lbl.innerHTML = `<input type="checkbox" class="dateCheck" value="${dt.iso}" /> ${dt.label}`;
    container.appendChild(lbl);
  });

  document.getElementById("availableAll").addEventListener("change", (e) => {
    document.querySelectorAll(".dateCheck").forEach(cb => {
      cb.checked = false;
      cb.disabled = e.target.checked;
    });
  });
}

document.querySelectorAll('input[name="shifts"]').forEach(r => {
  r.addEventListener("change", (e) => {
    document.getElementById("frikortMotivering").style.display =
      e.target.value === "frikort" ? "block" : "none";
  });
});

document.getElementById("availabilityForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const shiftsEl = document.querySelector('input[name="shifts"]:checked');
  const shifts = shiftsEl ? shiftsEl.value : "1-2";
  const availableAll = document.getElementById("availableAll").checked;
  const unavailable = availableAll ? [] :
    Array.from(document.querySelectorAll(".dateCheck:checked")).map(cb => cb.value);
  const frikortText = document.getElementById("frikortText").value.trim();

  const statusEl = document.getElementById("formStatus");
  statusEl.textContent = "Skickar...";

  try {
    await db.collection("submissions").add({
      name,
      month: formTargetMonth,
      shifts,
      unavailable,
      frikortText: shifts === "frikort" ? frikortText : "",
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    statusEl.textContent = "✅ Tack! Ditt svar är inskickat.";
    e.target.reset();
    document.querySelectorAll(".dateCheck").forEach(cb => cb.disabled = false);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "❌ Något gick fel, försök igen.";
  }
});

/* ============================================================
   5. FLIK: SCHEMA
   ============================================================ */
async function loadSchedule(key) {
  const doc = await db.collection("schedules").doc(key).get();
  return doc.exists ? doc.data() : null;
}

function renderMonthBlock(elId, key, headerClass, headerLabelPrefix, data) {
  const el = document.getElementById(elId);
  if (!data) { el.innerHTML = ""; return; }

  let html = `<div class="month-header ${headerClass}">${headerLabelPrefix}${monthKeyToName(key)}</div>`;
  data.days.forEach(day => {
    html += `<div class="shift-card">
      <div class="shift-date">${formatDateNice(day.date)}${day.event ? " – " + day.event : ""} ${day.time ? `<span class="muted small">(${day.time})</span>` : ""}</div>`;
    html += `<div class="shift-role"><span>Serveringsansvarig</span><span>${day.servering || "–"}</span></div>`;
    (day.barlagare || []).forEach(b => {
      html += `<div class="shift-role"><span>Barlagare</span><span>${b || "–"}</span></div>`;
    });
    html += `</div>`;
  });
  el.innerHTML = html;
}

async function initSchedule() {
  const prevKey = addMonthsToKey(currentKey, -1);
  const nextKey = addMonthsToKey(currentKey, 1);

  const [prevData, curData, nextData] = await Promise.all([
    loadSchedule(prevKey),
    loadSchedule(currentKey),
    loadSchedule(nextKey)
  ]);

  renderMonthBlock("prevMonthBlock", prevKey, "prev", "Föregående månad – ", prevData);
  renderMonthBlock("currentMonthBlock", currentKey, "current", "Denna månaden – ", curData);

  // Nästa månads schema visas bara fr.o.m. den 21:a, om det är publicerat
  if (today.getDate() >= 21 && nextData) {
    renderMonthBlock("nextMonthBlock", nextKey, "next", "Nästa månad – ", nextData);
  } else {
    document.getElementById("nextMonthBlock").innerHTML = "";
  }
}

/* ============================================================
   6. FLIK: ADMIN
   ============================================================ */
document.getElementById("adminLoginBtn").addEventListener("click", () => {
  const pw = document.getElementById("adminPassword").value;
  if (pw === ADMIN_PASSWORD) {
    document.getElementById("adminLoginCard").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    initAdminMonthSelect();
  } else {
    alert("Fel lösenord");
  }
});

function initAdminMonthSelect() {
  const select = document.getElementById("adminMonthSelect");
  select.innerHTML = "";
  // Erbjud föregående, nuvarande och kommande två månader att redigera
  for (let d = -1; d <= 2; d++) {
    const key = addMonthsToKey(currentKey, d);
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = monthKeyToName(key);
    if (key === formTargetMonth) opt.selected = true;
    select.appendChild(opt);
  }
}

let currentBuilderMonth = null;

document.getElementById("loadSubmissionsBtn").addEventListener("click", async () => {
  const key = document.getElementById("adminMonthSelect").value;
  currentBuilderMonth = key;

  // Hämta svar
  const snap = await db.collection("submissions").where("month", "==", key).get();
  const tbody = document.querySelector("#submissionsTable tbody");
  tbody.innerHTML = "";
  snap.forEach(doc => {
    const s = doc.data();
    const tr = document.createElement("tr");
    const unavailableStr = (s.unavailable && s.unavailable.length)
      ? s.unavailable.map(formatDateNice).join(", ")
      : "Alla datum";
    tr.innerHTML = `<td>${s.name}</td><td>${s.shifts}</td><td>${unavailableStr}</td>`;
    tbody.appendChild(tr);
  });
  document.getElementById("submissionsCard").style.display = "block";

  // Bygg schema-formulär
  await buildScheduleEditor(key);
  document.getElementById("builderCard").style.display = "block";
});

async function buildScheduleEditor(key) {
  const container = document.getElementById("builderDays");
  container.innerHTML = "";

  const existing = await loadSchedule(key);
  const existingByDate = {};
  if (existing) existing.days.forEach(d => existingByDate[d.date] = d);

  const dates = getShiftDatesInMonth(key);

  dates.forEach(dt => {
    const isOnsdag = dt.weekday === "onsdag";
    const defaultTime = isOnsdag ? "17:30-22:30" : "20:30-02:30";
    const barCount = isOnsdag ? 2 : 3;
    const ex = existingByDate[dt.iso];

    const div = document.createElement("div");
    div.className = "builder-day";
    div.dataset.date = dt.iso;

    let barHtml = "";
    const barValues = ex ? ex.barlagare : new Array(barCount).fill("");
    const totalBarRows = Math.max(barCount, barValues.length);
    for (let i = 0; i < totalBarRows; i++) {
      barHtml += `<div class="builder-row">
        <input type="text" class="bar-input" placeholder="Barlagare ${i+1}" value="${barValues[i] || ""}" />
      </div>`;
    }

    div.innerHTML = `
      <strong>${dt.label}</strong>
      <div class="builder-row">
        <input type="text" class="event-input" placeholder="Ev. rubrik (t.ex. Quiz, Oktoberfest)" value="${ex ? ex.event || "" : ""}" />
        <input type="text" class="time-input" placeholder="Tid" value="${ex ? ex.time || defaultTime : defaultTime}" />
      </div>
      <div class="builder-row">
        <input type="text" class="servering-input" placeholder="Serveringsansvarig" value="${ex ? ex.servering || "" : ""}" />
      </div>
      <div class="bar-wrapper">${barHtml}</div>
      <button type="button" class="btn-secondary add-bar-btn">+ Lägg till barlagare</button>
    `;

    div.querySelector(".add-bar-btn").addEventListener("click", () => {
      const wrapper = div.querySelector(".bar-wrapper");
      const row = document.createElement("div");
      row.className = "builder-row";
      row.innerHTML = `<input type="text" class="bar-input" placeholder="Barlagare" />`;
      wrapper.appendChild(row);
    });

    container.appendChild(div);
  });
}

document.getElementById("saveScheduleBtn").addEventListener("click", async () => {
  const key = currentBuilderMonth;
  const dayEls = document.querySelectorAll("#builderDays .builder-day");
  const days = [];

  dayEls.forEach(div => {
    days.push({
      date: div.dataset.date,
      event: div.querySelector(".event-input").value.trim(),
      time: div.querySelector(".time-input").value.trim(),
      servering: div.querySelector(".servering-input").value.trim(),
      barlagare: Array.from(div.querySelectorAll(".bar-input")).map(i => i.value.trim())
    });
  });

  const statusEl = document.getElementById("adminStatus");
  statusEl.textContent = "Sparar...";
  try {
    await db.collection("schedules").doc(key).set({
      month: key,
      days,
      publishedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    statusEl.textContent = "✅ Schema sparat och publicerat!";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "❌ Något gick fel.";
  }
});

/* ============================================================
   7. INIT
   ============================================================ */
initForm();
initSchedule();
