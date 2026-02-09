/**
 * Build URL slug from vehicle data.
 * Example: 2022-Toyota-Tundra-544B---Gloss-Black-TIS-Coilovers
 * Use for links: /vehicle-gallery/{id}/{getVehicleSlug(vehicle)}
 */
export function getVehicleSlug(
  data: Record<string, unknown> | null | undefined
): string {
  if (!data) return '';
  const toSlug = (s: unknown) =>
    String(s ?? '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || '';
  const year = toSlug(data.year);
  const make = toSlug(data.make);
  const model = toSlug(data.model);
  const wheelModel = toSlug(data['wheel-model']);
  const wheelFinish = toSlug(
    data['wheel-finish'] ?? data['wheel-finish-name'] ?? ''
  );
  const suspension = toSlug(
    data['suspension-brand'] ?? data['suspension-type'] ?? ''
  );
  const parts = [year, make, model, wheelModel].filter(Boolean);
  const after = [wheelFinish, suspension].filter(Boolean);
  const main = parts.join('-');
  const suffix = after.length ? '---' + after.join('-') : '';
  return (main + suffix).replace(/-+/g, '-').replace(/^-|-$/g, '') || 'vehicle';
}
