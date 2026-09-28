const token = localStorage.getItem("eventToken");
const user = JSON.parse(localStorage.getItem("eventUser") || "null");

if (!token || !user || user.role !== "admin") {
  location.href = "/";
}

async function api(url, options = {}) {
  const headers = {"Content-Type":"application/json", Authorization:`Bearer ${token}`};
  const res = await fetch(url, {...options, headers});
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function loadDashboard() {
  try {
    const data = await api("/api/admin/dashboard");
    document.getElementById("stats").innerHTML = `
      <div class="stat">Customers<b>${data.stats.customers}</b></div>
      <div class="stat">Orders<b>${data.stats.orders}</b></div>
      <div class="stat">Pending<b>${data.stats.pending}</b></div>
      <div class="stat">Revenue<b>₹${Number(data.stats.revenue).toLocaleString("en-IN")}</b></div>
    `;

    const statuses = ["Pending","Confirmed","Preparing","Out for Delivery","Completed","Cancelled"];
    document.getElementById("ordersTable").innerHTML = data.orders.map(o => `
      <tr>
        <td>#${o.id}</td>
        <td>${escapeHtml(o.customerName)}<br><small>${escapeHtml(o.customerEmail)}</small></td>
        <td>${escapeHtml(o.eventName)}<br><small>${escapeHtml(o.address)}</small></td>
        <td>${o.eventDate}</td>
        <td>${o.guests}</td>
        <td>₹${Number(o.total).toLocaleString("en-IN")}</td>
        <td>
          <select onchange="updateStatus(${o.id}, this.value)">
            ${statuses.map(s => `<option ${s===o.status?"selected":""}>${s}</option>`).join("")}
          </select>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    alert(err.message);
    localStorage.clear();
    location.href = "/";
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

async function updateStatus(id, status) {
  try {
    await api(`/api/admin/orders/${id}/status`, {
      method:"PATCH",
      body:JSON.stringify({status})
    });
    loadDashboard();
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById("adminLogout").onclick = () => {
  localStorage.clear();
  location.href = "/";
};

loadDashboard();