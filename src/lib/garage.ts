export const GARAGE_STORAGE_KEY = 'cm_variant-garage';
export const GARAGE_UPDATED_EVENT = 'garage-updated';

export type GarageField = {
  field: string;
  term: string;
  value: string;
  payload: null;
  imageUrl: string | null;
};

export type GarageVehicle = GarageField[];

export function toGarageTerm(value: string): string {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '-');
}

export function makeImageUrl(make: string): string | null {
  const slug = String(make || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
  if (!slug) return null;
  return `https://client.convermax.com/static/_common/makes/${slug}.png`;
}

export function toGarageVehicle(input: {
  year: string;
  make: string;
  model: string;
  submodel?: string;
}): GarageVehicle {
  const year = String(input.year || '').trim();
  const make = String(input.make || '').trim();
  const model = String(input.model || '').trim();
  const submodel = String(input.submodel || 'Base').trim() || 'Base';

  return [
    { field: 'Year', term: toGarageTerm(year), value: year, payload: null, imageUrl: null },
    {
      field: 'Make',
      term: toGarageTerm(make),
      value: make,
      payload: null,
      imageUrl: makeImageUrl(make),
    },
    {
      field: 'Model',
      term: toGarageTerm(model),
      value: model,
      payload: null,
      imageUrl: null,
    },
    {
      field: 'Submodel',
      term: toGarageTerm(submodel),
      value: submodel,
      payload: null,
      imageUrl: null,
    },
  ];
}

export function vehicleLabel(fields: GarageVehicle): string {
  const byField: Record<string, string> = {};
  (fields || []).forEach((f) => {
    if (f?.field && f.value != null) byField[f.field] = String(f.value);
  });
  return [byField.Year, byField.Make, byField.Model, byField.Submodel].filter(Boolean).join(' ');
}

export function vehicleKey(fields: GarageVehicle): string {
  return (fields || [])
    .map((f) => `${f.field}:${f.term || f.value}`)
    .sort()
    .join('|');
}

export function getGarage(): GarageVehicle[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GARAGE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => Array.isArray(item) && item.length > 0) as GarageVehicle[];
  } catch {
    return [];
  }
}

export function setGarage(vehicles: GarageVehicle[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify(vehicles));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(GARAGE_UPDATED_EVENT));
  }
}

export function clearGarage(): void {
  setGarage([]);
}

export function removeVehicleAt(index: number): GarageVehicle[] {
  const next = getGarage().slice();
  if (index < 0 || index >= next.length) return next;
  next.splice(index, 1);
  setGarage(next);
  return next;
}

export function addVehicle(vehicle: GarageVehicle): GarageVehicle[] {
  const garage = getGarage();
  const key = vehicleKey(vehicle);
  if (garage.some((v) => vehicleKey(v) === key)) {
    return garage;
  }
  const next = garage.concat([vehicle]);
  setGarage(next);
  return next;
}

export function addVehicleFromYmm(input: {
  year: string;
  make: string;
  model: string;
  submodel?: string;
}): GarageVehicle[] {
  return addVehicle(toGarageVehicle(input));
}
