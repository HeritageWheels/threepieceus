import { findCategoryRouteById, supportsWheelFilters } from './category-routes';
import { appendVehicleUrlParams, parseVehicleUrlParams } from './vehicle-url-params';
import {
  appendWheelFilterParams,
  buildWheelProductAttributes,
  hasWheelFilterSelections,
  type WheelFilterSelections,
} from './wheel-filters';

export interface ProductAttributeFilter {
  attribute: string;
  values: string[];
}

export const COLLECTION_PAGE_SIZE = 30;
const PAGE_SIZE = COLLECTION_PAGE_SIZE;

export type CategoryProductSort =
  | 'DEFAULT'
  | 'A_TO_Z'
  | 'Z_TO_A'
  | 'LOWEST_PRICE'
  | 'HIGHEST_PRICE'
  | 'FEATURED'
  | 'NEWEST'
  | 'BEST_SELLING'
  | 'BEST_REVIEWED'
  | 'RELEVANCE';

/** Valid values for searchProducts(sort: ...). */
type SearchProductsSort =
  | 'A_TO_Z'
  | 'Z_TO_A'
  | 'LOWEST_PRICE'
  | 'HIGHEST_PRICE'
  | 'RELEVANCE'
  | 'FEATURED'
  | 'NEWEST'
  | 'BEST_SELLING'
  | 'BEST_REVIEWED';

const CATEGORY_SORT_TO_SEARCH_SORT: Record<string, SearchProductsSort> = {
  DEFAULT: 'RELEVANCE',
  BEST_MATCH: 'RELEVANCE',
  RELEVANCE: 'RELEVANCE',
  FEATURED: 'FEATURED',
  A_TO_Z: 'A_TO_Z',
  Z_TO_A: 'Z_TO_A',
  LOWEST_PRICE: 'LOWEST_PRICE',
  HIGHEST_PRICE: 'HIGHEST_PRICE',
  NEWEST: 'NEWEST',
  BEST_SELLING: 'BEST_SELLING',
  BEST_REVIEWED: 'BEST_REVIEWED',
};

const BRAND_FACET_PAGE_SIZE = 50;

/** User-facing sort; BEST_MATCH uses the category's defaultProductSort from BigCommerce. */
export type CollectionSortBy =
  | 'BEST_MATCH'
  | Exclude<CategoryProductSort, 'DEFAULT' | 'FEATURED'>;

export const DEFAULT_COLLECTION_SORT: CollectionSortBy = 'BEST_MATCH';

export const COLLECTION_SORT_OPTIONS: { label: string; value: CollectionSortBy }[] = [
  { label: 'Best Match', value: 'BEST_MATCH' },
  { label: 'A to Z', value: 'A_TO_Z' },
  { label: 'Z to A', value: 'Z_TO_A' },
  { label: 'Price: Low to High', value: 'LOWEST_PRICE' },
  { label: 'Price: High to Low', value: 'HIGHEST_PRICE' },
];

const VALID_SORT_VALUES = new Set<string>(COLLECTION_SORT_OPTIONS.map((o) => o.value));

const SORT_ALIASES: Record<string, CollectionSortBy> = {
  DEFAULT: 'BEST_MATCH',
  FEATURED: 'BEST_MATCH',
  BEST_MATCH: 'BEST_MATCH',
};

export function parseCollectionSort(value: string | null | undefined): CollectionSortBy {
  const normalized = value?.trim().toUpperCase().replace(/-/g, '_');
  if (!normalized) return DEFAULT_COLLECTION_SORT;

  if (SORT_ALIASES[normalized]) return SORT_ALIASES[normalized];
  if (VALID_SORT_VALUES.has(normalized)) return normalized as CollectionSortBy;

  return DEFAULT_COLLECTION_SORT;
}

export interface CollectionProduct {
  entityId: number;
  name: string;
  href: string;
  imageUrl: string;
  imageAlt: string;
  priceFormatted: string;
}

export interface CollectionPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor: string | null;
  startCursor: string | null;
}

export interface CollectionProductsPagination {
  after?: string | null;
  before?: string | null;
}

export type CollectionStockFilter = 'in' | 'out';

export interface CollectionProductFilters {
  categoryEntityIds?: number[];
  brandEntityIds?: number[];
  stock?: CollectionStockFilter;
  wheelFilters?: WheelFilterSelections;
  /** Extra productAttributes (e.g. from vehicle OEM fitment). Merged with wheelFilters. */
  productAttributes?: ProductAttributeFilter[];
}

export interface CollectionFacetOption {
  entityId: number;
  name: string;
  productCount: number;
  isSelected: boolean;
  /** URL/checkbox value when it differs from entityId (e.g. stock uses in/out). */
  value?: string;
}

export interface CollectionFacets {
  categories: CollectionFacetOption[];
  brands: CollectionFacetOption[];
  stock: CollectionFacetOption[];
}

const STOCK_FACET_IN_ID = 1;
const STOCK_FACET_OUT_ID = 2;
const DEFAULT_STOCK_FILTER: CollectionStockFilter = 'in';
const OUT_OF_STOCK_FETCH_MAX_PAGES = 8;

export const COLLECTION_FACET_VISIBLE_LIMIT = 10;

export interface CollectionCategoryInfo {
  name: string;
  description: string;
  pageTitle: string;
  metaDescription: string;
}

export interface CollectionProductsResult {
  products: CollectionProduct[];
  totalItems: number;
  pageSize: number;
  pageInfo: CollectionPageInfo;
  category: CollectionCategoryInfo | null;
  facets: CollectionFacets;
}

export function buildCollectionPageUrl(
  baseUrl: URL,
  updates: Record<string, string | number | null | undefined>,
): string {
  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === '') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, String(value));
    }
  }

  url.searchParams.delete('page');

  const query = url.searchParams.toString();
  return query ? `${url.pathname}?${query}` : url.pathname;
}

/** Use friendly category path for pagination when available (e.g. /new-wheels). */
export function getCollectionPaginationBaseUrl(requestUrl: URL, categoryId: number): URL {
  const friendlyRoute = findCategoryRouteById(categoryId);
  const url = friendlyRoute
    ? new URL(friendlyRoute.path, requestUrl.origin)
    : new URL(requestUrl.pathname, requestUrl.origin);

  if (!friendlyRoute) {
    for (const key of ['categoryId', 'name', 'parentName', 'parentPath'] as const) {
      const value = requestUrl.searchParams.get(key);
      if (value) url.searchParams.set(key, value);
    }
  }

  const sort = requestUrl.searchParams.get('sort');
  if (sort) url.searchParams.set('sort', sort);

  const categories = requestUrl.searchParams.get('categories');
  if (categories) url.searchParams.set('categories', categories);

  const brands = requestUrl.searchParams.get('brands');
  if (brands) url.searchParams.set('brands', brands);

  const stock = requestUrl.searchParams.get('stock');
  if (stock === 'out') url.searchParams.set('stock', 'out');

  if (supportsWheelFilters(categoryId)) {
    appendWheelFilterParams(url, {
      diameter: requestUrl.searchParams.get('wheel_diameter') ?? undefined,
      width: requestUrl.searchParams.get('wheel_width') ?? undefined,
      bolt: requestUrl.searchParams.get('wheel_bolt') ?? undefined,
      offset: requestUrl.searchParams.get('wheel_offset') ?? undefined,
    });
  }

  appendVehicleUrlParams(url, parseVehicleUrlParams(requestUrl.searchParams));

  return url;
}

export function parseCollectionStockFilter(
  value: string | null | undefined,
): CollectionStockFilter {
  if (!value?.trim()) return DEFAULT_STOCK_FILTER;

  const normalized = value.trim().toLowerCase();
  return normalized === 'out' ? 'out' : DEFAULT_STOCK_FILTER;
}

export function parseCollectionFilterIds(value: string | null | undefined): number[] {
  if (!value?.trim()) return [];

  const ids = new Set<number>();
  for (const part of value.split(',')) {
    const id = Number(part.trim());
    if (Number.isFinite(id) && id > 0) ids.add(id);
  }

  return [...ids];
}

interface CategoryMeta {
  name: string;
  description: string;
  pageTitle: string;
  metaDescription: string;
  defaultProductSort: CategoryProductSort;
  productCount: number | null;
}

interface GraphQLProductNode {
  entityId?: number;
  name?: string;
  path?: string;
  defaultImage?: {
    urlOriginal?: string;
    altText?: string;
  };
  prices?: {
    price?: {
      formatted?: string;
    };
  };
  inventory?: {
    isInStock?: boolean;
  };
}

interface StockSelection {
  stock: CollectionStockFilter;
  isInStockOnly: boolean;
  isOutOfStockOnly: boolean;
}

function getStockSelection(productFilters: CollectionProductFilters): StockSelection {
  const stock = productFilters.stock ?? DEFAULT_STOCK_FILTER;

  return {
    stock,
    isInStockOnly: stock === 'in',
    isOutOfStockOnly: stock === 'out',
  };
}

function toProductHref(baseUrl: string, path: string | undefined): string {
  if (!path) return baseUrl;
  return path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function toSearchProductsSort(
  sortBy: CollectionSortBy,
  categoryDefaultSort: CategoryProductSort | string | undefined,
): SearchProductsSort {
  if (sortBy !== 'BEST_MATCH') {
    const explicit = CATEGORY_SORT_TO_SEARCH_SORT[sortBy];
    if (explicit) return explicit;
  }

  const normalized = String(categoryDefaultSort ?? 'DEFAULT')
    .trim()
    .toUpperCase()
    .replace(/-/g, '_');

  return CATEGORY_SORT_TO_SEARCH_SORT[normalized] ?? 'RELEVANCE';
}

function buildProductsPaginationArgs(pagination: CollectionProductsPagination): string {
  const before = pagination.before?.trim();
  const after = pagination.after?.trim();

  if (before) {
    return `last: ${PAGE_SIZE}, before: ${JSON.stringify(before)}`;
  }

  if (after) {
    return `first: ${PAGE_SIZE}, after: ${JSON.stringify(after)}`;
  }

  return `first: ${PAGE_SIZE}`;
}

function buildSearchFiltersGraphQL(
  rootCategoryId: number,
  productFilters: CollectionProductFilters = {},
  options: { applyStockFilter?: boolean } = {},
): string {
  const parts: string[] = [];
  const categoryIds = productFilters.categoryEntityIds?.filter((id) => id > 0) ?? [];
  const brandIds = productFilters.brandEntityIds?.filter((id) => id > 0) ?? [];

  if (brandIds.length > 0) {
    parts.push(`brandEntityIds: [${brandIds.join(', ')}]`);
  }

  if (categoryIds.length > 0) {
    parts.push(
      `categoryIdsFilter: { matchBehavior: OR, entityIds: [${categoryIds.join(', ')}] }`,
    );
  } else {
    parts.push(`categoryEntityId: ${rootCategoryId}`);
    parts.push('searchSubCategories: true');
  }

  if (options.applyStockFilter !== false) {
    const { isInStockOnly } = getStockSelection(productFilters);
    parts.push(`hideOutOfStock: ${isInStockOnly ? 'true' : 'false'}`);
  }

  const attributeEntries = [
    ...buildWheelProductAttributes(productFilters.wheelFilters ?? {}),
    ...(productFilters.productAttributes ?? []),
  ].filter((entry) => entry.values.length > 0);

  if (attributeEntries.length) {
    const items = attributeEntries
      .map(
        (entry) =>
          `{ attribute: ${JSON.stringify(entry.attribute)}, values: ${JSON.stringify(entry.values)} }`,
      )
      .join(', ');
    parts.push(`productAttributes: [${items}]`);
  }

  return `{ ${parts.join(', ')} }`;
}

function buildCategoryMetaQuery(categoryId: number): string {
  return `{
  site {
    category(entityId: ${categoryId}) {
      name
      description
      defaultProductSort
      seo {
        pageTitle
        metaDescription
      }
    }
    categoryTree(rootEntityId: ${categoryId}) {
      entityId
      productCount
      children {
        entityId
        name
        productCount
      }
    }
  }
}`;
}

function buildCollectionProductsQuery(
  categoryId: number,
  searchSort: SearchProductsSort,
  productFilters: CollectionProductFilters,
  pagination: CollectionProductsPagination,
  options: { includeInventory?: boolean } = {},
): string {
  const searchFilters = buildSearchFiltersGraphQL(categoryId, productFilters);
  const inventoryField = options.includeInventory
    ? `
              inventory {
                isInStock
              }`
    : '';

  return `{
  site {
    search {
      searchProducts(
        sort: ${searchSort},
        filters: ${searchFilters}
      ) {
        products(${buildProductsPaginationArgs(pagination)}) {
          collectionInfo {
            totalItems
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          edges {
            node {
              entityId
              name
              path
              defaultImage {
                altText
                urlOriginal
              }
              prices {
                price {
                  formatted
                }
              }${inventoryField}
            }
          }
        }
      }
    }
  }
}`;
}

function buildBrandFacetsQuery(
  categoryId: number,
  productFilters: CollectionProductFilters,
  after: string | null = null,
): string {
  const searchFilters = buildSearchFiltersGraphQL(categoryId, productFilters);
  const afterArg = after ? `, after: ${JSON.stringify(after)}` : '';

  return `{
  site {
    search {
      searchProducts(filters: ${searchFilters}) {
        filters {
          edges {
            node {
              ... on BrandSearchFilter {
                brands(first: ${BRAND_FACET_PAGE_SIZE}${afterArg}) {
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                  edges {
                    node {
                      entityId
                      name
                      productCount
                      isSelected
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`;
}

async function fetchAllBrandFacets(
  categoryId: number,
  productFilters: CollectionProductFilters,
  selectedBrandIds: Set<number>,
): Promise<CollectionFacetOption[]> {
  const brands: CollectionFacetOption[] = [];
  let after: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await graphqlFetch(buildBrandFacetsQuery(categoryId, productFilters, after));
    if (!data) break;

    const brandConnection = (data as {
      data?: {
        site?: {
          search?: {
            searchProducts?: {
              filters?: {
                edges?: {
                  node?: {
                    brands?: {
                      pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
                      edges?: {
                        node?: {
                          entityId?: number;
                          name?: string;
                          productCount?: number;
                          isSelected?: boolean;
                        };
                      }[];
                    };
                  };
                }[];
              };
            };
          };
        };
      };
    })?.data?.site?.search?.searchProducts?.filters?.edges?.find(
      (edge) => edge.node?.brands,
    )?.node?.brands;

    const edges = brandConnection?.edges ?? [];
    for (const edge of edges) {
      const node = edge.node;
      if (!node?.entityId || !node.name || (node.productCount ?? 0) <= 0) continue;

      brands.push({
        entityId: node.entityId,
        name: node.name,
        productCount: node.productCount ?? 0,
        isSelected: selectedBrandIds.has(node.entityId) || (node.isSelected ?? false),
      });
    }

    hasNextPage = brandConnection?.pageInfo?.hasNextPage ?? false;
    after = brandConnection?.pageInfo?.endCursor ?? null;
    if (hasNextPage && !after) break;
  }

  return brands.sort((a, b) => a.name.localeCompare(b.name));
}

function buildStockFacetCountsQuery(
  categoryId: number,
  productFilters: CollectionProductFilters,
): string {
  const baseFilters = buildSearchFiltersGraphQL(categoryId, productFilters, {
    applyStockFilter: false,
  });

  return `{
  site {
    search {
      allProducts: searchProducts(filters: { ${baseFilters.slice(2, -2)}, hideOutOfStock: false }) {
        products {
          collectionInfo {
            totalItems
          }
        }
      }
      inStockProducts: searchProducts(filters: { ${baseFilters.slice(2, -2)}, hideOutOfStock: true }) {
        products {
          collectionInfo {
            totalItems
          }
        }
      }
    }
  }
}`;
}

async function fetchStockFacets(
  categoryId: number,
  productFilters: CollectionProductFilters,
): Promise<CollectionFacetOption[]> {
  const data = await graphqlFetch(buildStockFacetCountsQuery(categoryId, productFilters));
  if (!data) return [];

  const search = (data as {
    data?: {
      site?: {
        search?: {
          allProducts?: { products?: { collectionInfo?: { totalItems?: number } } };
          inStockProducts?: { products?: { collectionInfo?: { totalItems?: number } } };
        };
      };
    };
  })?.data?.site?.search;

  const allCount = search?.allProducts?.products?.collectionInfo?.totalItems ?? 0;
  const inCount = search?.inStockProducts?.products?.collectionInfo?.totalItems ?? 0;
  const outCount = Math.max(allCount - inCount, 0);
  const stock = productFilters.stock ?? DEFAULT_STOCK_FILTER;

  return [
    {
      entityId: STOCK_FACET_IN_ID,
      value: 'in',
      name: 'In Stock',
      productCount: inCount,
      isSelected: stock === 'in',
    },
    {
      entityId: STOCK_FACET_OUT_ID,
      value: 'out',
      name: 'Out of Stock',
      productCount: outCount,
      isSelected: stock === 'out',
    },
  ];
}

function parseProductsResponse(
  data: unknown,
  storeBaseUrl: string,
  options: { outOfStockOnly?: boolean } = {},
): {
  products: CollectionProduct[];
  pageInfo: CollectionPageInfo;
  totalItems: number | null;
} {
  const productsConnection = (data as {
    data?: {
      site?: {
        search?: {
          searchProducts?: {
            products?: {
              collectionInfo?: { totalItems?: number };
              edges?: { node?: GraphQLProductNode }[];
              pageInfo?: {
                hasNextPage?: boolean;
                hasPreviousPage?: boolean;
                startCursor?: string | null;
                endCursor?: string | null;
              };
            };
          };
        };
      };
    };
  })?.data?.site?.search?.searchProducts?.products;

  const edges = productsConnection?.edges ?? [];
  const products: CollectionProduct[] = [];

  for (const edge of edges) {
    const node = edge?.node;
    if (!node?.entityId || !node.name) continue;
    if (options.outOfStockOnly && node.inventory?.isInStock !== false) continue;

    products.push({
      entityId: node.entityId,
      name: node.name,
      href: toProductHref(storeBaseUrl, node.path),
      imageUrl: node.defaultImage?.urlOriginal ?? '',
      imageAlt: node.defaultImage?.altText ?? node.name,
      priceFormatted: node.prices?.price?.formatted ?? '',
    });
  }

  const pageInfo = productsConnection?.pageInfo;

  return {
    products,
    totalItems: productsConnection?.collectionInfo?.totalItems ?? null,
    pageInfo: {
      hasNextPage: pageInfo?.hasNextPage ?? false,
      hasPreviousPage: pageInfo?.hasPreviousPage ?? false,
      startCursor: pageInfo?.startCursor ?? null,
      endCursor: pageInfo?.endCursor ?? null,
    },
  };
}

function parseCategoryFacets(
  data: unknown,
  selectedCategoryIds: Set<number>,
): CollectionFacetOption[] {
  const children = (data as {
    data?: {
      site?: {
        categoryTree?: {
          children?: {
            entityId?: number;
            name?: string;
            productCount?: number;
          }[];
        }[];
      };
    };
  })?.data?.site?.categoryTree?.[0]?.children ?? [];

  return children
    .filter((child) => child.entityId && child.name && (child.productCount ?? 0) > 0)
    .map((child) => ({
      entityId: child.entityId!,
      name: child.name!,
      productCount: child.productCount ?? 0,
      isSelected: selectedCategoryIds.has(child.entityId!),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function emptyResult(): CollectionProductsResult {
  return {
    products: [],
    totalItems: 0,
    pageSize: PAGE_SIZE,
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    },
    category: null,
    facets: { categories: [], brands: [], stock: [] },
  };
}

async function fetchOutOfStockProductsPage(
  categoryId: number,
  searchSort: SearchProductsSort,
  productFilters: CollectionProductFilters,
  pagination: CollectionProductsPagination,
  storeBaseUrl: string,
): Promise<{
  products: CollectionProduct[];
  pageInfo: CollectionPageInfo;
  totalItems: number | null;
}> {
  let after = pagination.before ? null : pagination.after?.trim() || null;
  let pageInfo: CollectionPageInfo = {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
  };
  const products: CollectionProduct[] = [];

  for (let page = 0; page < OUT_OF_STOCK_FETCH_MAX_PAGES && products.length < PAGE_SIZE; page += 1) {
    const data = await graphqlFetch(
      buildCollectionProductsQuery(categoryId, searchSort, productFilters, { after }, {
        includeInventory: true,
      }),
    );
    if (!data) break;

    const parsed = parseProductsResponse(data, storeBaseUrl, { outOfStockOnly: true });
    products.push(...parsed.products);
    pageInfo = parsed.pageInfo;

    if (!parsed.pageInfo.hasNextPage || !parsed.pageInfo.endCursor) break;
    after = parsed.pageInfo.endCursor;
  }

  return {
    products: products.slice(0, PAGE_SIZE),
    pageInfo,
    totalItems: null,
  };
}

function toCategoryInfo(meta: CategoryMeta): CollectionCategoryInfo {
  return {
    name: meta.name,
    description: meta.description,
    pageTitle: meta.pageTitle,
    metaDescription: meta.metaDescription,
  };
}

function parseCategoryMeta(data: unknown, categoryId: number): CategoryMeta {
  const site = (data as {
    data?: {
      site?: {
        category?: {
          name?: string;
          description?: string;
          defaultProductSort?: CategoryProductSort;
          seo?: {
            pageTitle?: string;
            metaDescription?: string;
          };
        };
        categoryTree?: {
          entityId?: number;
          productCount?: number;
        }[];
      };
    };
  })?.data?.site;

  const category = site?.category;
  const tree = site?.categoryTree;
  const root = tree?.find((node) => node.entityId === categoryId) ?? tree?.[0];

  return {
    name: category?.name?.trim() ?? '',
    description: category?.description?.trim() ?? '',
    pageTitle: category?.seo?.pageTitle?.trim() ?? '',
    metaDescription: category?.seo?.metaDescription?.trim() ?? '',
    defaultProductSort: category?.defaultProductSort ?? 'DEFAULT',
    productCount: root?.productCount ?? null,
  };
}

async function graphqlFetch(query: string): Promise<unknown> {
  const graphqlUrl = import.meta.env.BIGCOMMERCE_GRAPHQL_URL;
  const graphqlToken = import.meta.env.BIGCOMMERCE_GRAPHQL_TOKEN;

  if (!graphqlUrl || !graphqlToken) return null;

  const res = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${graphqlToken}`,
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || (data as { errors?: unknown[] })?.errors?.length) {
    console.error('GraphQL request failed:', data);
    return null;
  }

  return data;
}

export async function getCollectionProducts(
  categoryId: number,
  storeBaseUrl = 'https://threepiece.us',
  sortBy: CollectionSortBy = DEFAULT_COLLECTION_SORT,
  includeSubCategories = true,
  pagination: CollectionProductsPagination = {},
  productFilters: CollectionProductFilters = {},
): Promise<CollectionProductsResult> {
  void includeSubCategories;

  try {
    const selectedCategoryIds = new Set(productFilters.categoryEntityIds ?? []);
    const selectedBrandIds = new Set(productFilters.brandEntityIds ?? []);
    const stockSelection = getStockSelection(productFilters);

    const metaData = await graphqlFetch(buildCategoryMetaQuery(categoryId));
    if (!metaData) return emptyResult();

    const metaFromPage = parseCategoryMeta(metaData, categoryId);
    const searchSort = toSearchProductsSort(sortBy, metaFromPage.defaultProductSort);

    const [productsData, brands, stock] = await Promise.all([
      stockSelection.isOutOfStockOnly
        ? fetchOutOfStockProductsPage(
            categoryId,
            searchSort,
            productFilters,
            pagination,
            storeBaseUrl,
          ).then((result) => ({ outOfStockResult: result }))
        : graphqlFetch(
            buildCollectionProductsQuery(categoryId, searchSort, productFilters, {
              after: pagination.after,
              before: pagination.before,
            }),
          ).then((data) => ({ data })),
      fetchAllBrandFacets(categoryId, productFilters, selectedBrandIds),
      fetchStockFacets(categoryId, productFilters),
    ]);

    let products: CollectionProduct[] = [];
    let pageInfo: CollectionPageInfo = emptyResult().pageInfo;
    let filteredTotalItems: number | null = null;

    if ('outOfStockResult' in productsData) {
      products = productsData.outOfStockResult.products;
      pageInfo = productsData.outOfStockResult.pageInfo;
      filteredTotalItems = stock.find((option) => option.value === 'out')?.productCount ?? null;
    } else if (productsData.data) {
      const parsed = parseProductsResponse(productsData.data, storeBaseUrl);
      products = parsed.products;
      pageInfo = parsed.pageInfo;
      filteredTotalItems = parsed.totalItems;
    } else {
      return emptyResult();
    }

    const categories = parseCategoryFacets(metaData, selectedCategoryIds);
    const facets: CollectionFacets = { categories, brands, stock };
    const hasActiveFilters =
      (productFilters.categoryEntityIds?.length ?? 0) > 0 ||
      (productFilters.brandEntityIds?.length ?? 0) > 0 ||
      stockSelection.isOutOfStockOnly ||
      hasWheelFilterSelections(productFilters.wheelFilters ?? {}) ||
      (productFilters.productAttributes?.length ?? 0) > 0;

    const filteredCount = filteredTotalItems ?? 0;
    const totalItems = hasActiveFilters
      ? stockSelection.isOutOfStockOnly
        ? Math.max(filteredCount, products.length)
        : filteredCount || products.length
      : metaFromPage.productCount ?? filteredTotalItems ?? products.length;

    return {
      products,
      totalItems,
      pageSize: PAGE_SIZE,
      pageInfo,
      category: metaFromPage.name ? toCategoryInfo(metaFromPage) : null,
      facets,
    };
  } catch (err) {
    console.error('Failed to fetch collection products:', err);
    return emptyResult();
  }
}
