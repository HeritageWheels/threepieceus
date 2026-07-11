const TOP_LEVEL_NAV: { name: string; path: string }[] = [
  { name: 'Shop', path: '/shop' },
  { name: 'Brands', path: '/brands' },
  { name: 'Heritage Wheel', path: '/heritage-wheel' },
  { name: 'Threepieceus Gallery', path: '/vehicle-gallery' },
  { name: 'Add Your Ride', path: '/add-vehicle' },
  { name: 'Fitment Info', path: '/blog' },
];

interface CategoryNode {
  category_id?: number;
  parent_id?: number;
  name?: string;
  url?: { path?: string };
}

export interface NavChild {
  name: string;
  href: string;
  category_id?: number;
}

export interface NavItem {
  name: string;
  href: string;
  children: NavChild[];
}

const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CATEGORY_PAGES = 20;

let cachedNavItems: NavItem[] | null = null;
let cacheExpiresAt = 0;

function toHref(baseUrl: string, path: string | undefined): string {
  if (!path) return baseUrl;
  return path.startsWith('http') ? path : `${baseUrl}${path.replace(/^\/?/, '/')}`;
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function parseCategoryList(json: unknown): CategoryNode[] {
  const data = (json as { data?: unknown })?.data ?? json;
  if (Array.isArray(data)) return data as CategoryNode[];
  const cats = (data as { categories?: CategoryNode[] })?.categories;
  return Array.isArray(cats) ? cats : [];
}

function fallbackNavItems(baseUrl: string): NavItem[] {
  return TOP_LEVEL_NAV.map((item) => ({
    name: item.name,
    href: `${baseUrl}${item.path.replace(/^\/?/, '/')}`,
    children: [],
  }));
}

async function fetchCategories(query: URLSearchParams): Promise<CategoryNode[]> {
  const token = import.meta.env.BIGCOMMERCE_ACCESS_TOKEN;
  const storeHash = import.meta.env.BIGCOMMERCE_STORE_HASH;
  if (!token || !storeHash) return [];

  const all: CategoryNode[] = [];
  let page = 1;

  while (page <= MAX_CATEGORY_PAGES) {
    const params = new URLSearchParams(query);
    params.set('is_visible', 'true');
    params.set('limit', '250');
    params.set('page', String(page));

    const url = `https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/trees/categories?${params}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Auth-Token': token,
      },
    });

    if (!res.ok) {
      console.error('nav-items: BigCommerce categories request failed:', res.status, params.toString());
      break;
    }

    const batch = parseCategoryList(await res.json());
    all.push(...batch.filter((n) => n.name));

    if (batch.length < 250) break;
    page += 1;
  }

  return all;
}

function buildNavItems(
  baseUrl: string,
  rootParents: CategoryNode[],
  childrenByParentId: Map<number, CategoryNode[]>,
): NavItem[] {
  return TOP_LEVEL_NAV.map((item) => {
    const parent = rootParents.find((p) => p.name && sameName(p.name, item.name));

    if (!parent?.category_id) {
      return {
        name: item.name,
        href: `${baseUrl}${item.path.replace(/^\/?/, '/')}`,
        children: [],
      };
    }

    const children = (childrenByParentId.get(parent.category_id) ?? []).map((node) => ({
      name: node.name!,
      href: toHref(baseUrl, node.url?.path),
      category_id: node.category_id,
    }));

    return {
      name: item.name,
      href: toHref(baseUrl, parent.url?.path),
      children,
    };
  });
}

/** Clears the in-memory nav cache (e.g. after category changes in dev). */
export function clearNavItemsCache(): void {
  cachedNavItems = null;
  cacheExpiresAt = 0;
}

export async function getNavItems(baseUrl = 'https://threepiece.us'): Promise<NavItem[]> {
  const now = Date.now();
  if (cachedNavItems && now < cacheExpiresAt) {
    return cachedNavItems;
  }

  const token = import.meta.env.BIGCOMMERCE_ACCESS_TOKEN;
  const storeHash = import.meta.env.BIGCOMMERCE_STORE_HASH;

  if (!token || !storeHash) {
    console.warn('nav-items: missing BIGCOMMERCE_ACCESS_TOKEN or BIGCOMMERCE_STORE_HASH, using fallback nav');
    return fallbackNavItems(baseUrl);
  }

  try {
    const rootParents = await fetchCategories(new URLSearchParams({ 'parent_id:in': '0' }));

    if (!rootParents.length) {
      console.warn('nav-items: no root categories returned from BigCommerce, using fallback nav');
      return fallbackNavItems(baseUrl);
    }

    const matchedParents = TOP_LEVEL_NAV.map((item) => ({
      item,
      parent: rootParents.find((p) => p.name && sameName(p.name, item.name)),
    })).filter((entry) => entry.parent?.category_id);

    const childrenByParentId = new Map<number, CategoryNode[]>();

    await Promise.all(
      matchedParents.map(async ({ parent }) => {
        const categoryId = parent!.category_id!;
        const children = await fetchCategories(
          new URLSearchParams({ 'parent_id:in': String(categoryId) }),
        );
        childrenByParentId.set(categoryId, children);
      }),
    );

    cachedNavItems = buildNavItems(baseUrl, rootParents, childrenByParentId);
    cacheExpiresAt = now + CACHE_TTL_MS;
    return cachedNavItems;
  } catch (error) {
    console.error('nav-items: failed to build nav from BigCommerce:', error);
    return fallbackNavItems(baseUrl);
  }
}
