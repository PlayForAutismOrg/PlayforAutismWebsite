const ALLOWED_VARIATION_IDS = new Set([
  "YY74RYJEM4YKD6SSZVS4LIPQ", "Q3FZTGOVKZ2ZUSODMPGVPHJA",
  "Z3TK62DAIAKNL4M4OQCRRY6A", "45NYPEKO4YJOF6N7IMAX3E6O",
  "RPY4DS6DI37VPWNHDZCJBLL3", "D4EP5YYGLCAULCZCQNXMWZIS",
  "RU4F3D6QRLPME52I7UKHJ5JZ", "XBB5GPV2N4LYICXUAVL45GLV",
  "O5GHFFAQ5WYJFBLWYTJ3STMU", "DDMGH6TR2OGWLTKE4QOG22UY",
  "YG3KXSCSI4DZKYACHEPD4H4P", "ICR55BOSHY3T43QGP7FKNQU3",
  "B55X26M2VR2J2I3RJX5Y6BVH", "WCPXW2K4JG7JGTZ2VR7ML7QG",
  "B4SY6ZWXFCYEDGJOZSZXHDEX", "UP6NU2X76TVH53IBWX52ZHS6",
  "Z2LPVDSHRSCNBPF42SWPJKUH", "QE7ETOCXQS2MDWEYOCXIKZVF",
  "DRQMRVOADU77WT23TP2UWSCQ", "A6SVJSBERTSX7VRE4SX72QJ5",
  "AY2QICMI6IGVJHMDDH7WPSTI", "QEFCSV4YNJWIFCODBGZOH6QR",
  "KRDAMWT3M537JWVSCGVRC7XT", "TIV2K5LKEJ6QKWNCVT4NV5TX"
]);

const MAX_CART_ITEMS = 50;
const MAX_QUANTITY = 100;
const MAX_DONATION = 50000;

function getSquareHost(env) {
  return env.SQUARE_ENVIRONMENT === "sandbox"
    ? "connect.squareupsandbox.com"
    : "connect.squareup.com";
}

function jsonResponse(body, status = 200, origin = "*") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type"
    }
  });
}

function getOrigin(request, env) {
  const reqOrigin = request.headers.get("origin") || "";
  const allowed = [env.SITE_ORIGIN || "https://playforautism.org"];
  if (env.DEV_ORIGIN) allowed.push(env.DEV_ORIGIN);
  if (allowed.includes(reqOrigin)) return reqOrigin;
  return allowed[0];
}

function isAllowedRedirect(url, env) {
  try {
    const parsed = new URL(url);
    const siteHost = new URL(env.SITE_ORIGIN || "https://playforautism.org").hostname;
    return parsed.hostname === siteHost && parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function squareHeaders(env) {
  return {
    Authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
    "Square-Version": env.SQUARE_API_VERSION || "2025-10-16"
  };
}

function toMoneyAmount(value) {
  return Math.round(Number(value) * 100);
}

function buildAdHocLineItem(name, quantity, amountCents) {
  return {
    quantity: String(quantity),
    name: String(name).slice(0, 100),
    base_price_money: { amount: amountCents, currency: "USD" }
  };
}

function buildCatalogLineItem(variationId, quantity) {
  return {
    quantity: String(quantity),
    catalog_object_id: variationId
  };
}

async function handleInventory(env, payload, origin) {
  const raw = Array.isArray(payload.catalogObjectIds) ? payload.catalogObjectIds : [];
  const ids = raw.filter((id) => typeof id === "string" && ALLOWED_VARIATION_IDS.has(id));
  if (ids.length === 0) {
    return jsonResponse({ counts: {} }, 200, origin);
  }

  const res = await fetch(`https://${getSquareHost(env)}/v2/inventory/batch-retrieve-counts`, {
    method: "POST",
    headers: squareHeaders(env),
    body: JSON.stringify({
      catalog_object_ids: ids,
      location_ids: [env.SQUARE_LOCATION_ID]
    })
  });

  const data = await res.json();
  if (!res.ok) {
    return jsonResponse({ error: "Unable to retrieve inventory" }, 502, origin);
  }

  const counts = {};
  for (const c of data.counts || []) {
    const qty = parseFloat(c.quantity);
    counts[c.catalog_object_id] = { quantity: qty, state: c.state };
  }
  return jsonResponse({ counts }, 200, origin);
}

async function handleCheckout(env, payload, origin) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (items.length === 0 || items.length > MAX_CART_ITEMS) {
    return jsonResponse({ error: "Invalid cart" }, 400, origin);
  }

  const lineItems = items.map((item) => {
    const qty = Math.min(Math.max(1, Number(item.quantity || 1)), MAX_QUANTITY);
    if (item.variationId && ALLOWED_VARIATION_IDS.has(item.variationId)) {
      return buildCatalogLineItem(item.variationId, qty);
    }
    return buildAdHocLineItem(item.name || "Product", qty, toMoneyAmount(item.price || 0));
  });

  const redirectUrl = isAllowedRedirect(payload.successUrl, env)
    ? payload.successUrl
    : `${env.SITE_ORIGIN}/confirmation.html`;

  const body = {
    idempotency_key: crypto.randomUUID(),
    checkout_options: { redirect_url: redirectUrl },
    order: {
      location_id: env.SQUARE_LOCATION_ID,
      line_items: lineItems
    }
  };

  const res = await fetch(`https://${getSquareHost(env)}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: squareHeaders(env),
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    return jsonResponse({ error: "Unable to create checkout" }, 502, origin);
  }
  return jsonResponse({ checkoutUrl: data.payment_link?.url }, 200, origin);
}

async function handleDonate(env, payload, origin) {
  const amount = Number(payload.amount || 0);
  if (!amount || amount < 1 || amount > MAX_DONATION) {
    return jsonResponse({ error: "Invalid donation amount" }, 400, origin);
  }

  const redirectUrl = isAllowedRedirect(payload.successUrl, env)
    ? payload.successUrl
    : `${env.SITE_ORIGIN}/confirmation.html`;

  const body = {
    idempotency_key: crypto.randomUUID(),
    checkout_options: { redirect_url: redirectUrl },
    order: {
      location_id: env.SQUARE_LOCATION_ID,
      line_items: [buildAdHocLineItem("Donation", 1, toMoneyAmount(amount))]
    }
  };

  const res = await fetch(`https://${getSquareHost(env)}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: squareHeaders(env),
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    return jsonResponse({ error: "Unable to create donation checkout" }, 502, origin);
  }
  return jsonResponse({ checkoutUrl: data.payment_link?.url }, 200, origin);
}

export default {
  async fetch(request, env) {
    const origin = getOrigin(request, env);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return jsonResponse({}, 200, origin);
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, origin);
    }

    if (!env.SQUARE_ACCESS_TOKEN || !env.SQUARE_LOCATION_ID) {
      return jsonResponse({ error: "Service unavailable" }, 503, origin);
    }

    try {
      const payload = await request.json();

      switch (url.pathname) {
        case "/api/inventory":
          return await handleInventory(env, payload, origin);
        case "/api/checkout":
          return await handleCheckout(env, payload, origin);
        case "/api/donate":
          return await handleDonate(env, payload, origin);
        default:
          return jsonResponse({ error: "Not found" }, 404, origin);
      }
    } catch {
      return jsonResponse({ error: "Invalid request" }, 400, origin);
    }
  }
};
