export const VEHICLE_URL_PARAMS = {
  year: 'vehicle_year',
  make: 'vehicle_make',
  model: 'vehicle_model',
  bodyType: 'vehicle_body_type',
  subModel: 'vehicle_submodel',
} as const;

export interface VehicleUrlSelection {
  year: string;
  make: string;
  model: string;
  bodyType: string;
  subModel: string;
}

export function parseVehicleUrlParams(searchParams: URLSearchParams): VehicleUrlSelection {
  return {
    year: searchParams.get(VEHICLE_URL_PARAMS.year)?.trim() ?? '',
    make: searchParams.get(VEHICLE_URL_PARAMS.make)?.trim() ?? '',
    model: searchParams.get(VEHICLE_URL_PARAMS.model)?.trim() ?? '',
    bodyType: searchParams.get(VEHICLE_URL_PARAMS.bodyType)?.trim() ?? '',
    subModel: searchParams.get(VEHICLE_URL_PARAMS.subModel)?.trim() ?? '',
  };
}

export function appendVehicleUrlParams(url: URL, selection: VehicleUrlSelection): void {
  const entries: Array<[keyof VehicleUrlSelection, string]> = [
    ['year', VEHICLE_URL_PARAMS.year],
    ['make', VEHICLE_URL_PARAMS.make],
    ['model', VEHICLE_URL_PARAMS.model],
    ['bodyType', VEHICLE_URL_PARAMS.bodyType],
    ['subModel', VEHICLE_URL_PARAMS.subModel],
  ];

  for (const [key, param] of entries) {
    const value = selection[key]?.trim();
    if (value) url.searchParams.set(param, value);
    else url.searchParams.delete(param);
  }
}

export function hasVehicleUrlSelection(selection: VehicleUrlSelection): boolean {
  return Boolean(selection.year);
}
