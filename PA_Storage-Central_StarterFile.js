/*
    Author: Lettizia Diaz de Leon
    Date: 10/31/2026
    Purpose: Runs the Willow & Pine Crafts storefront. This file displays the
    handmade products, manages the shopping cart and product stock, and saves
    shopping information in three ways: localStorage keeps the cart and stock,
    sessionStorage counts the items added during the current visit, and a
    cookie remembers the products from the last purchase.
*/

/* =========================================
     PRODUCT DATA
========================================= */
const defaultProducts = [
    {
        id: 1,
        name: "Wave Art Bookmark",
        description: "Hand-painted bookmark featuring a crashing ocean wave.",
        price: 8.00,
        stock: 10,
        image: "images/bookmark.png",
        alt: "Bookmark with a blue and white ocean wave design"
    },
    {
        id: 2,
        name: "Soy Candle Jar",
        description: "Hand-poured soy wax candle in a glass jar tied with twine.",
        price: 18.00,
        stock: 6,
        image: "images/candle.png",
        alt: "Colorful soy candles in glass jars"
    },
    {
        id: 3,
        name: "Wood Slice Coasters",
        description: "Set of four natural wood slice coasters with the bark left on.",
        price: 24.00,
        stock: 4,
        image: "images/coasters.png",
        alt: "Round wood slice coasters on a table"
    },
    {
        id: 4,
        name: "Macrame Wall Hanging",
        description: "Hand-knotted cotton macrame wall decor on a wooden dowel.",
        price: 45.00,
        stock: 2,
        image: "images/macrame.png",
        alt: "White macrame wall hanging with long fringe"
    },
    {
        id: 5,
        name: "Pine Camp Mug",
        description: "Black enamel camp mug decorated with white pine trees.",
        price: 16.00,
        stock: 5,
        image: "images/mug.png",
        alt: "Black enamel mug with three white pine trees"
    },
    {
        id: 6,
        name: "Hand-Knit Scarf",
        description: "Soft blue cable-knit scarf made with wool blend yarn.",
        price: 38.00,
        stock: 1,
        image: "images/scarf.png",
        alt: "Blue hand-knit scarf on knitting needles"
    }
];

/* =========================================
     LOAD SAVED DATA
========================================= */

// localStorage: product stock and cart contents (stay after the browser is closed)
let products = JSON.parse(localStorage.getItem("craftProducts")) || structuredClone(defaultProducts);
let cart = JSON.parse(localStorage.getItem("craftCart")) || [];

// sessionStorage: number of items added during this browsing session (cleared when the tab closes)
let sessionItemsAdded = Number(sessionStorage.getItem("itemsAddedThisSession")) || 0;

/* =========================================
     DOM REFERENCES
========================================= */
const productGrid = document.getElementById("product-grid");
const cartItems = document.getElementById("cart-items");
const cartEmpty = document.getElementById("cart-empty");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");
const headerCartCount = document.getElementById("header-cart-count");
const sessionCount = document.getElementById("session-count");
const clearCartButton = document.getElementById("clear-cart");
const checkoutButton = document.getElementById("checkout");
const cartPanel = document.getElementById("cart");
const notification = document.getElementById("notification");
const welcomeMessage = document.getElementById("welcome-message");
const lastPurchase = document.getElementById("last-purchase");

/* =========================================
     OUT OF STOCK TOOLTIP
========================================= */
const tooltip = document.createElement("div");
tooltip.classList.add("mouse-tooltip");
tooltip.textContent = "Out of Stock";
document.body.appendChild(tooltip);

/* =========================================
     COOKIE HELPERS
========================================= */
function setCookie(name, value, days) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/`;
}

function getCookie(name) {
    const cookies = document.cookie.split(";");

    for (const cookie of cookies) {
        const trimmed = cookie.trim();

        if (trimmed.startsWith(name + "=")) {
            return decodeURIComponent(trimmed.substring(name.length + 1));
        }
    }

    return null;
}

/* =========================================
     HELPER FUNCTIONS
========================================= */
function findProduct(id) {
    return products.find(product => product.id === id);
}

function formatPrice(amount) {
    return `$${amount.toFixed(2)}`;
}

function getCartTotals() {
    let count = 0;
    let total = 0;

    cart.forEach(item => {
        count += item.quantity;
        total += item.price * item.quantity;
    });

    return { count, total };
}

/* =========================================
     DISPLAY PRODUCTS
========================================= */
function displayProducts() {
    productGrid.innerHTML = "";

    products.forEach(product => {
        const card = document.createElement("article");
        card.classList.add("product-card");
        card.dataset.id = product.id;

        const soldOut = product.stock === 0;

        card.innerHTML = `
            <img src="${product.image}" alt="${product.alt}">
            <section class="product-content">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p class="price">${formatPrice(product.price)}</p>
                <p class="stock">${soldOut ? "Out of Stock" : `Available: ${product.stock}`}</p>
                <button class="add-btn" ${soldOut ? "disabled" : ""} aria-label="Add ${product.name} to cart">
                    ${soldOut ? "Out of Stock" : "Add to Cart"}
                </button>
            </section>
        `;

        // Out of stock: grey out the card and show a tooltip that follows the cursor
        if (soldOut) {
            card.classList.add("out-of-stock");

            card.addEventListener("mousemove", event => {
                tooltip.style.left = `${event.clientX + 12}px`;
                tooltip.style.top = `${event.clientY + 12}px`;
                tooltip.classList.add("show");
            });

            card.addEventListener("mouseleave", () => {
                tooltip.classList.remove("show");
            });
        }

        card.querySelector(".add-btn").addEventListener("click", () => addToCart(product.id));

        productGrid.appendChild(card);
    });

    // Hide the tooltip in case the card under the cursor was just restocked
    tooltip.classList.remove("show");
}

/* =========================================
     ADD TO CART
========================================= */
function addToCart(id) {
    const product = findProduct(id);
    if (!product || product.stock <= 0) return;

    // Reduce available stock
    product.stock--;

    // Increase quantity if the item is already in the cart, otherwise add it
    const cartItem = cart.find(item => item.id === id);

    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    // Count this item in sessionStorage for the current browsing session
    sessionItemsAdded++;
    sessionStorage.setItem("itemsAddedThisSession", sessionItemsAdded);

    saveData();
    updatePage();
    showAddedFeedback(product);
}

/* =========================================
     ADJUST CART QUANTITIES
========================================= */
function increaseQuantity(id) {
    // Uses the same logic as Add to Cart so stock and session count stay correct
    addToCart(id);
}

function decreaseQuantity(id) {
    const cartItem = cart.find(item => item.id === id);
    if (!cartItem) return;

    // Return one item to stock
    findProduct(id).stock++;
    cartItem.quantity--;

    // Remove the item from the cart when its quantity reaches zero
    if (cartItem.quantity === 0) {
        cart = cart.filter(item => item.id !== id);
    }

    saveData();
    updatePage();
}

function removeFromCart(id) {
    const cartItem = cart.find(item => item.id === id);
    if (!cartItem) return;

    // Return every unit of this item to stock
    findProduct(id).stock += cartItem.quantity;
    cart = cart.filter(item => item.id !== id);

    saveData();
    updatePage();
}

/* =========================================
     CLEAR CART
========================================= */
function clearCart() {
    if (cart.length === 0) return;

    // Return all cart items to stock
    cart.forEach(item => {
        findProduct(item.id).stock += item.quantity;
    });

    cart = [];

    saveData();
    updatePage();
}

/* =========================================
     CHECKOUT
========================================= */
function checkout() {
    if (cart.length === 0) {
        alert("Your cart is empty. Add a handmade item before checking out.");
        return;
    }

    const { count, total } = getCartTotals();

    // Save the purchased product names in a cookie for 30 days
    const purchasedNames = cart.map(item => `${item.name} (x${item.quantity})`).join(", ");
    setCookie("lastPurchased", purchasedNames, 30);

    alert(
        "Thank you for shopping at Willow & Pine Crafts!\n\n" +
        `Total items purchased: ${count}\n` +
        `Total cost: ${formatPrice(total)}`
    );

    // Items were purchased, so stock stays reduced and the cart is cleared
    cart = [];

    saveData();
    updatePage();
}

/* =========================================
     DISPLAY CART
========================================= */
function displayCart() {
    cartItems.innerHTML = "";

    cart.forEach(item => {
        const product = findProduct(item.id);
        const li = document.createElement("li");
        li.classList.add("cart-item");

        li.innerHTML = `
            <p class="cart-item-name">${item.name}</p>
            <p>${formatPrice(item.price)} each</p>
            <div class="cart-item-row">
                <div class="qty-controls">
                    <button class="minus-btn" aria-label="Decrease quantity of ${item.name}">-</button>
                    <span aria-label="Quantity">${item.quantity}</span>
                    <button class="plus-btn" ${product.stock === 0 ? "disabled" : ""} aria-label="Increase quantity of ${item.name}">+</button>
                </div>
                <strong>${formatPrice(item.price * item.quantity)}</strong>
                <button class="remove-btn" aria-label="Remove ${item.name} from cart">Remove</button>
            </div>
        `;

        li.querySelector(".minus-btn").addEventListener("click", () => decreaseQuantity(item.id));
        li.querySelector(".plus-btn").addEventListener("click", () => increaseQuantity(item.id));
        li.querySelector(".remove-btn").addEventListener("click", () => removeFromCart(item.id));

        cartItems.appendChild(li);
    });

    const { count, total } = getCartTotals();

    cartCount.textContent = count;
    headerCartCount.textContent = count;
    cartTotal.textContent = formatPrice(total);

    // Show the empty message and disable buttons when the cart is empty
    cartEmpty.style.display = cart.length === 0 ? "block" : "none";
    clearCartButton.disabled = cart.length === 0;
    checkoutButton.disabled = cart.length === 0;
}

/* =========================================
     SESSION AND COOKIE DISPLAYS
========================================= */
function displaySessionCount() {
    sessionCount.textContent = sessionItemsAdded;
}

function displayLastPurchase() {
    const lastPurchased = getCookie("lastPurchased");

    if (lastPurchased) {
        welcomeMessage.textContent = "Welcome back! Thank you for supporting handmade work.";
        lastPurchase.textContent = `Last purchased: ${lastPurchased}`;
    } else {
        welcomeMessage.textContent = "Browse one-of-a-kind crafts made by hand in small batches.";
        lastPurchase.textContent = "No previous purchases yet.";
    }
}

/* =========================================
     ADD TO CART VISUAL INDICATION
========================================= */
/*
    VISUAL INDICATION USED: When a product is added to the cart, three things
    happen at once. The product card gets a green highlight border, the cart
    panel and the header cart badge do a short bounce animation, and a green
    notification message appears in the bottom-left corner saying which item
    was added. All three disappear on their own after a moment.
*/
function showAddedFeedback(product) {
    // Green highlight on the product card
    const card = productGrid.querySelector(`[data-id="${product.id}"]`);
    if (card) {
        card.classList.add("added");
        setTimeout(() => card.classList.remove("added"), 800);
    }

    // Bounce the cart panel and header badge
    [cartPanel, headerCartCount].forEach(element => {
        element.classList.remove("bounce");
        void element.offsetWidth; // restart the animation if it is already running
        element.classList.add("bounce");
    });

    // Notification message
    notification.textContent = `${product.name} added to cart!`;
    notification.classList.add("show");

    clearTimeout(showAddedFeedback.timer);
    showAddedFeedback.timer = setTimeout(() => notification.classList.remove("show"), 2000);
}

/* =========================================
     SAVE DATA
========================================= */
function saveData() {
    localStorage.setItem("craftProducts", JSON.stringify(products));
    localStorage.setItem("craftCart", JSON.stringify(cart));
}

/* =========================================
     UPDATE PAGE
========================================= */
function updatePage() {
    displayProducts();
    displayCart();
    displaySessionCount();
    displayLastPurchase();
}

/* =========================================
     INITIALIZATION
========================================= */
clearCartButton.addEventListener("click", clearCart);
checkoutButton.addEventListener("click", checkout);

updatePage();
