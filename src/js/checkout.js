import { getLocalStorage } from "./utils.mjs";

function renderCartTotal() {
    const cartItems = getLocalStorage("so-cart");
    if (!cartItems || cartItems.length === 0) {
        document.querySelector(".cart-total").style.display = "none";
        return;
    }

    const total = cartItems.reduce((sum, item) => sum + item.FinalPrice, 0);

    document.querySelector(".cart-total").style.display = "block";
    document.querySelector("#cart-total").textContent = `$${total.toFixed(2)}`;
}

function checkoutSubmit(e) {
    e.preventDefault();

    const form = document.forms["checkout"];
    const formData = new FormData(form);
    const json = Object.fromEntries(formData.entries());

    // Add items from cart
    json.items = getLocalStorage("so-cart");

    console.log("Order data:", json);

    // Here you would normally send to a server
    // For now, just alert success
    alert("Order submitted successfully!");

    // Clear the cart
    localStorage.removeItem("so-cart");

    // Redirect to home or confirmation page
    window.location.href = "/index.html";
}

renderCartTotal();

// Attach submit handler
document.querySelector("#checkout-form")
    .addEventListener("submit", checkoutSubmit);