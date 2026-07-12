"""
Standalone Fuel Efficiency App
Run: uvicorn fuel_app:app --reload --port 8001
Open: http://127.0.0.1:8001
"""

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
import pandas as pd

app = FastAPI(title="Fuel Efficiency")

def _build_df():
    fuel = pd.read_csv("data/fuel_logs.csv")
    trips = pd.read_csv("data/trips.csv")
    vehicles = pd.read_csv("data/vehicles.csv")[["reg_no", "name_model", "type"]]
    total_fuel = fuel.groupby("reg_no")["liters"].sum().reset_index(name="total_liters")
    total_dist = trips.groupby("reg_no")["planned_distance_km"].sum().reset_index(name="total_km")
    df = total_dist.merge(total_fuel, on="reg_no").merge(vehicles, on="reg_no")
    df["fuel_efficiency_kmpl"] = (df["total_km"] / df["total_liters"]).round(2)
    return df.sort_values("fuel_efficiency_kmpl", ascending=False)


@app.get("/api/vehicles")
def get_vehicles():
    df = _build_df()
    return df[["reg_no", "name_model"]].to_dict(orient="records")


@app.get("/api/fuel-efficiency/{reg_no}")
def get_fuel_efficiency(reg_no: str):
    df = _build_df()
    row = df[df["reg_no"] == reg_no]
    if row.empty:
        return {"error": "Vehicle not found"}
    r = row.iloc[0]
    return {
        "reg_no": str(r["reg_no"]),
        "name_model": str(r["name_model"]),
        "type": str(r["type"]),
        "total_km": int(r["total_km"]),
        "total_liters": round(float(r["total_liters"]), 2),
        "fuel_efficiency_kmpl": float(r["fuel_efficiency_kmpl"]),
    }


HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Fuel Efficiency</title>
<style>
  body { font-family: sans-serif; background: #0c1116; color: #dce6ee; display: flex; flex-direction: column; align-items: center; padding: 40px; }
  h1 { color: #34d1c8; margin-bottom: 24px; }
  .controls { display: flex; gap: 10px; align-items: center; }
  select { background: #162030; color: #dce6ee; border: 1px solid #223140; padding: 8px 12px; border-radius: 6px; font-size: 15px; width: 320px; }
  button { background: #34d1c8; color: #0c1116; border: none; padding: 9px 22px; border-radius: 6px; font-size: 15px; font-weight: 700; cursor: pointer; }
  button:hover { background: #22b0a8; }
  #result { margin-top: 32px; background: #162030; border: 1px solid #223140; border-radius: 10px; padding: 24px; width: 320px; display: none; }
  #error { margin-top: 16px; color: #ff5d5d; display: none; }
  .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #223140; }
  .label { color: #7d92a3; font-size: 13px; }
  .value { font-weight: 600; color: #34d1c8; }
  .big { font-size: 28px; color: #ffb020; }
</style>
</head>
<body>
<h1>&#9981; Fuel Efficiency Calculator</h1>
<div class="controls">
  <select id="vehicleSelect"><option value="">-- Select Vehicle --</option></select>
  <button onclick="calculate()">Calculate</button>
</div>
<div id="error">No data found for selected vehicle.</div>
<div id="result">
  <div class="row"><span class="label">Reg No</span><span class="value" id="rReg"></span></div>
  <div class="row"><span class="label">Vehicle</span><span class="value" id="rModel"></span></div>
  <div class="row"><span class="label">Type</span><span class="value" id="rType"></span></div>
  <div class="row"><span class="label">Total KM</span><span class="value" id="rKm"></span></div>
  <div class="row"><span class="label">Total Liters</span><span class="value" id="rLiters"></span></div>
  <div class="row"><span class="label">Efficiency</span><span class="value big" id="rEff"></span></div>
</div>
<script>
  async function loadVehicles() {
    const res = await fetch("/api/vehicles");
    const data = await res.json();
    const sel = document.getElementById("vehicleSelect");
    data.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.reg_no;
      opt.textContent = v.reg_no + " — " + v.name_model;
      sel.appendChild(opt);
    });
  }

  async function calculate() {
    const reg = document.getElementById("vehicleSelect").value;
    const result = document.getElementById("result");
    const error = document.getElementById("error");
    result.style.display = "none";
    error.style.display = "none";
    if (!reg) return;
    const res = await fetch("/api/fuel-efficiency/" + encodeURIComponent(reg));
    const d = await res.json();
    if (d.error) { error.style.display = "block"; return; }
    document.getElementById("rReg").textContent = d.reg_no;
    document.getElementById("rModel").textContent = d.name_model;
    document.getElementById("rType").textContent = d.type;
    document.getElementById("rKm").textContent = d.total_km + " km";
    document.getElementById("rLiters").textContent = d.total_liters + " L";
    document.getElementById("rEff").textContent = d.fuel_efficiency_kmpl + " km/L";
    result.style.display = "block";
  }

  loadVehicles();
</script>
</body>
</html>"""


@app.get("/", response_class=HTMLResponse)
def index():
    return HTML
