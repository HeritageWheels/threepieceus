import type { NormalizedVehicleFitment } from './normalize-vehicle-fitment';

export interface WheelFilterFieldDefinition {
  key: 'diameter' | 'width' | 'bolt' | 'offset';
  label: string;
  /** BigCommerce productAttributes filter name */
  attribute: string;
  /** Product customFields.name */
  customFieldName: string;
  urlParam: string;
}

export interface WheelFilterSelections {
  diameter?: string;
  width?: string;
  bolt?: string;
  offset?: string;
}

export interface WheelFilterOption {
  value: string;
  productCount?: number;
}

export interface WheelFilterFieldState {
  key: WheelFilterFieldDefinition['key'];
  label: string;
  urlParam: string;
  options: WheelFilterOption[];
  selected: string;
  disabled: boolean;
}

export interface WheelFilterState {
  showSection: boolean;
  fields: WheelFilterFieldState[];
}

export const WHEEL_FILTER_FIELDS: WheelFilterFieldDefinition[] = [
  {
    key: 'diameter',
    label: 'Diameter',
    attribute: 'Diameter',
    customFieldName: 'Diameter',
    urlParam: 'wheel_diameter',
  },
  {
    key: 'width',
    label: 'Width',
    attribute: 'Width',
    customFieldName: 'Width',
    urlParam: 'wheel_width',
  },
  {
    key: 'bolt',
    label: 'Bolt Pattern',
    attribute: 'PCD',
    customFieldName: 'PCD',
    urlParam: 'wheel_bolt',
  },
  {
    key: 'offset',
    label: 'Offset',
    attribute: 'Offset',
    customFieldName: 'Offset',
    urlParam: 'wheel_offset',
  },
];

const CUSTOM_FIELD_PAGE_SIZE = 50;
const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Custom field names are entered per-product in BigCommerce and their casing is
 * inconsistent across the catalog (e.g. "DIAMETER" vs "Diameter"). Canonicalize
 * to a case-insensitive key so detection and aggregation match reliably.
 */
function toCustomFieldKey(name: string): string {
  return name.trim().toUpperCase();
}

interface CustomFieldAggregationCacheEntry {
  expiresAt: number;
  valuesByField: Map<string, Map<string, number>>;
}

const customFieldAggregationCache = new Map<string, CustomFieldAggregationCacheEntry>();

export function parseWheelFilterSelections(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): WheelFilterSelections {
  const selections: WheelFilterSelections = {};

  for (const field of WHEEL_FILTER_FIELDS) {
    const value = searchParams.get(field.urlParam)?.trim();
    if (value) selections[field.key] = value;
  }

  return selections;
}

export function appendWheelFilterParams(
  url: URL,
  selections: WheelFilterSelections,
): void {
  for (const field of WHEEL_FILTER_FIELDS) {
    const value = selections[field.key]?.trim();
    if (value) url.searchParams.set(field.urlParam, value);
    else url.searchParams.delete(field.urlParam);
  }
}

export function hasWheelFilterSelections(selections: WheelFilterSelections): boolean {
  return WHEEL_FILTER_FIELDS.some((field) => Boolean(selections[field.key]?.trim()));
}

export function buildWheelProductAttributes(
  selections: WheelFilterSelections,
): { attribute: string; values: string[] }[] {
  const attributes: { attribute: string; values: string[] }[] = [];

  for (const field of WHEEL_FILTER_FIELDS) {
    const value = selections[field.key]?.trim();
    if (value) {
      attributes.push({ attribute: field.attribute, values: [value] });
    }
  }

  return attributes;
}

export function buildWheelProductAttributesGraphQL(
  selections: WheelFilterSelections,
): string {
  const attributes = buildWheelProductAttributes(selections);
  if (!attributes.length) return '';

  const items = attributes
    .map(
      (entry) =>
        `{ attribute: ${JSON.stringify(entry.attribute)}, values: ${JSON.stringify(entry.values)} }`,
    )
    .join(', ');

  return `productAttributes: [${items}]`;
}

export interface OemFitmentSearchContext {
  categoryId: number;
  categoryEntityIds?: number[];
  brandEntityIds?: number[];
  hideOutOfStock?: boolean;
}

export interface OemFitmentProduct {
  entityId: number;
  name: string;
  path: string;
}

export interface OemFitmentSearchResult {
  totalItems: number;
  products: OemFitmentProduct[];
  appliedAttributes: { attribute: string; values: string[] }[];
}

/**
 * Maps normalized OEM fitment data to BigCommerce productAttributes filters.
 * OEM front + rear values are combined and deduped per spec. Attribute names
 * map to the product custom fields (Diameter, Width, Offset, PCD).
 */
export function buildOemProductAttributeFilters(
  fitments: NormalizedVehicleFitment[],
): { attribute: string; values: string[] }[] {
  const diameters = new Set<string>();
  const widths = new Set<string>();
  const offsets = new Set<string>();
  const boltPatterns = new Set<string>();

  for (const fitment of fitments) {
    for (const value of [...fitment.oem.front.diameters, ...fitment.oem.rear.diameters]) {
      diameters.add(String(value));
    }
    for (const value of [...fitment.oem.front.widths, ...fitment.oem.rear.widths]) {
      widths.add(String(value));
    }
    for (const value of [...fitment.oem.front.offsets, ...fitment.oem.rear.offsets]) {
      offsets.add(String(value));
    }
    const boltPattern = fitment.compatibility.boltPattern?.trim();
    if (boltPattern) boltPatterns.add(boltPattern);
  }

  const filters: { attribute: string; values: string[] }[] = [];
  if (diameters.size) filters.push({ attribute: 'Diameter', values: [...diameters] });
  if (widths.size) filters.push({ attribute: 'Width', values: [...widths] });
  if (offsets.size) filters.push({ attribute: 'Offset', values: [...offsets] });
  if (boltPatterns.size) filters.push({ attribute: 'PCD', values: [...boltPatterns] });

  return filters;
}

/** Searches products matching the vehicle's OEM fitment via productAttributes. */
export async function searchProductsByOemFitment(
  context: OemFitmentSearchContext,
  fitments: NormalizedVehicleFitment[],
): Promise<OemFitmentSearchResult> {
  const appliedAttributes = buildOemProductAttributeFilters(fitments);

  const parts: string[] = [`hideOutOfStock: ${context.hideOutOfStock !== false ? 'true' : 'false'}`];
  const categoryIds = context.categoryEntityIds?.filter((id) => id > 0) ?? [];
  const brandIds = context.brandEntityIds?.filter((id) => id > 0) ?? [];

  if (brandIds.length > 0) {
    parts.push(`brandEntityIds: [${brandIds.join(', ')}]`);
  }

  if (categoryIds.length > 0) {
    parts.push(
      `categoryIdsFilter: { matchBehavior: OR, entityIds: [${categoryIds.join(', ')}] }`,
    );
  } else {
    parts.push(`categoryEntityId: ${context.categoryId}`);
    parts.push('searchSubCategories: true');
  }

  if (appliedAttributes.length) {
    const items = appliedAttributes
      .map(
        (entry) =>
          `{ attribute: ${JSON.stringify(entry.attribute)}, values: ${JSON.stringify(entry.values)} }`,
      )
      .join(', ');
    parts.push(`productAttributes: [${items}]`);
  }

  const filtersGraphQL = `{ ${parts.join(', ')} }`;

  const data = await graphqlFetch(`{
  site {
    search {
      searchProducts(filters: ${filtersGraphQL}) {
        products(first: 50) {
          collectionInfo {
            totalItems
          }
          edges {
            node {
              entityId
              name
              path
            }
          }
        }
      }
    }
  }
}`);

  const productsConnection = (data as {
    data?: {
      site?: {
        search?: {
          searchProducts?: {
            products?: {
              collectionInfo?: { totalItems?: number };
              edges?: { node?: { entityId?: number; name?: string; path?: string } }[];
            };
          };
        };
      };
    };
  })?.data?.site?.search?.searchProducts?.products;

  const products: OemFitmentProduct[] = [];
  for (const edge of productsConnection?.edges ?? []) {
    const node = edge?.node;
    if (!node?.entityId || !node.name) continue;
    products.push({ entityId: node.entityId, name: node.name, path: node.path ?? '' });
  }

  return {
    totalItems: productsConnection?.collectionInfo?.totalItems ?? 0,
    products,
    appliedAttributes,
  };
}

interface WheelFilterSearchContext {
  categoryId: number;
  categoryEntityIds?: number[];
  brandEntityIds?: number[];
  hideOutOfStock: boolean;
  /**
   * Base productAttributes filter applied to every option query (e.g. the OEM
   * fitment of a selected vehicle). Narrows the option lists to products that
   * fit the vehicle, intersected with inventory.
   */
  productAttributeFilters?: { attribute: string; values: string[] }[];
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
    console.error('Wheel filter GraphQL request failed:', data);
    return null;
  }

  return data;
}

function buildWheelSearchFiltersGraphQL(
  context: WheelFilterSearchContext,
  wheelSelections: WheelFilterSelections = {},
): string {
  const parts: string[] = [`hideOutOfStock: ${context.hideOutOfStock ? 'true' : 'false'}`];
  const categoryIds = context.categoryEntityIds?.filter((id) => id > 0) ?? [];
  const brandIds = context.brandEntityIds?.filter((id) => id > 0) ?? [];

  if (brandIds.length > 0) {
    parts.push(`brandEntityIds: [${brandIds.join(', ')}]`);
  }

  if (categoryIds.length > 0) {
    parts.push(
      `categoryIdsFilter: { matchBehavior: OR, entityIds: [${categoryIds.join(', ')}] }`,
    );
  } else {
    parts.push(`categoryEntityId: ${context.categoryId}`);
    parts.push('searchSubCategories: true');
  }

  const attributeEntries = [
    ...buildWheelProductAttributes(wheelSelections),
    ...(context.productAttributeFilters ?? []),
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

function buildWheelFilterCacheKey(
  context: WheelFilterSearchContext,
  wheelSelections: WheelFilterSelections,
): string {
  return JSON.stringify({
    categoryId: context.categoryId,
    categoryEntityIds: context.categoryEntityIds ?? [],
    brandEntityIds: context.brandEntityIds ?? [],
    hideOutOfStock: context.hideOutOfStock,
    productAttributeFilters: context.productAttributeFilters ?? [],
    wheelSelections,
  });
}

function sortWheelOptionValues(a: string, b: string): number {
  const numA = Number(a);
  const numB = Number(b);
  const aIsNum = Number.isFinite(numA) && String(numA) === a;
  const bIsNum = Number.isFinite(numB) && String(numB) === b;

  if (aIsNum && bIsNum) return numA - numB;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function mapCountsToOptions(counts: Map<string, number>): WheelFilterOption[] {
  return [...counts.entries()]
    .map(([value, productCount]) => ({ value, productCount }))
    .sort((a, b) => sortWheelOptionValues(a.value, b.value));
}

function mergeOptionCounts(
  primary: Map<string, number>,
  secondary: Map<string, number>,
): Map<string, number> {
  const merged = new Map(primary);

  for (const [value, count] of secondary) {
    merged.set(value, Math.max(merged.get(value) ?? 0, count));
  }

  return merged;
}

async function fetchCustomFieldNamesFromSample(
  context: WheelFilterSearchContext,
): Promise<Set<string>> {
  const filtersGraphQL = buildWheelSearchFiltersGraphQL(context);
  const data = await graphqlFetch(`{
  site {
    search {
      searchProducts(filters: ${filtersGraphQL}) {
        products(first: ${CUSTOM_FIELD_PAGE_SIZE}) {
          edges {
            node {
              customFields {
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`);

  const names = new Set<string>();
  const edges =
    (data as {
      data?: {
        site?: {
          search?: {
            searchProducts?: {
              products?: {
                edges?: {
                  node?: {
                    customFields?: { edges?: { node?: { name?: string } }[] };
                  };
                }[];
              };
            };
          };
        };
      };
    })?.data?.site?.search?.searchProducts?.products?.edges ?? [];

  for (const edge of edges) {
    for (const customField of edge.node?.customFields?.edges ?? []) {
      if (customField.node?.name) names.add(customField.node.name);
    }
  }

  return names;
}

async function detectAvailableWheelFields(
  context: WheelFilterSearchContext,
): Promise<WheelFilterFieldDefinition[]> {
  const customFieldNames = await fetchCustomFieldNamesFromSample(context);
  const availableKeys = new Set([...customFieldNames].map(toCustomFieldKey));

  return WHEEL_FILTER_FIELDS.filter((field) =>
    availableKeys.has(toCustomFieldKey(field.customFieldName)),
  );
}

type ProductAttributeFilterConnection = {
  pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
  edges?: { node?: { value?: string; productCount?: number } }[];
};

async function fetchProductAttributeFacetOptions(
  context: WheelFilterSearchContext,
  wheelSelections: WheelFilterSelections,
  attributeName: string,
): Promise<Map<string, number>> {
  const filtersGraphQL = buildWheelSearchFiltersGraphQL(context, wheelSelections);
  const counts = new Map<string, number>();
  let after: string | null = null;

  for (;;) {
    const afterArg = after ? `, after: ${JSON.stringify(after)}` : '';
    const data = await graphqlFetch(`{
  site {
    search {
      searchProducts(filters: ${filtersGraphQL}) {
        filters {
          edges {
            node {
              __typename
              ... on ProductAttributeSearchFilter {
                name
                attributes(first: 50${afterArg}) {
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                  edges {
                    node {
                      value
                      productCount
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
}`);

    if (!data) break;

    const filterEdges =
      (data as {
        data?: {
          site?: {
            search?: {
              searchProducts?: {
                filters?: {
                  edges?: {
                    node?: {
                      __typename?: string;
                      name?: string;
                      attributes?: ProductAttributeFilterConnection;
                    };
                  }[];
                };
              };
            };
          };
        };
      })?.data?.site?.search?.searchProducts?.filters?.edges ?? [];

    const attributeFilter = filterEdges.find(
      (edge) =>
        edge.node?.__typename === 'ProductAttributeSearchFilter' &&
        edge.node.name === attributeName,
    )?.node?.attributes;

    if (!attributeFilter) break;

    for (const edge of attributeFilter.edges ?? []) {
      const value = edge.node?.value?.trim();
      if (!value) continue;
      counts.set(value, edge.node?.productCount ?? counts.get(value) ?? 0);
    }

    if (!attributeFilter.pageInfo?.hasNextPage) break;
    after = attributeFilter.pageInfo.endCursor ?? null;
    if (!after) break;
  }

  return counts;
}

async function fetchAllCustomFieldValuesFromCollection(
  context: WheelFilterSearchContext,
  wheelSelections: WheelFilterSelections,
  customFieldNames: string[],
): Promise<Map<string, Map<string, number>>> {
  const cacheKey = buildWheelFilterCacheKey(context, wheelSelections);
  const cached = customFieldAggregationCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.valuesByField;
  }

  const filtersGraphQL = buildWheelSearchFiltersGraphQL(context, wheelSelections);
  const valuesByField = new Map<string, Map<string, number>>();

  for (const name of customFieldNames) {
    valuesByField.set(toCustomFieldKey(name), new Map());
  }

  let after: string | null = null;

  for (;;) {
    const afterArg = after ? `, after: ${JSON.stringify(after)}` : '';
    const data = await graphqlFetch(`{
  site {
    search {
      searchProducts(filters: ${filtersGraphQL}) {
        products(first: ${CUSTOM_FIELD_PAGE_SIZE}${afterArg}) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              customFields {
                edges {
                  node {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`);

    if (!data) break;

    const productsConnection = (data as {
      data?: {
        site?: {
          search?: {
            searchProducts?: {
              products?: {
                pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
                edges?: {
                  node?: {
                    customFields?: { edges?: { node?: { name?: string; value?: string } }[] };
                  };
                }[];
              };
            };
          };
        };
      };
    })?.data?.site?.search?.searchProducts?.products;

    for (const edge of productsConnection?.edges ?? []) {
      for (const customField of edge.node?.customFields?.edges ?? []) {
        const name = customField.node?.name;
        const value = customField.node?.value?.trim();
        if (!name || !value) continue;

        const fieldCounts = valuesByField.get(toCustomFieldKey(name));
        if (!fieldCounts) continue;
        fieldCounts.set(value, (fieldCounts.get(value) ?? 0) + 1);
      }
    }

    if (!productsConnection?.pageInfo?.hasNextPage) break;
    after = productsConnection.pageInfo.endCursor ?? null;
    if (!after) break;
  }

  customFieldAggregationCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    valuesByField,
  });

  return valuesByField;
}

async function fetchWheelFieldOptions(
  context: WheelFilterSearchContext,
  wheelSelections: WheelFilterSelections,
  field: WheelFilterFieldDefinition,
  availableCustomFieldNames: string[],
): Promise<WheelFilterOption[]> {
  const facetCounts = await fetchProductAttributeFacetOptions(
    context,
    wheelSelections,
    field.attribute,
  );

  // Paginate products for custom fields when prior wheel filters narrow the
  // result set. Unfiltered scans of huge categories cannot finish on SSR.
  let customFieldCounts = new Map<string, number>();
  const hasPriorWheelFilters = hasWheelFilterSelections(wheelSelections);

  if (hasPriorWheelFilters || facetCounts.size === 0) {
    const aggregation = await fetchAllCustomFieldValuesFromCollection(
      context,
      wheelSelections,
      availableCustomFieldNames,
    );
    customFieldCounts = new Map(aggregation.get(toCustomFieldKey(field.customFieldName)) ?? []);
  }

  return mapCountsToOptions(mergeOptionCounts(customFieldCounts, facetCounts));
}

function buildPriorWheelSelections(
  availableFields: WheelFilterFieldDefinition[],
  fieldIndex: number,
  selections: WheelFilterSelections,
): WheelFilterSelections {
  const prior: WheelFilterSelections = {};

  for (const field of availableFields.slice(0, fieldIndex)) {
    const value = selections[field.key]?.trim();
    if (value) prior[field.key] = value;
  }

  return prior;
}

function normalizeAttributeValue(value: string): string {
  const trimmed = value.trim();
  const num = Number(trimmed);
  return Number.isFinite(num) && trimmed !== '' ? String(num) : trimmed.toLowerCase();
}

/**
 * When a vehicle (YMM) is selected, restrict a field's inventory options to the
 * OEM fitment values for that attribute (inventory ∩ vehicle). Matching is
 * numeric-aware so "17" and "17.0" collapse to the same value.
 */
function constrainOptionsToOemValues(
  options: WheelFilterOption[],
  oemValues: string[] | undefined,
): WheelFilterOption[] {
  if (!oemValues?.length) return options;
  const allowed = new Set(oemValues.map(normalizeAttributeValue));
  return options.filter((option) => allowed.has(normalizeAttributeValue(option.value)));
}

export async function getWheelFilterState(
  context: WheelFilterSearchContext,
  selections: WheelFilterSelections,
): Promise<WheelFilterState> {
  const availableFields = await detectAvailableWheelFields(context);

  if (!availableFields.length) {
    return { showSection: false, fields: [] };
  }

  const oemValuesByAttribute = new Map(
    (context.productAttributeFilters ?? []).map((entry) => [entry.attribute, entry.values]),
  );
  const availableCustomFieldNames = availableFields.map((field) => field.customFieldName);
  const fields: WheelFilterFieldState[] = [];

  for (let index = 0; index < availableFields.length; index += 1) {
    const field = availableFields[index];
    const requiredPrior = availableFields.slice(0, index);
    const disabled = requiredPrior.some((priorField) => !selections[priorField.key]?.trim());
    const selected = selections[field.key]?.trim() ?? '';
    let options: WheelFilterOption[] = [];

    if (!disabled) {
      const priorSelections = buildPriorWheelSelections(availableFields, index, selections);
      options = await fetchWheelFieldOptions(
        context,
        priorSelections,
        field,
        availableCustomFieldNames,
      );
      options = constrainOptionsToOemValues(options, oemValuesByAttribute.get(field.attribute));
    }

    fields.push({
      key: field.key,
      label: field.label,
      urlParam: field.urlParam,
      options,
      selected,
      disabled,
    });
  }

  return {
    showSection: true,
    fields,
  };
}
