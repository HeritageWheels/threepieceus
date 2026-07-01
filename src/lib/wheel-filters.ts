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

interface WheelFilterSearchContext {
  categoryId: number;
  categoryEntityIds?: number[];
  brandEntityIds?: number[];
  hideOutOfStock: boolean;
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

  const wheelAttributesGraphQL = buildWheelProductAttributesGraphQL(wheelSelections);
  if (wheelAttributesGraphQL) parts.push(wheelAttributesGraphQL);

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

  return WHEEL_FILTER_FIELDS.filter((field) => customFieldNames.has(field.customFieldName));
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
    valuesByField.set(name, new Map());
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

        const fieldCounts = valuesByField.get(name);
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
    customFieldCounts = new Map(aggregation.get(field.customFieldName) ?? []);
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

export async function getWheelFilterState(
  context: WheelFilterSearchContext,
  selections: WheelFilterSelections,
): Promise<WheelFilterState> {
  const availableFields = await detectAvailableWheelFields(context);

  if (!availableFields.length) {
    return { showSection: false, fields: [] };
  }

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
