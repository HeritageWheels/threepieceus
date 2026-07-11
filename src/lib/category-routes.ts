/**
 * Friendly category URLs → BigCommerce collection context.
 * Add entries here and mirror them in vercel.json rewrites for production.
 */
export interface CategoryParent {
  name: string;
  path: string;
}

export interface CategoryRoute {
  /** Public path, e.g. /new-wheels */
  path: string;
  /** BigCommerce category entity ID */
  categoryId: number;
  /** Display name for the collection page */
  name: string;
  /** Top-level nav parent, e.g. Shop */
  parent: CategoryParent;
  /** Show Shop Wheels sidebar filters on this collection */
  wheelFilters?: boolean;
}

/** Category IDs with Shop Wheels filters (kept active when route is disabled) */
export const WHEEL_FILTER_CATEGORY_IDS = [58] as const;

export const CATEGORY_ROUTES: CategoryRoute[] = [
  {
    path: '/new-wheels',
    categoryId: 58,
    name: 'New Wheels',
    parent: { name: 'Shop', path: '/shop' },
    wheelFilters: true,
  },
  {
    path: '/exhaust',
    categoryId: 9349,
    name: 'Exhaust',
    parent: { name: 'Shop', path: '/shop' },
  },
  {
    path: '/suspension',
    categoryId: 971,
    name: 'Suspension',
    parent: { name: 'Shop', path: '/shop' },
  },
];

export function findCategoryRoute(pathname: string): CategoryRoute | undefined {
  return CATEGORY_ROUTES.find((route) => route.path === pathname);
}

export function findCategoryRouteById(categoryId: number): CategoryRoute | undefined {
  return CATEGORY_ROUTES.find((route) => route.categoryId === categoryId);
}

export function supportsWheelFilters(categoryId: number): boolean {
  if (WHEEL_FILTER_CATEGORY_IDS.includes(categoryId as (typeof WHEEL_FILTER_CATEGORY_IDS)[number])) {
    return true;
  }

  return CATEGORY_ROUTES.some(
    (route) => route.categoryId === categoryId && route.wheelFilters === true,
  );
}
