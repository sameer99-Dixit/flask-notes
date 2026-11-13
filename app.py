from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# ---- "Database" (in memory; resets on restart) ----
PRODUCTS = [
    {"id": 1,  "name": "Wireless Earbuds",     "category": "Electronics", "price": 1499, "mrp": 2999, "rating": 4.3, "emoji": "🎧"},
    {"id": 2,  "name": "Smart Watch",          "category": "Electronics", "price": 2999, "mrp": 5999, "rating": 4.1, "emoji": "⌚"},
    {"id": 3,  "name": "Bluetooth Speaker",    "category": "Electronics", "price": 1199, "mrp": 2499, "rating": 4.4, "emoji": "🔊"},
    {"id": 4,  "name": "Running Shoes",        "category": "Fashion",     "price": 1799, "mrp": 3499, "rating": 4.2, "emoji": "👟"},
    {"id": 5,  "name": "Denim Jacket",         "category": "Fashion",     "price": 1599, "mrp": 2999, "rating": 4.0, "emoji": "🧥"},
    {"id": 6,  "name": "Sunglasses",           "category": "Fashion",     "price": 699,  "mrp": 1499, "rating": 3.9, "emoji": "🕶️"},
    {"id": 7,  "name": "Backpack",             "category": "Fashion",     "price": 999,  "mrp": 1999, "rating": 4.5, "emoji": "🎒"},
    {"id": 8,  "name": "Coffee Maker",         "category": "Home",        "price": 2499, "mrp": 3999, "rating": 4.2, "emoji": "☕"},
    {"id": 9,  "name": "Desk Lamp",            "category": "Home",        "price": 549,  "mrp": 999,  "rating": 4.3, "emoji": "💡"},
    {"id": 10, "name": "Yoga Mat",             "category": "Sports",      "price": 599,  "mrp": 1299, "rating": 4.6, "emoji": "🧘"},
    {"id": 11, "name": "Cricket Bat",          "category": "Sports",      "price": 1899, "mrp": 2999, "rating": 4.4, "emoji": "🏏"},
    {"id": 12, "name": "Python Programming Book", "category": "Books",    "price": 449,  "mrp": 799,  "rating": 4.7, "emoji": "📘"},
]
BY_ID = {p["id"]: p for p in PRODUCTS}
orders = []


def with_discount(p):
    off = round((p["mrp"] - p["price"]) * 100 / p["mrp"])
    return {**p, "discount": off}


# ---- Pages ----
@app.route("/")
def storefront():
    return render_template("index.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


# ---- API ----
@app.get("/api/health")
def health():
    return jsonify(status="ok")


@app.get("/api/categories")
def categories():
    return jsonify(["All"] + sorted({p["category"] for p in PRODUCTS}))


@app.get("/api/products")
def list_products():
    q = request.args.get("q", "").strip().lower()
    category = request.args.get("category", "All")
    sort = request.args.get("sort", "")

    result = [p for p in PRODUCTS
              if (category == "All" or p["category"] == category)
              and q in p["name"].lower()]

    if sort == "price_asc":
        result.sort(key=lambda p: p["price"])
    elif sort == "price_desc":
        result.sort(key=lambda p: -p["price"])
    elif sort == "rating":
        result.sort(key=lambda p: -p["rating"])

    return jsonify([with_discount(p) for p in result])


@app.post("/api/orders")
def place_order():
    data = request.get_json(silent=True) or {}
    customer = (data.get("customer") or "").strip()
    if not customer:
        return jsonify(error="customer name required"), 400

    items, total = [], 0
    for row in data.get("items", []):
        pid = row.get("id")
        p = BY_ID.get(pid) if isinstance(pid, int) else None
        try:
            qty = int(row.get("qty", 0))
        except (TypeError, ValueError):
            qty = 0
        if p and 0 < qty <= 10:
            # price comes from the SERVER catalog, never from the browser
            items.append({"id": p["id"], "name": p["name"], "qty": qty, "price": p["price"]})
            total += p["price"] * qty

    if not items:
        return jsonify(error="cart is empty"), 400

    order = {"id": 1001 + len(orders), "customer": customer, "items": items, "total": total}
    orders.append(order)
    return jsonify(order), 201


@app.get("/api/stats")
def stats():
    units = {}
    for o in orders:
        for i in o["items"]:
            units[i["name"]] = units.get(i["name"], 0) + i["qty"]
    top = sorted(units.items(), key=lambda kv: -kv[1])[:5]
    return jsonify(
        orders=len(orders),
        revenue=sum(o["total"] for o in orders),
        units=sum(units.values()),
        top=[{"name": n, "qty": q} for n, q in top],
        recent=orders[-5:][::-1],
    )


if __name__ == "__main__":
    app.run(debug=True)
