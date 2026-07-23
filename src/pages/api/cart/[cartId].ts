/**
 * GET /api/cart/:cartId — permanent, infinite-click cart checkout link.
 *
 * BigCommerce checkout redirect URLs are single-use: the first click (or an
 * inbox link-scanner) consumes the token and every later click dead-ends.
 * Rescue/quote emails used to mint a token at SEND time, so each new email
 * invalidated the links in all previous emails ("newest email wins").
 *
 * This route mints a FRESH redirect URL at CLICK time via
 * POST /v3/carts/{cartId}/redirect_urls and 302s the visitor into checkout —
 * the emailed link never dies while the cart exists.
 *
 * Failure behavior: any error (expired/converted cart, missing env, BC down)
 * 302s to https://threepiece.us/cart.php, where the "TP Cart Link Rescue"
 * banner (chat + 813-535-5801) already handles dead-link visitors.
 *
 * Env (Vercel dashboard): BC_CART_ACCESS_TOKEN — Carts-scope-only token
 * (deliberately separate from the catalog token). BIGCOMMERCE_STORE_HASH as
 * elsewhere. Until the token is added this route is inert: every hit falls
 * through to the cart.php fallback.
 *
 * MUST stay excluded from ISR (astro.config.mjs isr.exclude): caching this
 * redirect would hand every visitor the same already-consumed token —
 * re-creating the exact bug this route exists to kill.
 */

const FALLBACK_URL = 'https://threepiece.us/cart.php';

const CART_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function redirect(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function GET({ params }: { params: { cartId?: string } }) {
  const cartId = (params.cartId ?? '').trim();
  if (!CART_ID_RE.test(cartId)) {
    return redirect(FALLBACK_URL);
  }

  const token = import.meta.env.BC_CART_ACCESS_TOKEN;
  const storeHash = import.meta.env.BIGCOMMERCE_STORE_HASH;
  if (!token || !storeHash) {
    return redirect(FALLBACK_URL);
  }

  try {
    const res = await fetch(
      `https://api.bigcommerce.com/stores/${storeHash}/v3/carts/${cartId}/redirect_urls`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
        },
      }
    );

    if (!res.ok) {
      // 404/410 = cart expired or already converted; anything else = BC issue.
      return redirect(FALLBACK_URL);
    }

    const data = await res.json().catch(() => ({}) as Record<string, never>);
    const checkoutUrl: string | undefined = data?.data?.checkout_url;
    if (!checkoutUrl || !checkoutUrl.startsWith('https://')) {
      return redirect(FALLBACK_URL);
    }
    return redirect(checkoutUrl);
  } catch {
    return redirect(FALLBACK_URL);
  }
}
