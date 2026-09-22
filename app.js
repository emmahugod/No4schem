/* ============================================================
   1. FIREBASE-KONFIGURATION (Compat SDK)
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyAm8SfU8t8vT7Jzu8YAhENjiudEpDhswo8",
  authDomain: "no4-schema.firebaseapp.com",
  projectId: "no4-schema",
  storageBucket: "no4-schema.firebasestorage.app",
  messagingSenderId: "480458374454",
  appId: "1:480458374454:web:192740991daba67d984797",
  measurementId: "G-TVPDYHDTKF"
};

// Initiera Firebase & Firestore
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* Lösenord för admin-fliken */
const ADMIN_PASSWORD = "Pubdata7101";

/* Standardlistor som fallback om databasen saknar data */
const SERVERINGSANSVARIGA = [
  "Emma Hugod", "Wilmer Stenberg", "Andrea Aulin", "Oscar Regner",
  "Assar Holst", "Hannes Svanström", "Jensine Svensson", "Måns Svahn", "Leonard Hillerback"
];

const ALLA_BARLAGARE = [
  "Adrian Arnqvist", "Agnes Thelberg", "Andrea Aulin", "Arve Lignell",
  "Assar Holst", "Astrid Kellerman", "Carl Henriksson", "Colin Mohlen",
  "Ella Fjäderstål", "Emanuel Kronstrand", "Emma Hugod", "Fayes Sarraj",
  "Filip Wettre", "Hannes Svanström", "Jensine Svensson", "Joel Bjurström",
  "Leonard Hillerback", "Maja Nådell", "Marcus Eisner", "Måns Svahn", "Noel Anundi",
  "Olle Stjernström", "Oscar Regner", "Sebastian Axelsson", "Willy Zedell",
  "Wilma Forslin", "Wilmer Stenberg"
];

/* Globala variabler för barlaget */
let currentSA = [...SERVERINGSANSVARIGA];
let currentAlla = [...ALLA_BARLAGARE];

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

// Hämta alla onsdagar (3) och fredagar (5)
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
   3. NAVIGATION / FLIKAR
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
   4. FLIK 1: FORMULÄR
   ============================================================ */
const today = todayDate();
const currentKey = monthKey(today);
const formTargetMonth = addMonthsToKey(currentKey, 1);

function initForm() {
  const dayOfMonth = today.getDate();
  const formCard = document.getElementById("formCard");
  const formClosedMsg = document.getElementById("formClosedMsg");

  // Formuläret är öppet mellan 1:a och 20:e
  if (dayOfMonth > 20) {
    formCard.style.display = "none";
    formClosedMsg.style.display = "block";
    return;
  }

  formCard.style.display = "block";
  formClosedMsg.style.display = "none";

  document.getElementById("form-title").textContent = `Formulär – ${monthKeyToName(formTargetMonth)}`;
  document.getElementById("form-subtitle").textContent = `Svara innan den 20:e denna månad. Svarar du inte antas du vilja jobba 1 pass och vara tillgänglig alla datum.`;

  const dates = getShiftDatesInMonth(formTargetMonth);
  const container = document.getElementById("dateCheckboxes");
  container.innerHTML = "";

  const allLabel = document.createElement("label");
  allLabel.innerHTML = `<input type="checkbox" id="availableAll" /> Jag kan jobba ALLA datum :D`;
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
  const name = document.getElementById("nameSelect").value;
  const shiftsEl = document.querySelector('input[name="shifts"]:checked');
  const shifts = shiftsEl ? shiftsEl.value : "1";
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
   5. FLIK 2: SCHEMA
   ============================================================ */
async function loadSchedule(key) {
  const doc = await db.collection("schedules").doc(key).get();
  return doc.exists ? doc.data() : null;
}

function renderMonthBlock(elId, key, data) {
  const el = document.getElementById(elId);
  if (!el) return;

  if (!data) {
    const nextKey = addMonthsToKey(currentKey, 1);
    if (key >= nextKey && today.getDate() < 21) {
      el.innerHTML = `<div class="card muted">Nästa månads schema publiceras den 21:a.</div>`;
    } else {
      el.innerHTML = `<div class="card muted">Inget schema tillgängligt för denna månad.</div>`;
    }
    return;
  }

  let html = `<div class="month-header current">${monthKeyToName(key)}</div>`;
  data.days.forEach(day => {
    html += `<div class="shift-card">
      <div class="shift-date">${formatDateNice(day.date)}${day.event ? " – " + day.event : ""} ${day.time ? `<span class="muted small">(${day.time})</span>` : ""}</div>`;
    html += `<div class="shift-role"><span>Serveringsansvarig</span><span><strong>${day.servering || "–"}</strong></span></div>`;
    (day.barlagare || []).forEach((b, i) => {
      html += `<div class="shift-role"><span>Barlagare ${i+1}</span><span>${b || "–"}</span></div>`;
    });
    html += `</div>`;
  });
  el.innerHTML = html;
}

async function displaySelectedMonth(key) {
  const container = document.getElementById("selectedMonthBlock");
  if (container) {
    container.innerHTML = `<div class="card muted">Laddar schema...</div>`;
  }

  const nextKey = addMonthsToKey(currentKey, 1);
  if (today.getDate() >= 21 && key === nextKey) {
    const existingNext = await loadSchedule(nextKey);
    if (!existingNext) {
      await generateAutoSchedule(nextKey);
    }
  }

  const data = await loadSchedule(key);
  renderMonthBlock("selectedMonthBlock", key, data);
}

function initScheduleSelect() {
  const select = document.getElementById("scheduleMonthSelect");
  if (!select) return;

  select.innerHTML = "";

  for (let d = -6; d <= 3; d++) {
    const key = addMonthsToKey(currentKey, d);
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = monthKeyToName(key);
    if (key === currentKey) {
      opt.selected = true;
    }
    select.appendChild(opt);
  }

  select.addEventListener("change", (e) => {
    displaySelectedMonth(e.target.value);
  });

  displaySelectedMonth(currentKey);
}

/* ============================================================
   6. SLUMPNING AV SCHEMA MED ÖNSKADE PASS & KAN EJ-RESPEKT
   ============================================================ */
async function generateAutoSchedule(key) {
  // Säkerställ att vi har den mest uppdaterade listan över barlaget från Firestore
  await loadTeamData();

  const dates = getShiftDatesInMonth(key);
  const snap = await db.collection("submissions").where("month", "==", key).get();
  
  // Mappa inkomna svar per namn (om en person svarat flera gånger gäller det senaste)
  const submissionsMap = {};
  snap.forEach(doc => {
    const data = doc.data();
    submissionsMap[data.name] = data;
  });

  // Skapa tillgänglighetsprofil för alla aktiva barlagare
  const people = currentAlla.map(name => {
    const sub = submissionsMap[name];
    let targetShifts = 1; // Standard om inget svar skickats in: önskar 1 pass
    let unavailable = [];

    if (sub) {
      if (sub.shifts === "frikort") targetShifts = 0;
      else if (sub.shifts === "2") targetShifts = 2;
      else if (sub.shifts === "3+") targetShifts = 3;
      else targetShifts = 1;

      unavailable = sub.unavailable || [];
    }

    return {
      name,
      isSA: currentSA.includes(name),
      targetShifts,
      assignedShifts: 0,
      unavailable
    };
  });

  // Sorteringsfunktion för att prioritera rätt personer
  function compareCandidates(a, b) {
    // 1. Kolla om någon ännu inte har nått sitt önskade antal pass
    const aNeedsMore = a.assignedShifts < a.targetShifts;
    const bNeedsMore = b.assignedShifts < b.targetShifts;

    if (aNeedsMore && !bNeedsMore) return -1; // a går före b
    if (!aNeedsMore && bNeedsMore) return 1;  // b går före a

    // 2. Om båda behöver mer (eller båda redan fått sitt önskemål),
    // prioritera den som har lägst tilldelat i förhållande till sitt önskemål
    const aRatio = a.targetShifts > 0 ? (a.assignedShifts / a.targetShifts) : 1;
    const bRatio = b.targetShifts > 0 ? (b.assignedShifts / b.targetShifts) : 1;

    if (aRatio !== bRatio) {
      return aRatio - bRatio;
    }

    // 3. Om kvoten är lika, välj den med absolut färst tilldelade pass
    if (a.assignedShifts !== b.assignedShifts) {
      return a.assignedShifts - b.assignedShifts;
    }

    // 4. Slumpa vid helt lika villkor
    return Math.random() - 0.5;
  }

  const days = [];

  for (const dt of dates) {
    const isOnsdag = dt.weekday === "onsdag";
    const barCount = isOnsdag ? 2 : 3;
    const time = isOnsdag ? "17:30-22:00" : "20:30-02:00";

    // ----------------------------------------------------
    // 1. Välj Serveringsansvarig (SA)
    // ----------------------------------------------------
    let availableSA = people.filter(p => p.isSA && !p.unavailable.includes(dt.iso) && p.targetShifts > 0);
    availableSA.sort(compareCandidates);

    let chosenSA = availableSA[0];
    let saName = "Ej tillsatt";

    if (chosenSA) {
      saName = chosenSA.name;
      chosenSA.assignedShifts++;
    }

    // ----------------------------------------------------
    // 2. Välj Barlagare
    // ----------------------------------------------------
    let availableBar = people.filter(p => p.name !== saName && !p.unavailable.includes(dt.iso) && p.targetShifts > 0);
    availableBar.sort(compareCandidates);

    const barlagareNames = [];
    for (let i = 0; i < barCount; i++) {
      if (availableBar[i]) {
        barlagareNames.push(availableBar[i].name);
        availableBar[i].assignedShifts++;
        // Sortera om inför nästa plats i samma barpass så att fördelningen vägs direkt
        availableBar = availableBar.filter(p => !barlagareNames.includes(p.name));
        availableBar.sort(compareCandidates);
      } else {
        barlagareNames.push("Ej tillsatt");
      }
    }

    days.push({
      date: dt.iso,
      event: "",
      time: time,
      servering: saName,
      barlagare: barlagareNames
    });
  }

  // Spara det skapade schemat i Firestore
  await db.collection("schedules").doc(key).set({
    month: key,
    days: days,
    publishedAt: firebase.firestore.FieldValue.serverTimestamp(),
    autoGenerated: true
  });
}

/* ============================================================
   7. FLIK 3: BARLAGET LISTA MED HANDLER FÖR + OCH -
   ============================================================ */
async function loadTeamData() {
  try {
    const docSA = await db.collection("settings").doc("serveringsansvariga").get();
    if (docSA.exists && docSA.data().list) {
      currentSA = docSA.data().list;
    }

    const docAlla = await db.collection("settings").doc("alla_barlagare").get();
    if (docAlla.exists && docAlla.data().list) {
      currentAlla = docAlla.data().list;
    }
  } catch (err) {
    console.error("Kunde inte hämta teamdata från Firestore, använder standardlistor:", err);
  }
}

async function saveTeamData() {
  try {
    await db.collection("settings").doc("serveringsansvariga").set({ list: currentSA });
    await db.collection("settings").doc("alla_barlagare").set({ list: currentAlla });
  } catch (err) {
    console.error("Kunde inte spara teamdata:", err);
  }
}

function updateFormNameSelect() {
  const nameSelect = document.getElementById("nameSelect");
  if (!nameSelect) return;

  const currentSelection = nameSelect.value;
  nameSelect.innerHTML = '<option value="" disabled selected>Välj ditt namn...</option>';

  [...currentAlla].sort((a, b) => a.localeCompare(b, 'sv')).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    if (name === currentSelection) opt.selected = true;
    nameSelect.appendChild(opt);
  });
}

async function renderBarlagetLists() {
  const saUl = document.getElementById("saList");
  const barUl = document.getElementById("barList");

  if (!saUl || !barUl) return;

  saUl.innerHTML = "";
  barUl.innerHTML = "";

  currentSA.sort((a, b) => a.localeCompare(b, 'sv'));
  currentAlla.sort((a, b) => a.localeCompare(b, 'sv'));

  // Rendera Serveringsansvariga
  currentSA.forEach(name => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${name}</span>
      <button class="btn-remove" title="Ta bort från serveringsansvariga">–</button>
    `;
    li.querySelector(".btn-remove").addEventListener("click", async () => {
      if (confirm(`Vill du ta bort ${name} från Serveringsansvariga?`)) {
        currentSA = currentSA.filter(n => n !== name);
        await saveTeamData();
        renderBarlagetLists();
      }
    });
    saUl.appendChild(li);
  });

  // Rendera Hela Barlaget
  currentAlla.forEach(name => {
    const isSA = currentSA.includes(name);
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${name}</span>
      <div class="member-actions">
        ${isSA ? '<span class="badge">SA</span>' : ''}
        <button class="btn-remove" title="Ta bort från barlaget">–</button>
      </div>
    `;
    li.querySelector(".btn-remove").addEventListener("click", async () => {
      if (confirm(`Vill du ta bort ${name} från Hela Barlaget?`)) {
        currentAlla = currentAlla.filter(n => n !== name);
        currentSA = currentSA.filter(n => n !== name);
        await saveTeamData();
        renderBarlagetLists();
      }
    });
    barUl.appendChild(li);
  });

  updateFormNameSelect();
}

async function initBarlagetTab() {
  await loadTeamData();
  await renderBarlagetLists();

  const addSaBtn = document.getElementById("addSaBtn");
  if (addSaBtn) {
    addSaBtn.onclick = async () => {
      const name = prompt("Ange namn på ny Serveringsansvarig:");
      if (name && name.trim()) {
        const cleanName = name.trim();
        if (!currentSA.includes(cleanName)) {
          currentSA.push(cleanName);
        }
        if (!currentAlla.includes(cleanName)) {
          currentAlla.push(cleanName);
        }
        await saveTeamData();
        renderBarlagetLists();
      }
    };
  }

  const addBarBtn = document.getElementById("addBarBtn");
  if (addBarBtn) {
    addBarBtn.onclick = async () => {
      const name = prompt("Ange namn på ny Barlagare:");
      if (name && name.trim()) {
        const cleanName = name.trim();
        if (!currentAlla.includes(cleanName)) {
          currentAlla.push(cleanName);
          await saveTeamData();
          renderBarlagetLists();
        }
      }
    };
  }
}

/* ============================================================
   8. FLIK 4: ADMIN
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

  await buildScheduleEditor(key);
  document.getElementById("builderCard").style.display = "block";
});

document.getElementById("autoGenerateBtn").addEventListener("click", async () => {
  if (confirm("Vill du slumpa schemat för vald månad automatiskt? Eventuella ändringar du skrivit in skrivs över.")) {
    await generateAutoSchedule(currentBuilderMonth);
    await buildScheduleEditor(currentBuilderMonth);
    alert("Nytt schema har slumpats med hänsyn till 'Kan EJ'!");
  }
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
    const defaultTime = isOnsdag ? "17:30-22:00" : "20:30-02:00";
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
        <input type="text" class="event-input" placeholder="Ev. event (t.ex. Quiz)" value="${ex ? ex.event || "" : ""}" />
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
   9. INIT
   ============================================================ */
async function initApp() {
  await initBarlagetTab();
  initForm();
  initScheduleSelect();
}

initApp();