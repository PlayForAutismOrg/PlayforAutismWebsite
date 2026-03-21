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

  const productFamilies = [
    {
      familyId: "sfa-golf-outing", name: "Swing For Autism Golf Outing",
      description: "Entry to the annual Swing for Autism golf outing event.",
      category: "events", variantLabel: null,
      variants: [
        { id: "sfa-golf-outing", label: null, price: 125.00, variationId: "YY74RYJEM4YKD6SSZVS4LIPQ" }
      ]
    },
    {
      familyId: "mini-games", name: "Mini Games",
      description: "Entry for mini games at the event.",
      category: "events", variantLabel: "Type",
      variants: [
        { id: "mini-games-individual", label: "Individual", price: 10.00, variationId: "B55X26M2VR2J2I3RJX5Y6BVH" },
        { id: "mini-games-team", label: "Team", price: 40.00, variationId: "WCPXW2K4JG7JGTZ2VR7ML7QG" }
      ]
    },
    {
      familyId: "golf", name: "Golf Registration",
      description: "Register your group for the golf outing.",
      category: "golf", variantLabel: "Players",
      variants: [
        { id: "golf-1", label: "1", price: 120.00, variationId: "Q3FZTGOVKZ2ZUSODMPGVPHJA" },
        { id: "golf-2", label: "2", price: 240.00, variationId: "Z3TK62DAIAKNL4M4OQCRRY6A" },
        { id: "golf-3", label: "3", price: 360.00, variationId: "45NYPEKO4YJOF6N7IMAX3E6O" },
        { id: "golf-4", label: "4", price: 480.00, variationId: "RPY4DS6DI37VPWNHDZCJBLL3" }
      ]
    },
    {
      familyId: "polo", name: "Polo",
      description: "PFA branded polo shirt.",
      category: "merch", variantLabel: "Size",
      variants: [
        { id: "polo-s", label: "S", price: 40.00, variationId: "D4EP5YYGLCAULCZCQNXMWZIS" },
        { id: "polo-m", label: "M", price: 40.00, variationId: "RU4F3D6QRLPME52I7UKHJ5JZ" },
        { id: "polo-l", label: "L", price: 40.00, variationId: "XBB5GPV2N4LYICXUAVL45GLV" },
        { id: "polo-xl", label: "XL", price: 40.00, variationId: "O5GHFFAQ5WYJFBLWYTJ3STMU" },
        { id: "polo-2xl", label: "2XL", price: 40.00, variationId: "DDMGH6TR2OGWLTKE4QOG22UY" }
      ]
    },
    {
      familyId: "hat", name: "Hat",
      description: "PFA branded hat.",
      category: "merch", variantLabel: null,
      variants: [
        { id: "hat", label: null, price: 20.00, variationId: "YG3KXSCSI4DZKYACHEPD4H4P" }
      ]
    },
    {
      familyId: "golf-balls", name: "Golf Balls",
      description: "Sleeve of golf balls.",
      category: "merch", variantLabel: null,
      variants: [
        { id: "golf-balls", label: null, price: 10.00, variationId: "ICR55BOSHY3T43QGP7FKNQU3" }
      ]
    },
    {
      familyId: "raffle", name: "Raffle Tickets",
      description: "Raffle tickets for prize drawings.",
      category: "raffle", variantLabel: "Tickets",
      variants: [
        { id: "raffle-1", label: "1", price: 10.00, variationId: "B4SY6ZWXFCYEDGJOZSZXHDEX" },
        { id: "raffle-6", label: "6", price: 50.00, variationId: "UP6NU2X76TVH53IBWX52ZHS6" },
        { id: "raffle-15", label: "15", price: 100.00, variationId: "Z2LPVDSHRSCNBPF42SWPJKUH" }
      ]
    },
    {
      familyId: "5050", name: "50/50",
      description: "50/50 raffle — half the pot goes to the winner.",
      category: "raffle", variantLabel: "Tickets",
      variants: [
        { id: "5050-1", label: "1", price: 1.00, variationId: "QE7ETOCXQS2MDWEYOCXIKZVF" },
        { id: "5050-5", label: "5", price: 5.00, variationId: "DRQMRVOADU77WT23TP2UWSCQ" },
        { id: "5050-10", label: "10", price: 10.00, variationId: "A6SVJSBERTSX7VRE4SX72QJ5" },
        { id: "5050-20", label: "20", price: 20.00, variationId: "AY2QICMI6IGVJHMDDH7WPSTI" },
        { id: "5050-50", label: "50", price: 50.00, variationId: "QEFCSV4YNJWIFCODBGZOH6QR" },
        { id: "5050-100", label: "100", price: 100.00, variationId: "KRDAMWT3M537JWVSCGVRC7XT" }
      ]
    }
  ];

  const allVariants = productFamilies.flatMap((f) => f.variants);

  function findVariant(id) {
    return allVariants.find((v) => v.id === id) || null;
  }

  function findFamily(variantId) {
    return productFamilies.find((f) => f.variants.some((v) => v.id === variantId)) || null;
  }

  function formatMoney(amount) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
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

  function addToCart(variantId) {
    const cart = readCart();
    const existing = cart.find((item) => item.id === variantId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: variantId, quantity: 1 });
    }
    writeCart(cart);
    renderCart();
  }

  function cartToDetailedItems() {
    const cart = readCart();
    return cart
      .map((cartItem) => {
        const variant = findVariant(cartItem.id);
        if (!variant) return null;
        const family = findFamily(cartItem.id);
        const displayName = family && variant.label
          ? `${family.name} — ${variant.label}`
          : (family ? family.name : variant.id);
        return { ...variant, name: displayName, quantity: cartItem.quantity };
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
    const ids = allVariants.map((v) => v.variationId).filter(Boolean);
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
      /* inventory unavailable */
    }
  }

  function getStockInfo(variant) {
    const inv = inventoryCounts[variant.variationId];
    if (!inv) return { tracked: false, qty: null, label: "Available", status: "available" };
    const qty = inv.quantity;
    if (qty <= 0) return { tracked: true, qty, label: "Out of Stock", status: "out" };
    if (qty <= 5) return { tracked: true, qty, label: `Only ${qty} left`, status: "low" };
    return { tracked: true, qty, label: "In Stock", status: "in" };
  }

  function renderCategoryTabs() {
    const tabBar = document.getElementById("categoryTabs");
    if (!tabBar) return;

    tabBar.innerHTML = categoryOrder
      .map((cat) => {
        const isActive = cat === activeCategory;
        const count = cat === "all"
          ? productFamilies.length
          : productFamilies.filter((f) => f.category === cat).length;
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

  function buildFamilyCard(family) {
    const hasVariants = family.variants.length > 1;
    const defaultVariant = family.variants[0];
    const stock = getStockInfo(defaultVariant);
    const fid = family.familyId;

    let variantHtml = "";
    if (hasVariants) {
      const chips = family.variants.map((v, i) => {
        const vStock = getStockInfo(v);
        const outClass = vStock.status === "out" ? " variant-chip-out" : "";
        return `<button type="button" class="variant-chip${i === 0 ? " active" : ""}${outClass}"
          data-family="${fid}" data-variant-id="${v.id}" data-price="${v.price}"
          data-variation-id="${v.variationId}"
          ${vStock.status === "out" ? 'data-out="true"' : ""}
          aria-label="${family.variantLabel} ${v.label}${vStock.status === "out" ? " (out of stock)" : ""}">${v.label}</button>`;
      }).join("");

      variantHtml = `
        <div class="variant-selector">
          <span class="variant-label">${family.variantLabel}</span>
          <div class="variant-chips">${chips}</div>
        </div>`;
    }

    const isOut = stock.status === "out";
    const btnLabel = isOut ? "Pre-order" : "Add to Cart";
    const btnClass = isOut ? "btn ripple btn-preorder" : "btn ripple";

    return `
      <article class="card product-card${isOut && !hasVariants ? " product-out-of-stock" : ""}" data-family="${fid}">
        <span class="stock-badge stock-${stock.status}" data-stock-badge="${fid}">${stock.label}</span>
        <h4>${family.name}</h4>
        <p class="meta">${family.description}</p>
        ${variantHtml}
        <div class="product-card-footer">
          <span class="price" data-price-display="${fid}">${formatMoney(defaultVariant.price)}</span>
          <button class="${btnClass}" type="button" data-add-family="${fid}" data-active-variant="${defaultVariant.id}">${btnLabel}</button>
        </div>
      </article>
    `;
  }

  function wireVariantChips(container) {
    container.querySelectorAll(".variant-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const fid = chip.getAttribute("data-family");
        const card = container.querySelector(`[data-family="${fid}"]`);
        if (!card) return;

        card.querySelectorAll(`.variant-chip[data-family="${fid}"]`).forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");

        const price = parseFloat(chip.getAttribute("data-price"));
        const variantId = chip.getAttribute("data-variant-id");
        const variationId = chip.getAttribute("data-variation-id");
        const isOut = chip.hasAttribute("data-out");

        const priceEl = card.querySelector(`[data-price-display="${fid}"]`);
        if (priceEl) priceEl.textContent = formatMoney(price);

        const badge = card.querySelector(`[data-stock-badge="${fid}"]`);
        if (badge) {
          const variant = allVariants.find((v) => v.variationId === variationId);
          if (variant) {
            const s = getStockInfo(variant);
            badge.textContent = s.label;
            badge.className = `stock-badge stock-${s.status}`;
          }
        }

        const btn = card.querySelector(`[data-add-family="${fid}"]`);
        if (btn) {
          btn.setAttribute("data-active-variant", variantId);
          btn.textContent = isOut ? "Pre-order" : "Add to Cart";
          btn.className = isOut ? "btn ripple btn-preorder" : "btn ripple";
        }

        card.classList.toggle("product-out-of-stock", isOut);
      });
    });
  }

  function renderProducts() {
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    const filtered = activeCategory === "all"
      ? productFamilies
      : productFamilies.filter((f) => f.category === activeCategory);

    let html = "";
    if (activeCategory === "all") {
      const realCats = ["events", "golf", "merch", "raffle"];
      realCats.forEach((cat) => {
        const items = filtered.filter((f) => f.category === cat);
        if (!items.length) return;
        html += `<h3 class="store-category-heading">${categoryLabels[cat]}</h3>`;
        html += `<div class="store-grid">${items.map(buildFamilyCard).join("")}</div>`;
      });
    } else {
      html += `<div class="store-grid">${filtered.map(buildFamilyCard).join("")}</div>`;
    }

    grid.classList.remove("grid-fade-in");
    void grid.offsetWidth;
    grid.innerHTML = html;
    grid.classList.add("grid-fade-in");

    wireVariantChips(grid);

    grid.querySelectorAll("[data-add-family]").forEach((button) => {
      button.addEventListener("click", () => {
        const variantId = button.getAttribute("data-active-variant");
        addToCart(variantId);
      });
    });
  }

  function removeCartItem(variantId) {
    const cart = readCart().filter((item) => item.id !== variantId);
    writeCart(cart);
    renderCart();
  }

  function renderCart() {
    const cartList = document.getElementById("cartList");
    const cartTotal = document.getElementById("cartTotal");
    const cartEmptyMessage = document.getElementById("cartEmptyMessage");
    const checkoutButton = document.getElementById("checkoutButton");
    if (!cartList || !cartTotal || !cartEmptyMessage || !checkoutButton) return;

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
    if (!checkoutButton || !notice) return;

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
      } catch {
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
    if (!optionsWrap || !donateButton || !notice) return;

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
