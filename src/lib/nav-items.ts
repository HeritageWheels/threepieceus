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
  children: { name: string; href: string }[];
}

export interface NavItem {
  name: string;
  href: string;
  children: NavChild[];
}

const CACHE_TTL_MS = 60 * 60 * 1000;
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

async function fetchAllCategories(): Promise<CategoryNode[]> {
  const token = import.meta.env.BIGCOMMERCE_ACCESS_TOKEN;
  const storeHash = import.meta.env.BIGCOMMERCE_STORE_HASH;
  if (!token || !storeHash) return [];

  const all: CategoryNode[] = [];
  let page = 1;

  while (page <= 10) {
    const query = new URLSearchParams({
      limit: '250',
      is_visible: 'true',
      page: String(page),
    });
    const url = `https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/trees/categories?${query}`;

    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Auth-Token': token,
      },
    });

    if (!res.ok) break;

    const batch = parseCategoryList(await res.json());
    all.push(...batch.filter((n) => n.name));

    if (batch.length < 250) break;
    page += 1;
  }

  return all;
}

function buildNavItems(baseUrl: string, categories: CategoryNode[]): NavItem[] {
  const childrenByParent = new Map<number, CategoryNode[]>();

  for (const category of categories) {
    const parentId = category.parent_id ?? 0;
    const siblings = childrenByParent.get(parentId);
    if (siblings) {
      siblings.push(category);
    } else {
      childrenByParent.set(parentId, [category]);
    }
  }

  const rootCategories = childrenByParent.get(0) ?? [];

  return TOP_LEVEL_NAV.map((item) => {
    const parent = rootCategories.find((p) => p.name && sameName(p.name, item.name));

    if (!parent?.category_id) {
      return {
        name: item.name,
        href: `${baseUrl}${item.path.replace(/^\/?/, '/')}`,
        children: [],
      };
    }

    const children = (childrenByParent.get(parent.category_id) ?? []).map((node) => ({
      name: node.name!,
      href: toHref(baseUrl, node.url?.path),
      category_id: node.category_id,
      children: (node.category_id
        ? (childrenByParent.get(node.category_id) ?? [])
        : []
      ).map((sub) => ({
        name: sub.name!,
        href: toHref(baseUrl, sub.url?.path),
      })),
    }));

    return {
      name: item.name,
      href: toHref(baseUrl, parent.url?.path),
      children,
    };
  });
}

export async function getNavItems(baseUrl = 'https://threepiece.us'): Promise<NavItem[]> {
  const now = Date.now();
  if (cachedNavItems && now < cacheExpiresAt) {
    return cachedNavItems;
  }

  try {
    const categories = await fetchAllCategories();
    if (!categories.length) {
      cachedNavItems = fallbackNavItems(baseUrl);
    } else {
      cachedNavItems = buildNavItems(baseUrl, categories);
    }
  } catch {
    cachedNavItems = fallbackNavItems(baseUrl);
  }

  cacheExpiresAt = now + CACHE_TTL_MS;
  return cachedNavItems;
}
