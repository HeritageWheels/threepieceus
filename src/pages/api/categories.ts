/**
 * GET /api/categories
 * Fetches categories from BigCommerce catalog API.
 * Query params are forwarded to BigCommerce (e.g. ?parent_id:in=0 for top-level only).
 */

export async function GET({ request }: { request: Request }) {
  const token = import.meta.env.BIGCOMMERCE_ACCESS_TOKEN;
  const storeHash = import.meta.env.BIGCOMMERCE_STORE_HASH;

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Missing BIGCOMMERCE_ACCESS_TOKEN' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!storeHash) {
    return new Response(
      JSON.stringify({ error: 'Missing BIGCOMMERCE_STORE_HASH for API URL' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { searchParams } = new URL(request.url);
  const queryParams = new URLSearchParams({ 'parent_id:in': '0', is_visible: 'true' });
  searchParams.forEach((value, key) => queryParams.set(key, value));
  const query = queryParams.toString();
  const url = `https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/trees/categories?${query}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Auth-Token': token,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data?.title ?? res.statusText, status: res.status }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Request failed' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
