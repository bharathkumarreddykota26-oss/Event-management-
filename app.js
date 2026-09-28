let products = [];
let cart = [];
let currentFilter = "all";
let authMode = "login";

const token = () => localStorage.getItem("eventToken");
const user = () => JSON.parse(localStorage.getItem("eventUser") || "null");

async function api(url, options = {}) {
  const headers = {"Content-Type":"application/json", ...(options.headers || {})};
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const res = await fetch(url, {...options, headers});
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function loadProducts() {
  products = await api("/api/products");
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById("productsGrid");
  const visible = currentFilter === "all" ? products : products.filter(p => p.category === currentFilter);
  grid.innerHTML = visible.map(p => `
    <article class="card">
      <div class="emoji">${p.emoji}</div>
      <h3>${p.name}</h3>
      <p class="muted">${categoryLabel(p.category)}</p>
      <div class="price">₹${p.price.toLocaleString("en-IN")} / ${p.unit}</div>
      <button class="primary" onclick="addToCart(${p.id})">Add to order</button>
    </article>
  `).join("");
}


function categoryLabel(category) {
  const labels = {
    material: "Event material",
    marriage: "Marriage & wedding",
    food: "Food & beverage"
  };
  return labels[category] || "Event supply";
}

function addToCart(id) {
  const item = cart.find(x => x.productId === id);
  if (item) item.quantity++;
  else cart.push({productId:id, quantity:1});
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find(x => x.productId === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) cart = cart.filter(x => x.productId !== id);
  renderCart();
}

function renderCart() {
  const box = document.getElementById("cart");
  if (!cart.length) {
    box.innerHTML = '<p class="muted">No items yet.</p>';
    document.getElementById("total").textContent = "0";
    return;
  }
  let total = 0;
  box.innerHTML = cart.map(item => {
    const p = products.find(x => x.id === item.productId);
    const subtotal = p.price * item.quantity;
    total += subtotal;
    return `<div class="cart-row">
      <div><strong>${p.name}</strong><br><span class="muted">₹${p.price} × ${item.quantity}</span></div>
      <div class="qty"><button onclick="changeQty(${p.id},-1)">−</button><span>${item.quantity}</span><button onclick="changeQty(${p.id},1)">+</button></div>
    </div>`;
  }).join("");
  document.getElementById("total").textContent = total.toLocaleString("en-IN");
}

function openAuth() {
  document.getElementById("authModal").classList.remove("hidden");
}
function closeAuth() {
  document.getElementById("authModal").classList.add("hidden");
}
function setAuthMode(mode) {
  authMode = mode;
  document.getElementById("authName").classList.toggle("hidden", mode === "login");
  document.getElementById("authSubmit").textContent = mode === "login" ? "Login" : "Create account";
  document.getElementById("loginTab").classList.toggle("active", mode === "login");
  document.getElementById("registerTab").classList.toggle("active", mode === "register");
  document.getElementById("authMessage").textContent = "";
}

async function submitAuth(e) {
  e.preventDefault();
  const message = document.getElementById("authMessage");
  try {
    const body = {
      name: document.getElementById("authName").value,
      email: document.getElementById("authEmail").value,
      password: document.getElementById("authPassword").value
    };
    const data = await api(authMode === "login" ? "/api/login" : "/api/register", {
      method:"POST", body:JSON.stringify(body)
    });
    localStorage.setItem("eventToken", data.token);
    localStorage.setItem("eventUser", JSON.stringify(data.user));
    closeAuth();
    updateAuthUI();
    if (data.user.role === "admin") location.href = "/admin.html";
    else loadOrders();
  } catch (err) {
    message.textContent = err.message;
  }
}

function logout() {
  localStorage.removeItem("eventToken");
  localStorage.removeItem("eventUser");
  updateAuthUI();
  document.getElementById("myOrders").innerHTML = '<p class="muted">Login to see your orders.</p>';
}

function updateAuthUI() {
  const logged = !!token();
  document.getElementById("loginBtn").classList.toggle("hidden", logged);
  document.getElementById("logoutBtn").classList.toggle("hidden", !logged);
}

async function submitOrder(e) {
  e.preventDefault();
  if (!token()) return openAuth();
  if (!cart.length) return alert("Add at least one product.");

  try {
    const data = await api("/api/orders", {
      method:"POST",
      body:JSON.stringify({
        eventName:document.getElementById("eventName").value,
        eventDate:document.getElementById("eventDate").value,
        guests:Number(document.getElementById("guests").value),
        address:document.getElementById("address").value,
        items:cart
      })
    });
    alert(`Order #${data.orderId} placed successfully.`);
    cart = [];
    renderCart();
    e.target.reset();
    loadOrders();
  } catch (err) {
    if (err.message.includes("Authentication")) openAuth();
    else alert(err.message);
  }
}

async function loadOrders() {
  if (!token()) return;
  try {
    const orders = await api("/api/my-orders");
    const box = document.getElementById("myOrders");
    if (!orders.length) {
      box.innerHTML = '<p class="muted">You have no orders yet.</p>';
      return;
    }
    box.innerHTML = orders.map(o => `
      <article class="order-card">
        <div class="order-top">
          <div><strong>Order #${o.id} — ${o.eventName}</strong><p class="muted">${o.eventDate} • ${o.guests} guests</p></div>
          <span class="status">${o.status}</span>
        </div>
        <p>${o.items.map(i => `${i.name} × ${i.quantity}`).join(" • ")}</p>
        <strong>₹${o.total.toLocaleString("en-IN")}</strong>
      </article>
    `).join("");
  } catch {}
}

document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderProducts();
  });
});

document.getElementById("loginBtn").onclick = () => { setAuthMode("login"); openAuth(); };
document.getElementById("logoutBtn").onclick = logout;
document.getElementById("closeAuth").onclick = closeAuth;
document.getElementById("loginTab").onclick = () => setAuthMode("login");
document.getElementById("registerTab").onclick = () => setAuthMode("register");
document.getElementById("authForm").onsubmit = submitAuth;
document.getElementById("orderForm").onsubmit = submitOrder;

updateAuthUI();
loadProducts();
loadOrders();