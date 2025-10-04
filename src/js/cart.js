import { getLocalStorage, setLocalStorage } from "./utils.mjs";

function renderCartContents() {
  const cartItems = getLocalStorage("so-cart");
  const htmlItems = cartItems.map((item) => cartItemTemplate(item));
  document.querySelector(".product-list").innerHTML = htmlItems.join("");

  // Add event listeners to all remove buttons after rendering
  addRemoveListeners();
  
  // Calculate and display cart total
  displayCartTotal(cartItems);
}

function cartItemTemplate(item) {
  const newItem = `<li class="cart-card divider">
  <a href="#" class="cart-card__image">
    <img
      src="${item.Image}"
      alt="${item.Name}"
    />
  </a>
  <a href="#">
    <h2 class="card__name">${item.Name}</h2>
  </a>
  <p class="cart-card__color">${item.Colors[0].ColorName}</p>
  <p class="cart-card__quantity">qty: 1</p>
  <p class="cart-card__price">$${item.FinalPrice}</p>
  <button class="cart-card__remove" data-id="${item.Id}" aria-label="Remove ${item.Name} from cart">
    ✕
  </button>
</li>`;

  return newItem;
}

function displayCartTotal(cartItems) {
  const total = cartItems.reduce((sum, item) => sum + item.FinalPrice, 0);
  const cartFooterElement = document.querySelector(".cart-footer");
  
  if (cartItems.length > 0) {
    cartFooterElement.classList.remove("hide");
    document.querySelector(".cart-total").textContent = `$${total.toFixed(2)}`;
  } else {
    cartFooterElement.classList.add("hide");
  }
}

function addRemoveListeners() {
  const removeButtons = document.querySelectorAll(".cart-card__remove");
  removeButtons.forEach((button) => {
    button.addEventListener("click", removeFromCart);
  });
}

function removeFromCart(event) {
  // Prevent any default behavior
  event.preventDefault();

  // Get the product ID from the data attribute
  const productId = event.target.dataset.id;

  console.log("Removing product with ID:", productId); // Debug log

  // Get current cart contents
  let cartItems = getLocalStorage("so-cart");

  console.log("Current cart items:", cartItems); // Debug log
  console.log(
    "Looking for item with ID:",
    productId,
    "Type:",
    typeof productId,
  ); // Debug log

  // Filter out the item to be removed
  // Convert both IDs to strings to ensure proper comparison
  cartItems = cartItems.filter((item) => {
    console.log("Comparing:", String(item.Id), "vs", String(productId)); // Debug log
    return String(item.Id) !== String(productId);
  });

  console.log("Cart after removal:", cartItems); // Debug log

  // Save the updated cart back to localStorage
  setLocalStorage("so-cart", cartItems);

  // Re-render the cart
  renderCartContents();
}

renderCartContents();