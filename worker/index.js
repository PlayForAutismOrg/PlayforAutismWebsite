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
  if (reqOrigin.startsWith("http://localhost") || reqOrigin.startsWith("https://localhost")) {
    return reqOrigin;
  }
  return reqOrigin === env.SITE_ORIGIN ? reqOrigin : env.SITE_ORIGIN || "*";
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
    name,
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
  const ids = Array.isArray(payload.catalogObjectIds) ? payload.catalogObjectIds : [];
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
    throw new Error(data?.errors?.[0]?.detail || "Inventory API error");
  }

  const counts = {};
  for (const c of data.counts || []) {
    const qty = parseFloat(c.quantity);
    counts[c.catalog_object_id] = {
      quantity: qty,
      state: c.state
    };
  }
  return jsonResponse({ counts }, 200, origin);
}

async function handleCheckout(env, payload, origin) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (items.length === 0) {
    return jsonResponse({ error: "Cart items are required" }, 400, origin);
  }

  const lineItems = items.map((item) => {
    const qty = Math.max(1, Number(item.quantity || 1));
    if (item.variationId) {
      return buildCatalogLineItem(item.variationId, qty);
    }
    return buildAdHocLineItem(item.name || "Product", qty, toMoneyAmount(item.price || 0));
  });

  const body = {
    idempotency_key: crypto.randomUUID(),
    checkout_options: {
      redirect_url: payload.successUrl || `${env.SITE_ORIGIN}/confirmation.html`
    },
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
    throw new Error(data?.errors?.[0]?.detail || "Square API error");
  }
  return jsonResponse({ checkoutUrl: data.payment_link?.url }, 200, origin);
}

async function handleDonate(env, payload, origin) {
  const amount = Number(payload.amount || 0);
  if (!amount || amount <= 0) {
    return jsonResponse({ error: "Donation amount is required" }, 400, origin);
  }

  const body = {
    idempotency_key: crypto.randomUUID(),
    checkout_options: {
      redirect_url: payload.successUrl || `${env.SITE_ORIGIN}/confirmation.html`
    },
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
    throw new Error(data?.errors?.[0]?.detail || "Square API error");
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
      return jsonResponse({ error: "Square environment is not configured" }, 500, origin);
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
          return jsonResponse({ error: "Route not found" }, 404, origin);
      }
    } catch (error) {
      return jsonResponse({ error: error.message || "Unexpected server error" }, 500, origin);
    }
  }
};
