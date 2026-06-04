#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const STRIPE_API_VERSION = "2026-02-25.clover";
const APP_SLUG = "moneyprint-video-gen";

const catalog = [
  {
    planId: "starter",
    envKey: "STRIPE_STARTER_PRICE_ID",
    productName: "MoneyPrint Starter",
    description: "50 render credits per month for solo creators.",
    lookupKey: "moneyprint_starter_monthly",
    unitAmount: 1900,
    credits: 50,
    mode: "subscription",
    interval: "month",
  },
  {
    planId: "pro",
    envKey: "STRIPE_PRO_PRICE_ID",
    productName: "MoneyPrint Pro",
    description: "180 render credits per month for regular content pipelines.",
    lookupKey: "moneyprint_pro_monthly",
    unitAmount: 4900,
    credits: 180,
    mode: "subscription",
    interval: "month",
  },
  {
    planId: "agency",
    envKey: "STRIPE_AGENCY_PRICE_ID",
    productName: "MoneyPrint Agency",
    description: "700 render credits per month for client and agency volume.",
    lookupKey: "moneyprint_agency_monthly",
    unitAmount: 14900,
    credits: 700,
    mode: "subscription",
    interval: "month",
  },
  {
    planId: "credit_pack_25",
    envKey: "STRIPE_CREDIT_PACK_PRICE_ID",
    productName: "MoneyPrint 25 Credit Pack",
    description: "25 one-time render credits.",
    lookupKey: "moneyprint_credit_pack_25",
    unitAmount: 900,
    credits: 25,
    mode: "payment",
  },
];

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  printHelp();
  process.exit(0);
}

loadEnvFile(".env.local");
loadEnvFile(".env");
loadEnvFile("apps/web/.env.local");
loadEnvFile("apps/web/.env");

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  fail("Missing STRIPE_SECRET_KEY. Put a rotated test key in .env.local or export it before running this script.");
}

const isLiveKey = secretKey.startsWith("sk_live_");
const liveModeAllowed = args.has("--live") || process.env.STRIPE_SYNC_LIVE === "1";
if (isLiveKey && !liveModeAllowed) {
  fail("Refusing to use a live Stripe key without --live or STRIPE_SYNC_LIVE=1. Rotate the exposed key first.");
}

const writeEnvArg = process.argv.find((arg) => arg.startsWith("--write-env="));
const writeEnvPath = writeEnvArg ? writeEnvArg.split("=").slice(1).join("=") : null;

const results = [];

for (const item of catalog) {
  const product = await findOrCreateProduct(item);
  const price = await findOrCreatePrice(item, product.id);
  results.push({ ...item, productId: product.id, priceId: price.id });
}

console.log(`\nStripe ${isLiveKey ? "live" : "test"} catalog is ready.\n`);
for (const result of results) {
  console.log(`${result.productName}`);
  console.log(`  product: ${result.productId}`);
  console.log(`  price:   ${result.priceId}`);
}

console.log("\nSet these environment variables in Vercel and local .env.local:\n");
for (const result of results) {
  console.log(`${result.envKey}=${result.priceId}`);
}

if (writeEnvPath) {
  writeEnvFile(writeEnvPath, Object.fromEntries(results.map((result) => [result.envKey, result.priceId])));
  console.log(`\nUpdated ${writeEnvPath} with Stripe price IDs.`);
}

async function findOrCreateProduct(item) {
  const existing = await findProductByPlanId(item.planId);
  const productPayload = {
    name: item.productName,
    description: item.description,
    active: "true",
    "metadata[app]": APP_SLUG,
    "metadata[plan_id]": item.planId,
    "metadata[credits]": String(item.credits),
    "metadata[checkout_mode]": item.mode,
  };

  if (existing) {
    return stripeRequest("POST", `/products/${existing.id}`, productPayload);
  }

  return stripeRequest("POST", "/products", productPayload);
}

async function findProductByPlanId(planId) {
  for await (const product of listStripeObjects("/products", { active: "true" })) {
    if (product.metadata?.app === APP_SLUG && product.metadata?.plan_id === planId) {
      return product;
    }
  }
  return null;
}

async function findOrCreatePrice(item, productId) {
  const existing = await findPriceByLookupKey(item.lookupKey);
  if (existing && priceMatches(existing, item, productId)) {
    return existing;
  }

  const payload = {
    currency: "usd",
    product: productId,
    lookup_key: item.lookupKey,
    unit_amount: String(item.unitAmount),
    "metadata[app]": APP_SLUG,
    "metadata[plan_id]": item.planId,
    "metadata[credits]": String(item.credits),
    "metadata[checkout_mode]": item.mode,
  };

  if (existing) {
    payload.transfer_lookup_key = "true";
  }

  if (item.mode === "subscription") {
    payload["recurring[interval]"] = item.interval;
  }

  const created = await stripeRequest("POST", "/prices", payload);

  if (existing && existing.id !== created.id) {
    await stripeRequest("POST", `/prices/${existing.id}`, { active: "false" });
  }

  return created;
}

async function findPriceByLookupKey(lookupKey) {
  const params = new URLSearchParams();
  params.append("lookup_keys[]", lookupKey);
  params.set("limit", "1");

  const response = await stripeRequest("GET", `/prices?${params.toString()}`);
  return response.data?.[0] ?? null;
}

function priceMatches(price, item, productId) {
  const priceProductId = typeof price.product === "string" ? price.product : price.product?.id;
  return (
    price.active === true &&
    price.currency === "usd" &&
    price.unit_amount === item.unitAmount &&
    priceProductId === productId &&
    (item.mode === "payment"
      ? !price.recurring
      : price.recurring?.interval === item.interval)
  );
}

async function* listStripeObjects(path, params = {}) {
  let startingAfter = null;

  while (true) {
    const query = new URLSearchParams({ limit: "100", ...params });
    if (startingAfter) {
      query.set("starting_after", startingAfter);
    }

    const page = await stripeRequest("GET", `${path}?${query.toString()}`);
    for (const object of page.data ?? []) {
      yield object;
    }

    if (!page.has_more || !page.data?.length) {
      return;
    }

    startingAfter = page.data[page.data.length - 1].id;
  }
}

async function stripeRequest(method, path, params) {
  const body = params ? new URLSearchParams(params).toString() : undefined;
  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Stripe-Version": STRIPE_API_VERSION,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error?.message || `${method} ${path} failed with ${response.status}`;
    fail(message);
  }
  return payload;
}

function loadEnvFile(path) {
  const absolutePath = resolve(path);
  if (!existsSync(absolutePath)) {
    return;
  }

  const content = readFileSync(absolutePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }

    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function writeEnvFile(path, values) {
  const absolutePath = resolve(path);
  const existing = existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
  const lines = existing ? existing.split(/\r?\n/) : [];
  const remaining = new Map(Object.entries(values));

  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (!match || !remaining.has(match[1])) {
      return line;
    }
    const key = match[1];
    const value = remaining.get(key);
    remaining.delete(key);
    return `${key}=${value}`;
  });

  if (remaining.size > 0 && nextLines.some((line) => line.trim() !== "")) {
    nextLines.push("");
  }

  for (const [key, value] of remaining) {
    nextLines.push(`${key}=${value}`);
  }

  writeFileSync(absolutePath, `${nextLines.join("\n").replace(/\n*$/, "")}\n`);
}

function printHelp() {
  console.log(`
Create or sync Stripe Products and Prices for MoneyPrint.

Usage:
  node scripts/sync-stripe-plans.mjs [--live] [--write-env=.env.local]

Environment:
  STRIPE_SECRET_KEY must be set in the shell or .env.local.

Safety:
  Live keys require --live or STRIPE_SYNC_LIVE=1.
  Rotate any secret key that was pasted into chat before running live mode.
`);
}

function fail(message) {
  console.error(`Stripe plan sync failed: ${message}`);
  process.exit(1);
}
