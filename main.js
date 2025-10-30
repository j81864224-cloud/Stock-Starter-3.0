// main.js
// ✅ Paste your Finnhub API key below (free from finnhub.io)
const API_KEY = "YOUR_FINNHUB_API_KEY";

const API_BASE = "https://finnhub.io/api/v1";
const tbody = document.getElementById("stockBody");
const searchEl = document.getElementById("search");
const sectorFilter = document.getElementById("sectorFilter");
const capFilter = document.getElementById("capFilter");
const priceFilter = document.getElementById("priceFilter");
const refreshBtn = document.getElementById("refreshBtn");

let stocks = [];
const watchlist = ["AAPL","MSFT","GOOGL","AMZN","NVDA","TSLA","META","JPM","XOM","V","WMT","PG","MA","UNH","HD","DIS","PEP","KO","CSCO","ADBE"];

function fmtCap(n){
  if(!n) return "";
  if(n >= 1e12) return (n/1e12).toFixed(2) + "T";
  if(n >= 1e9) return (n/1e9).toFixed(2) + "B";
  if(n >= 1e6) return (n/1e6).toFixed(2) + "M";
  return n.toString();
}

async function getQuote(symbol){
  const res = await fetch(`${API_BASE}/quote?symbol=${symbol}&token=${API_KEY}`);
  return res.json();
}

async function getProfile(symbol){
  const res = await fetch(`${API_BASE}/stock/profile2?symbol=${symbol}&token=${API_KEY}`);
  return res.json();
}

async function refresh(){
  tbody.innerHTML = "<tr><td colspan=6>Loading live data...</td></tr>";
  const newData = [];
  for (const sym of watchlist){
    const [q, p] = await Promise.all([getQuote(sym), getProfile(sym)]);
    newData.push({
      symbol: sym,
      name: p.name || sym,
      price: q.c || 0,
      change: q.dp || 0,
      cap: p.marketCapitalization * 1e6 || 0,
      sector: p.finnhubIndustry || "Unknown"
    });
  }
  stocks = newData;
  populateSectors();
  render();
}

function populateSectors(){
  const sectors = [...new Set(stocks.map(s=>s.sector))];
  sectorFilter.innerHTML = '<option value="">All Sectors</option>' + sectors.map(s=>`<option value="${s}">${s}</option>`).join("");
}

function render(){
  const q = searchEl.value.toLowerCase();
  let data = stocks.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  if(sectorFilter.value) data = data.filter(s=>s.sector===sectorFilter.value);
  if(capFilter.value){
    data = data.filter(s=>{
      const c = s.cap;
      if(capFilter.value==='mega') return c>200e9;
      if(capFilter.value==='large') return c>=10e9&&c<200e9;
      if(capFilter.value==='mid') return c>=2e9&&c<10e9;
      if(capFilter.value==='small') return c<2e9;
      return true;
    });
  }
  if(priceFilter.value){
    data = data.filter(s=>{
      const p = s.price;
      if(priceFilter.value==='p1') return p<20;
      if(priceFilter.value==='p2') return p>=20&&p<=100;
      if(priceFilter.value==='p3') return p>=100&&p<=500;
      if(priceFilter.value==='p4') return p>500;
      return true;
    });
  }
  tbody.innerHTML = data.map(s=>`
    <tr>
      <td><b>${s.symbol}</b></td>
      <td>${s.name}</td>
      <td>$${s.price.toFixed(2)}</td>
      <td class="${s.change>=0?'green':'red'}">${s.change.toFixed(2)}%</td>
      <td>${fmtCap(s.cap)}</td>
      <td>${s.sector}</td>
    </tr>`).join("");
}

refreshBtn.addEventListener("click", refresh);
searchEl.addEventListener("input", render);
sectorFilter.addEventListener("change", render);
capFilter.addEventListener("change", render);
priceFilter.addEventListener("change", render);

refresh();
