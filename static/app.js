const $ = (id) => document.getElementById(id);
const money = (n) => "₹" + n.toLocaleString("en-IN");

let catalog = {};                                   // id -> product (cache)
let cart = JSON.parse(localStorage.getItem("cart") || "{}");   // id -> qty
let category = "All";

function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }

// ---------- Products ----------
async function loadCategories() {
  const cats = await (await fetch("/api/categories")).json();
  $("chips").innerHTML = "";
  for (const c of cats) {
    const b = document.createElement("button");
    b.className = "chip" + (c === category ? " active" : "");
    b.textContent = c;
    b.onclick = () => { category = c; loadCategories(); loadProducts(); };
    $("chips").appendChild(b);
  }
}

async function loadProducts() {
  const params = new URLSearchParams({
    q: $("search").value,
    category: category,
    sort: $("sort").value,
  });
  const products = await (await fetch("/api/products?" + params)).json();
  products.forEach((p) => (catalog[p.id] = p));

  $("resultTitle").textContent = `${category} (${products.length})`;
  $("grid").innerHTML = products.map((p) => `
    <article class="card">
      <span class="off">${p.discount}% off</span>
      <div class="pic">${p.emoji}</div>
      <div class="name">${p.name}</div>
      <div class="rating">★ ${p.rating}</div>
      <div class="price">${money(p.price)}<span class="mrp">${money(p.mrp)}</span></div>
      <button class="primary" onclick="addToCart(${p.id})">Add to Cart</button>
    </article>`).join("") || "<p>No products found.</p>";
  renderCart();
}

// ---------- Cart ----------
function addToCart(id) {
  cart[id] = Math.min((cart[id] || 0) + 1, 10);
  saveCart(); renderCart();
  $("drawer").classList.add("open");
}

function changeQty(id, delta) {
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart(); renderCart();
}

function renderCart() {
  let total = 0, count = 0;
  const rows = [];
  for (const [id, qty] of Object.entries(cart)) {
    const p = catalog[id];
    if (!p) continue;
    total += p.price * qty;
    count += qty;
    rows.push(`
      <div class="cart-row">
        <span class="emoji">${p.emoji}</span>
        <div class="info">${p.name}<br><strong>${money(p.price)}</strong></div>
        <div class="qty">
          <button onclick="changeQty(${id}, -1)">−</button>
          <span>${qty}</span>
          <button onclick="changeQty(${id}, 1)">+</button>
        </div>
      </div>`);
  }
  $("cartItems").innerHTML = rows.join("") || "<p>Your cart is empty.</p>";
  $("cartTotal").textContent = money(total);
  $("cartCount").textContent = count;
}

async function checkout() {
  const msg = $("message");
  const items = Object.entries(cart).map(([id, qty]) => ({ id: Number(id), qty }));
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer: $("customer").value, items }),
  });
  const data = await res.json();
  if (res.ok) {
    cart = {}; saveCart(); renderCart();
    msg.className = "message ok";
    msg.textContent = `Order #${data.id} placed! Total ${money(data.total)}`;
  } else {
    msg.className = "message err";
    msg.textContent = data.error;
  }
}

// ---------- Wire up events ----------
let timer;
$("search").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(loadProducts, 250); });
$("sort").addEventListener("change", loadProducts);
$("cartBtn").onclick = () => $("drawer").classList.add("open");
$("closeCart").onclick = () => $("drawer").classList.remove("open");
$("checkout").onclick = checkout;

loadCategories();
loadProducts();
