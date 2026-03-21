function getSquareApiBase(env) {
  const host = env.SQUARE_ENVIRONMENT === "sandbox"
    ? "connect.squareupsandbox.com"
    : "connect.squareup.com";
  return `https://${host}/v2/online-checkout/payment-links`;
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

function toMoneyAmount(value) {
  return Math.round(Number(value) * 100);
}

function buildLineItem(name, quantity, amountCents) {
  return {
    quantity: String(quantity),
    name,
    base_price_money: {
      amount: amountCents,
      currency: "USD"
    }
  };
}

async function createSquarePaymentLink(env, lineItems, redirectUrl) {
  const payload = {
    idempotency_key: crypto.randomUUID(),
    checkout_options: {
      redirect_url: redirectUrl
    },
    order: {
      location_id: env.SQUARE_LOCATION_ID,
      line_items: lineItems
    }
  };

  const res = await fetch(getSquareApiBase(env), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "Square-Version": env.SQUARE_API_VERSION || "2025-10-16"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.errors?.[0]?.detail || "Square API error");
  }

  return data.payment_link?.url;
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
      let lineItems = [];

      if (url.pathname === "/api/checkout") {
        const items = Array.isArray(payload.items) ? payload.items : [];
        if (items.length === 0) {
          return jsonResponse({ error: "Cart items are required" }, 400, origin);
        }
        lineItems = items.map((item) =>
          buildLineItem(item.name || "Product", Math.max(1, Number(item.quantity || 1)), toMoneyAmount(item.price || 0))
        );
      } else if (url.pathname === "/api/donate") {
        const amount = Number(payload.amount || 0);
        if (!amount || amount <= 0) {
          return jsonResponse({ error: "Donation amount is required" }, 400, origin);
        }
        lineItems = [buildLineItem("Donation", 1, toMoneyAmount(amount))];
      } else {
        return jsonResponse({ error: "Route not found" }, 404, origin);
      }

      const successUrl = payload.successUrl || `${env.SITE_ORIGIN}/confirmation.html`;
      const checkoutUrl = await createSquarePaymentLink(env, lineItems, successUrl);
      return jsonResponse({ checkoutUrl }, 200, origin);
    } catch (error) {
      return jsonResponse({ error: error.message || "Unexpected server error" }, 500, origin);
    }
  }
};
