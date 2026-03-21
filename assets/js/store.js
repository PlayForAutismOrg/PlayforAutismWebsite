(function () {
  const CART_KEY = "playForAutismCartV1";
  const IS_LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const API_BASE = IS_LOCAL
    ? "http://localhost:8787"
    : "https://api.playforautism.org";
  const CHECKOUT_ENDPOINT = API_BASE + "/api/checkout";
  const DONATION_ENDPOINT = API_BASE + "/api/donate";

  const products = [
    {
      id: "sensory-kit",
      name: "Sensory Support Kit",
      description: "A curated toolkit with sensory-friendly essentials for home or school.",
      price: 29.0
    },
    {
      id: "play-pack",
      name: "Inclusive Play Pack",
      description: "Adaptive activities for collaborative and independent play.",
      price: 24.0
    },
    {
      id: "awareness-tee",
      name: "Awareness T-Shirt",
      description: "Comfortable tee that supports autism acceptance in every community.",
      price: 32.0
    },
    {
      id: "family-journal",
      name: "Caregiver Reflection Journal",
      description: "Weekly prompts, routines, and resource pages for caregivers.",
      price: 18.0
    }
  ];

  function formatMoney(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  }

  function readCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  function addToCart(productId) {
    const cart = readCart();
    const existing = cart.find((item) => item.id === productId);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: productId, quantity: 1 });
    }
    writeCart(cart);
    renderCart();
  }

  function cartToDetailedItems() {
    const cart = readCart();
    return cart
      .map((cartItem) => {
        const product = products.find((p) => p.id === cartItem.id);
        if (!product) {
          return null;
        }
        return { ...product, quantity: cartItem.quantity };
      })
      .filter(Boolean);
  }

  function renderProducts() {
    const grid = document.getElementById("productGrid");
    if (!grid) {
      return;
    }

    grid.innerHTML = products
      .map(
        (product) => `
          <article class="card product-card">
            <div class="product-thumb" role="img" aria-label="${product.name} image placeholder"></div>
            <h3>${product.name}</h3>
            <p class="meta">${product.description}</p>
            <div class="price">${formatMoney(product.price)}</div>
            <button class="btn ripple" type="button" data-add-product="${product.id}">
              Add to Cart
            </button>
          </article>
        `
      )
      .join("");

    grid.querySelectorAll("[data-add-product]").forEach((button) => {
      button.addEventListener("click", () => {
        addToCart(button.getAttribute("data-add-product"));
      });
    });
  }

  function removeCartItem(productId) {
    const cart = readCart().filter((item) => item.id !== productId);
    writeCart(cart);
    renderCart();
  }

  function renderCart() {
    const cartList = document.getElementById("cartList");
    const cartTotal = document.getElementById("cartTotal");
    const cartEmptyMessage = document.getElementById("cartEmptyMessage");
    const checkoutButton = document.getElementById("checkoutButton");
    if (!cartList || !cartTotal || !cartEmptyMessage || !checkoutButton) {
      return;
    }

    const detailedItems = cartToDetailedItems();
    const isEmpty = detailedItems.length === 0;

    cartEmptyMessage.style.display = isEmpty ? "block" : "none";
    checkoutButton.disabled = isEmpty;
    checkoutButton.style.opacity = isEmpty ? "0.6" : "1";
    checkoutButton.style.cursor = isEmpty ? "not-allowed" : "pointer";

    if (isEmpty) {
      cartList.innerHTML = "";
      cartTotal.textContent = formatMoney(0);
      return;
    }

    cartList.innerHTML = detailedItems
      .map(
        (item) => `
          <li>
            <span>${item.name} x${item.quantity}</span>
            <span>
              ${formatMoney(item.price * item.quantity)}
              <button class="cart-remove" type="button" data-remove-item="${item.id}" aria-label="Remove ${item.name}">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg>
              </button>
            </span>
          </li>
        `
      )
      .join("");

    const total = detailedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cartTotal.textContent = formatMoney(total);

    cartList.querySelectorAll("[data-remove-item]").forEach((button) => {
      button.addEventListener("click", () => removeCartItem(button.getAttribute("data-remove-item")));
    });
  }

  async function requestCheckout(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Checkout request failed (${response.status})`);
    }

    return response.json();
  }

  function setupStoreCheckout() {
    const checkoutButton = document.getElementById("checkoutButton");
    const notice = document.getElementById("cartNotice");
    if (!checkoutButton || !notice) {
      return;
    }

    checkoutButton.addEventListener("click", async () => {
      const items = cartToDetailedItems().map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      if (items.length === 0) {
        notice.textContent = "Please add at least one item.";
        return;
      }

      notice.textContent = "Preparing secure Square checkout...";
      checkoutButton.disabled = true;
      try {
        const data = await requestCheckout(CHECKOUT_ENDPOINT, {
          items,
          successUrl: `${window.location.origin}/confirmation.html`,
          cancelUrl: `${window.location.origin}/store.html`
        });
        localStorage.removeItem(CART_KEY);
        window.location.href = data.checkoutUrl;
      } catch (error) {
        notice.textContent = "Unable to start checkout. Please try again.";
        checkoutButton.disabled = false;
      }
    });
  }

  function setupDonations() {
    const optionsWrap = document.getElementById("donationOptions");
    const donateButton = document.getElementById("donateCheckoutButton");
    const notice = document.getElementById("donationNotice");
    const donorNote = document.getElementById("donorNote");
    if (!optionsWrap || !donateButton || !notice) {
      return;
    }

    let selectedAmount = 25;
    const customRow = document.getElementById("customAmountRow");
    const customInput = document.getElementById("customAmount");

    optionsWrap.querySelectorAll(".donation-card").forEach((option) => {
      option.addEventListener("click", () => {
        optionsWrap.querySelectorAll(".donation-card").forEach((x) => x.classList.remove("active"));
        option.classList.add("active");
        const val = option.getAttribute("data-donation-amount");
        if (val === "custom") {
          customRow.hidden = false;
          if (customInput) customInput.focus();
          selectedAmount = null;
        } else {
          customRow.hidden = true;
          selectedAmount = Number(val);
        }
      });
    });

    function getAmount() {
      if (selectedAmount !== null) return selectedAmount;
      const v = customInput ? parseInt(customInput.value, 10) : 0;
      return v > 0 ? v : 0;
    }

    donateButton.addEventListener("click", async () => {
      const amt = getAmount();
      if (!amt || amt < 1) {
        notice.textContent = "Please enter a valid donation amount.";
        return;
      }
      notice.textContent = "Preparing secure Square checkout...";
      donateButton.disabled = true;
      try {
        const data = await requestCheckout(DONATION_ENDPOINT, {
          amount: amt,
          note: donorNote ? donorNote.value.trim() : "",
          successUrl: `${window.location.origin}/confirmation.html`,
          cancelUrl: `${window.location.origin}/donate.html`
        });
        window.location.href = data.checkoutUrl;
      } catch {
        notice.textContent = "Unable to start donation checkout. Please try again.";
        donateButton.disabled = false;
      }
    });
  }

  renderProducts();
  renderCart();
  setupStoreCheckout();
  setupDonations();
})();
