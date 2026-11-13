const $ = (id) => document.getElementById(id);
const money = (n) => "₹" + n.toLocaleString("en-IN");

async function refresh() {
  const s = await (await fetch("/api/stats")).json();
  $("kOrders").textContent = s.orders;
  $("kRevenue").textContent = money(s.revenue);
  $("kUnits").textContent = s.units;

  const max = Math.max(1, ...s.top.map((t) => t.qty));
  $("top").innerHTML = "";
  for (const t of s.top) {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.textContent = `${t.name} — ${t.qty} sold`;      // textContent: safe
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.width = (t.qty / max) * 100 + "%";
    row.appendChild(bar);
    $("top").appendChild(row);
  }
  if (!s.top.length) $("top").textContent = "No sales yet.";

  $("recent").innerHTML = "";
  for (const o of s.recent) {
    const tr = document.createElement("tr");
    for (const text of ["#" + o.id, o.customer, money(o.total)]) {
      const td = document.createElement("td");
      td.textContent = text;                            // customer name is user input → never innerHTML
      tr.appendChild(td);
    }
    $("recent").appendChild(tr);
  }
}

refresh();
setInterval(refresh, 5000);
