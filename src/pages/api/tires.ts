/**
 * POST /api/tires
 * Proxies tire search requests to BigCommerce GraphQL API,
 * keeping the token server-side.
 * Body: { sizes: string[] }
 */

export async function POST({ request }: { request: Request }) {
  const graphqlUrl = import.meta.env.BIGCOMMERCE_GRAPHQL_URL;
  const graphqlToken = import.meta.env.BIGCOMMERCE_GRAPHQL_TOKEN;

  if (!graphqlUrl || !graphqlToken) {
    return new Response(
      JSON.stringify({ error: 'Missing BigCommerce GraphQL configuration' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let sizes: string[];
  try {
    const body = await request.json();
    sizes = body.sizes;
    if (!Array.isArray(sizes) || !sizes.length) {
      return new Response(
        JSON.stringify({ error: 'sizes must be a non-empty array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const query = `{
  site {
    search {
      searchProducts(
        sort: LOWEST_PRICE,
        filters: {
          hideOutOfStock: true,
          productAttributes: [
            {
              attribute: "Size",
              values: ${JSON.stringify(sizes)}
            }
          ]
        }
      ) {
        products(first: 30) {
          edges {
            cursor
            node {
              defaultImage {
                altText
                urlOriginal
              }
              sku
              entityId
              name
              path
              addToCartUrl
              prices {
                price {
                  formatted
                  value
                }
              }
            }
          }
          collectionInfo {
            totalItems
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    }
  }
}`;

  try {
    const res = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${graphqlToken}`,
      },
      body: JSON.stringify({ query }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data ?? res.statusText }), {
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
