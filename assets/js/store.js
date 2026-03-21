(function () {
  const CART_KEY = "playForAutismCartV1";
  const IS_LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const API_BASE = IS_LOCAL
    ? "http://localhost:8787"
    : "https://api.playforautism.org";
  const CHECKOUT_ENDPOINT = API_BASE + "/api/checkout";
  const DONATION_ENDPOINT = API_BASE + "/api/donate";
  const INVENTORY_ENDPOINT = API_BASE + "/api/inventory";

  let inventoryCounts = {};

  const products = [
    { id: "sfa-golf-outing", name: "Swing For Autism Golf Outing", description: "Entry to the annual Swing for Autism golf outing event.", price: 125.00, category: "events", variationId: "YY74RYJEM4YKD6SSZVS4LIPQ" },
    { id: "golf-1", name: "Golf — 1 Golfer", description: "Single golfer registration.", price: 120.00, category: "golf", variationId: "Q3FZTGOVKZ2ZUSODMPGVPHJA" },
    { id: "golf-2", name: "Golf — 2 Golfers", description: "Two golfer registration.", price: 240.00, category: "golf", variationId: "Z3TK62DAIAKNL4M4OQCRRY6A" },
    { id: "golf-3", name: "Golf — 3 Golfers", description: "Three golfer registration.", price: 360.00, category: "golf", variationId: "45NYPEKO4YJOF6N7IMAX3E6O" },
    { id: "golf-4", name: "Golf — 4 Golfers", description: "Four golfer registration (full team).", price: 480.00, category: "golf", variationId: "RPY4DS6DI37VPWNHDZCJBLL3" },
    { id: "polo-s", name: "Polo — Small", description: "PFA branded polo shirt, size Small.", price: 40.00, category: "merch", variationId: "D4EP5YYGLCAULCZCQNXMWZIS" },
    { id: "polo-m", name: "Polo — Medium", description: "PFA branded polo shirt, size Medium.", price: 40.00, category: "merch", variationId: "RU4F3D6QRLPME52I7UKHJ5JZ" },
    { id: "polo-l", name: "Polo — Large", description: "PFA branded polo shirt, size Large.", price: 40.00, category: "merch", variationId: "XBB5GPV2N4LYICXUAVL45GLV" },
    { id: "polo-xl", name: "Polo — XL", description: "PFA branded polo shirt, size XL.", price: 40.00, category: "merch", variationId: "O5GHFFAQ5WYJFBLWYTJ3STMU" },
    { id: "polo-2xl", name: "Polo — 2XL", description: "PFA branded polo shirt, size 2XL.", price: 40.00, category: "merch", variationId: "DDMGH6TR2OGWLTKE4QOG22UY" },
    { id: "hat", name: "Hat", description: "PFA branded hat.", price: 20.00, category: "merch", variationId: "YG3KXSCSI4DZKYACHEPD4H4P" },
    { id: "golf-balls", name: "Golf Balls", description: "Sleeve of golf balls.", price: 10.00, category: "merch", variationId: "ICR55BOSHY3T43QGP7FKNQU3" },
    { id: "mini-games-individual", name: "Mini Games — Individual", description: "Individual entry for mini games at the event.", price: 10.00, category: "events", variationId: "B55X26M2VR2J2I3RJX5Y6BVH" },
    { id: "mini-games-team", name: "Mini Games — Team", description: "Team entry for mini games at the event.", price: 40.00, category: "events", variationId: "WCPXW2K4JG7JGTZ2VR7ML7QG" },
    { id: "raffle-1", name: "Raffle — 1 Ticket", description: "One raffle ticket for prize drawings.", price: 10.00, category: "raffle", variationId: "B4SY6ZWXFCYEDGJOZSZXHDEX" },
    { id: "raffle-6", name: "Raffle — 6 Tickets", description: "Six raffle tickets for prize drawings.", price: 50.00, category: "raffle", variationId: "UP6NU2X76TVH53IBWX52ZHS6" },
    { id: "raffle-15", name: "Raffle — 15 Tickets", description: "Fifteen raffle tickets for prize drawings.", price: 100.00, category: "raffle", variationId: "Z2LPVDSHRSCNBPF42SWPJKUH" },
    { id: "5050-1", name: "50/50 — 1 Ticket", description: "One 50/50 raffle ticket.", price: 1.00, category: "raffle", variationId: "QE7ETOCXQS2MDWEYOCXIKZVF" },
    { id: "5050-5", name: "50/50 — 5 Tickets", description: "Five 50/50 raffle tickets.", price: 5.00, category: "raffle", variationId: "DRQMRVOADU77WT23TP2UWSCQ" },
    { id: "5050-10", name: "50/50 — 10 Tickets", description: "Ten 50/50 raffle tickets.", price: 10.00, category: "raffle", variationId: "A6SVJSBERTSX7VRE4SX72QJ5" },
    { id: "5050-20", name: "50/50 — 20 Tickets", description: "Twenty 50/50 raffle tickets.", price: 20.00, category: "raffle", variationId: "AY2QICMI6IGVJHMDDH7WPSTI" },
    { id: "5050-50", name: "50/50 — 50 Tickets", description: "Fifty 50/50 raffle tickets.", price: 50.00, category: "raffle", variationId: "QEFCSV4YNJWIFCODBGZOH6QR" },
    { id: "5050-100", name: "50/50 — 100 Tickets", description: "One hundred 50/50 raffle tickets.", price: 100.00, category: "raffle", variationId: "KRDAMWT3M537JWVSCGVRC7XT" }
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

  const categoryLabels = {
    all: "All",
    events: "Events & Golf",
    golf: "Golf Packages",
    merch: "Merchandise",
    raffle: "Raffle & 50/50"
  };

  const categoryOrder = ["all", "events", "golf", "merch", "raffle"];

  let activeCategory = "all";

  async function fetchInventory() {
    const ids = products.map((p) => p.variationId).filter(Boolean);
    try {
      const res = await fetch(INVENTORY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogObjectIds: ids })
      });
      if (!res.ok) return;
      const data = await res.json();
      inventoryCounts = data.counts || {};
    } catch {
      // Inventory unavailable — render all as available
    }
  }

  function getStockInfo(product) {
    const inv = inventoryCounts[product.variationId];
    if (!inv) {
      return { tracked: false, qty: null, label: "Available", status: "available" };
    }
    const qty = inv.quantity;
    if (qty <= 0) {
      return { tracked: true, qty, label: "Out of Stock", status: "out" };
    }
    if (qty <= 5) {
      return { tracked: true, qty, label: `Only ${qty} left`, status: "low" };
    }
    return { tracked: true, qty, label: "In Stock", status: "in" };
  }

  function renderCategoryTabs() {
    const tabBar = document.getElementById("categoryTabs");
    if (!tabBar) return;

    tabBar.innerHTML = categoryOrder
      .map((cat) => {
        const isActive = cat === activeCategory;
        const count = cat === "all" ? products.length : products.filter((p) => p.category === cat).length;
        return `<button class="store-tab${isActive ? " active" : ""}" type="button" role="tab"
          aria-selected="${isActive}" data-category="${cat}">
          ${categoryLabels[cat]}<span class="tab-count">${count}</span>
        </button>`;
      })
      .join("");

    tabBar.querySelectorAll(".store-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.getAttribute("data-category");
        if (cat === activeCategory) return;
        activeCategory = cat;
        history.replaceState(null, "", cat === "all" ? location.pathname : `#${cat}`);
        renderCategoryTabs();
        renderProducts();
      });
    });
  }

  function buildProductCard(product) {
    const stock = getStockInfo(product);
    const isOut = stock.status === "out";
    const btnLabel = isOut ? "Pre-order" : "Add to Cart";
    const btnClass = isOut ? "btn ripple btn-preorder" : "btn ripple";
    return `
      <article class="card product-card${isOut ? " product-out-of-stock" : ""}">
        <span class="stock-badge stock-${stock.status}">${stock.label}</span>
        <h4>${product.name}</h4>
        <p class="meta">${product.description}</p>
        <div class="product-card-footer">
          <span class="price">${formatMoney(product.price)}</span>
          <button class="${btnClass}" type="button" data-add-product="${product.id}">${btnLabel}</button>
        </div>
      </article>
    `;
  }

  function renderProducts() {
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    const filtered = activeCategory === "all"
      ? products
      : products.filter((p) => p.category === activeCategory);

    let html = "";
    if (activeCategory === "all") {
      const realCats = ["events", "golf", "merch", "raffle"];
      realCats.forEach((cat) => {
        const items = filtered.filter((p) => p.category === cat);
        if (!items.length) return;
        html += `<h3 class="store-category-heading">${categoryLabels[cat]}</h3>`;
        html += `<div class="store-grid">${items.map(buildProductCard).join("")}</div>`;
      });
    } else {
      html += `<div class="store-grid">${filtered.map(buildProductCard).join("")}</div>`;
    }

    grid.classList.remove("grid-fade-in");
    void grid.offsetWidth;
    grid.innerHTML = html;
    grid.classList.add("grid-fade-in");

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
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        variationId: item.variationId
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

  async function init() {
    const hash = location.hash.replace("#", "");
    if (hash && categoryOrder.includes(hash)) {
      activeCategory = hash;
    }
    await fetchInventory();
    renderCategoryTabs();
    renderProducts();
    renderCart();
    setupStoreCheckout();
    setupDonations();

    window.addEventListener("hashchange", () => {
      const h = location.hash.replace("#", "");
      if (h && categoryOrder.includes(h) && h !== activeCategory) {
        activeCategory = h;
        renderCategoryTabs();
        renderProducts();
      }
    });
  }

  init();
})();
