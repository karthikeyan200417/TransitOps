const state = { roles: {}, drivers: [], role: null, view: null, driverId: null, charts: {} };

const $ = (id) => document.getElementById(id);

function tick() {
  $("clock").textContent = new Date().toLocaleString("en-IN", { hour12: false });
}
tick();
setInterval(tick, 1000);

function destroyChart(key) {
  if (state.charts[key]) {
    state.charts[key].destroy();
    delete state.charts[key];
  }
}

function makeCanvas(container, id) {
  container.innerHTML = `<div style="width:100%;height:280px;position:relative;"><canvas id="${id}"></canvas></div>`;
  return $(id);
}

function drawChart(container, key, cfg) {
  destroyChart(key);
  const canvas = makeCanvas(container, key);
  const palette = ["#34d1c8", "#ffb020", "#7d92a3", "#4ade80", "#ff5d5d", "#8b8ff0", "#e879f9"];
  state.charts[key] = new Chart(canvas, {
    type: cfg.type,
    data: {
      labels: cfg.labels,
      datasets: [{
        label: cfg.title,
        data: cfg.data,
        backgroundColor: cfg.type === "doughnut" ? palette : "rgba(52,209,200,0.55)",
        borderColor: cfg.type === "doughnut" ? "#0c1116" : "#34d1c8",
        borderWidth: cfg.type === "doughnut" ? 2 : 1,
        borderRadius: cfg.type === "bar" ? 4 : 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: cfg.type === "doughnut", labels: { color: "#dce6ee", font: { family: "IBM Plex Mono", size: 10 } } },
        title: { display: false },
      },
      scales: cfg.type === "bar" ? {
        x: { ticks: { color: "#7d92a3", font: { size: 10 } }, grid: { color: "#223140" } },
        y: { ticks: { color: "#7d92a3", font: { size: 10 } }, grid: { color: "#223140" }, beginAtZero: true },
      } : {},
    },
  });
}

function tagFor(val) {
  const v = String(val).toLowerCase();
  if (["available", "closed", "completed", "safe", "low", "ok"].includes(v)) return "ok";
  if (["on trip", "dispatched", "warning", "medium", "draft"].includes(v)) return "info";
  if (["in shop", "critical", "high", "cancelled"].includes(v)) return "bad";
  if (["retired", "suspended", "off duty"].includes(v)) return "warn";
  return null;
}

function renderTable(container, rows, title) {
  if (!rows || rows.length === 0) {
    container.innerHTML = `<div class="empty-note">No records</div>`;
    return;
  }
  const cols = Object.keys(rows[0]);
  let html = "<table><thead><tr>" + cols.map(c => `<th>${c.replace(/_/g, " ")}</th>`).join("") + "</tr></thead><tbody>";
  for (const row of rows) {
    html += "<tr>" + cols.map(c => {
      let v = row[c];
      if (v === null || v === undefined) return "<td>&mdash;</td>";
      if (typeof v === "number") v = Number.isInteger(v) ? v : v.toFixed(2);
      if (typeof v === "boolean") {
        return `<td><span class="tag ${v ? 'bad' : 'ok'}">${v ? 'YES' : 'no'}</span></td>`;
      }
      const tag = tagFor(v);
      return tag ? `<td><span class="tag ${tag}">${v}</span></td>` : `<td>${v}</td>`;
    }).join("") + "</tr>";
  }
  html += "</tbody></table>";
  container.innerHTML = html;
}

const KPI_LABELS = {
  total_vehicles: "Total Vehicles",
  active_vehicles: "Active Vehicles",
  available_vehicles: "Available",
  vehicles_in_maintenance: "In Maintenance",
  active_trips: "Active Trips",
  pending_trips: "Pending Trips",
  drivers_on_duty: "Drivers On Duty",
  fleet_utilization_pct: "Fleet Utilization",
  total_operational_cost: "Total Op. Cost (₹)",
  driver_name: "Driver",
  driver_status: "Recorded Status",
  assigned_vehicle: "Assigned Vehicle",
  status_out_of_sync: "Status In Sync?",
  my_total_trips: "My Total Trips",
  my_completed_trips: "My Completed",
  my_active_trips: "My Active",
  my_pending_trips: "My Pending",
  my_cancelled_trips: "My Cancelled",
  safety_score: "Safety Score",
  trip_completion_pct: "Completion %",
  days_to_license_expiry: "License Expiry (days)",
};

function renderKPIs(kpis) {
  const alertKeys = new Set(["vehicles_in_maintenance", "pending_trips", "my_cancelled_trips"]);
  let html = "";
  for (const [k, v] of Object.entries(kpis)) {
    if (!(k in KPI_LABELS)) continue;
    let display = v;
    let isAlert = alertKeys.has(k) && v > 0;
    if (k === "fleet_utilization_pct") display = `${v}%`;
    if (k === "total_operational_cost") display = `₹${Number(v).toLocaleString("en-IN")}`;
    if (k === "trip_completion_pct") display = `${v}%`;
    if (k === "status_out_of_sync") {
      display = v ? "⚠ Mismatch" : "✓ Yes";
      isAlert = v;
    }
    html += `<div class="kpi-card ${isAlert ? 'alert' : ''}">
      <div class="kpi-label">${KPI_LABELS[k]}</div>
      <div class="kpi-value ${String(display).length > 6 ? 'small' : ''}">${display}</div>
    </div>`;
  }
  $("kpiRow").innerHTML = html;
}

function setPanelTitle(id, text) { $(id).textContent = text; }
function showSecondRow(show) { $("secondRow").style.display = show ? "grid" : "none"; }

async function loadRoles() {
  const res = await fetch("/api/roles");
  state.roles = await res.json();
  const roleSelect = $("roleSelect");
  roleSelect.innerHTML = Object.entries(state.roles)
    .map(([id, r]) => `<option value="${id}">${r.label}</option>`).join("");
  state.role = Object.keys(state.roles)[0];
  roleSelect.value = state.role;
  populateViews();
}

async function loadDrivers() {
  if (state.drivers.length) return;
  const res = await fetch("/api/drivers");
  state.drivers = await res.json();
}

function populateViews() {
  const views = state.roles[state.role].views;
  const viewSelect = $("viewSelect");
  viewSelect.innerHTML = views.map(v => `<option value="${v.id}">${v.label}</option>`).join("");
  state.view = views[0].id;
  viewSelect.value = state.view;
}

async function syncDriverSelector() {
  const block = $("driverSelectBlock");
  if (state.role !== "driver") {
    block.style.display = "none";
    state.driverId = null;
    return;
  }
  await loadDrivers();
  block.style.display = "flex";
  const sel = $("driverSelect");
  sel.innerHTML = state.drivers.map(d => `<option value="${d.license_no}">${d.name} (${d.license_no})</option>`).join("");
  if (!state.driverId) state.driverId = state.drivers[0]?.license_no || null;
  sel.value = state.driverId;
}

async function loadView() {
  destroyChart("A"); destroyChart("B");
  $("panelLeftBody").innerHTML = `<div class="empty-note">Loading&hellip;</div>`;
  $("panelRightBody").innerHTML = "";
  $("panel2Body").innerHTML = "";
  $("panel3Body").innerHTML = "";
  showSecondRow(false);

  let url = `/api/view/${state.view}?role=${state.role}`;
  if (state.role === "driver" && state.driverId) url += `&driver_id=${encodeURIComponent(state.driverId)}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    $("panelLeftBody").innerHTML = `<div class="empty-note">${err.detail || "Access denied for this role/view combination."}</div>`;
    $("kpiRow").innerHTML = "";
    return;
  }
  const data = await res.json();
  renderKPIs(data.kpis);

  const view = state.view;
  const mine = state.role === "driver";

  if (view === "overview") {
    setPanelTitle("panelLeftTitle", data.chart.title);
    drawChart($("panelLeftBody"), "A", data.chart);
    if (data.chart2) {
      setPanelTitle("panelRightTitle", data.chart2.title);
      drawChart($("panelRightBody"), "B", data.chart2);
    } else if (data.table) {
      setPanelTitle("panelRightTitle", "My Recent Trips");
      renderTable($("panelRightBody"), data.table);
    }
    return;
  }

  if (view === "predictions") {
    setPanelTitle("panelLeftTitle", "Maintenance Due Soon");
    renderTable($("panelLeftBody"), data.maintenance_due);
    setPanelTitle("panelRightTitle", "Fuel Anomalies");
    renderTable($("panelRightBody"), data.fuel_anomalies);
    setPanelTitle("panel3Title", "Driver License Risk");
    renderTable($("panel3Body"), data.license_risk);
    $("panel2Title").textContent = "Summary";
    $("panel2Body").innerHTML = `<div class="empty-note">
      ${data.maintenance_due.length} vehicle(s) due for service &middot;
      ${data.fuel_anomalies.length} fuel anomaly flag(s) &middot;
      ${data.license_risk.length} license(s) at risk
    </div>`;
    showSecondRow(true);
    return;
  }

  if (view === "maintenance") {
    setPanelTitle("panelLeftTitle", "Maintenance Records");
    renderTable($("panelLeftBody"), data.table);
    setPanelTitle("panelRightTitle", data.chart.title);
    drawChart($("panelRightBody"), "A", data.chart);
    setPanelTitle("panel3Title", "Due Soon");
    renderTable($("panel3Body"), data.due_soon);
    $("panel2Title").textContent = "Notes";
    $("panel2Body").innerHTML = `<div class="empty-note">Vehicles flagged when &gt;180 days since last closed service, or &gt;8,000 km driven since then.</div>`;
    showSecondRow(true);
    return;
  }

  // generic: table + chart, optional chart2
  setPanelTitle("panelLeftTitle", mine ? "My Records" : "Records");
  renderTable($("panelLeftBody"), data.table);
  if (data.chart) {
    setPanelTitle("panelRightTitle", data.chart.title);
    drawChart($("panelRightBody"), "A", data.chart);
  }
  if (data.chart2) {
    setPanelTitle("panel2Title", data.chart2.title);
    drawChart($("panel2Body"), "B", data.chart2);
    showSecondRow(true);
  }
}

$("roleSelect").addEventListener("change", async (e) => {
  state.role = e.target.value;
  populateViews();
  await syncDriverSelector();
  loadView();
});
$("viewSelect").addEventListener("change", (e) => {
  state.view = e.target.value;
  loadView();
});
$("driverSelect").addEventListener("change", (e) => {
  state.driverId = e.target.value;
  loadView();
});

(async function init() {
  await loadRoles();
  await syncDriverSelector();
  await loadView();
})();
