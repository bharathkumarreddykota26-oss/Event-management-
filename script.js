// Shopping cart

let cart = [];

// Add product to cart
function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            name: name,
            price: price,
            quantity: 1
        });
    }

    updateCart();

    document.getElementById("order").scrollIntoView({
        behavior: "smooth"
    });
}

// Increase quantity
function increaseQuantity(index) {
    cart[index].quantity++;
    updateCart();
}

// Decrease quantity
function decreaseQuantity(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity--;
    } else {
        cart.splice(index, 1);
    }

    updateCart();
}

// Remove item
function removeItem(index) {
    cart.splice(index, 1);
    updateCart();
}

// Update cart display
function updateCart() {
    const cartItems = document.getElementById("cartItems");
    const totalElement = document.getElementById("total");

    if (cart.length === 0) {
        cartItems.innerHTML =
            '<p class="empty">Your order is empty.</p>';

        totalElement.textContent = "0";
        return;
    }

    cartItems.innerHTML = "";

    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const div = document.createElement("div");
        div.className = "cart-item";

        div.innerHTML = `
            <div>
                <strong>${item.name}</strong>
                <p>
                    ₹${item.price} × ${item.quantity}
                    = ₹${itemTotal}
                </p>
            </div>

            <div class="cart-controls">
                <button onclick="decreaseQuantity(${index})">−</button>
                <span>${item.quantity}</span>
                <button onclick="increaseQuantity(${index})">+</button>
                <button class="remove-btn" onclick="removeItem(${index})">✕</button>
            </div>
        `;

        cartItems.appendChild(div);
    });

    totalElement.textContent = total.toLocaleString("en-IN");
}

// Place order
function placeOrder() {
    if (cart.length === 0) {
        alert("Please add some items to your order.");
        return;
    }

    document.getElementById("order").scrollIntoView({
        behavior: "smooth"
    });

    alert(
        "Your items have been added successfully! " +
        "Please enter your event details below."
    );
}

// Customer form
document
    .getElementById("customerForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        if (cart.length === 0) {
            alert(
                "Please add at least one material or food item."
            );
            return;
        }

        const name =
            document.getElementById("customerName").value;

        const eventName =
            document.getElementById("eventName").value;

        const date =
            document.getElementById("eventDate").value;

        const guests =
            document.getElementById("guests").value;

        alert(
            `Thank you ${name}!\n\n` +
            `Your ${eventName} request has been received.\n` +
            `Event Date: ${date}\n` +
            `Guests: ${guests}\n\n` +
            `We will contact you shortly.`
        );

        this.reset();

        cart = [];

        updateCart();
    });
