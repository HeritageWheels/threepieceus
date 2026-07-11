/**
 * DriveRight Data AAIA fitment API (Year / Make / Model / Submodel).
 * Docs: https://api.driverightdata.com
 */

const DEFAULT_API_BASE = 'https://api.driverightdata.com/eu/api/aaia';
const DEFAULT_VEHICLE_INFO_API_BASE = 'https://api.driverightdata.com/eu/api/vehicle-info';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface YearRow {
  Year?: string;
}

interface ManufacturerRow {
  Manufacturer?: string;
}

interface ModelRow {
  Model?: string;
}

interface BodyTypeRow {
  BodyType?: string;
}

interface SubModelRow {
  SubModel?: string;
}

/** A resolved vehicle record from GetAAIAVehicles. */
export interface Vehicle {
  Year?: string;
  Manufacturer?: string;
  Model?: string;
  SubModel?: string;
  DriveType?: string;
  BodyType?: string;
  BodyNumberDoors?: string;
  BedLength?: string;
  VehicleType?: string;
  Region?: string;
  DRChassisID?: string;
  DRModelID?: string;
  TreadType?: string;
  IssueNote?: string;
  KW?: string;
  CC?: string;
}

export interface VehicleFitmentRequest {
  DRDChassisID: string;
  DRDModelID: string;
}

export interface VehicleFitmentResult {
  DRDChassisID: string;
  DRDModelID: string;
  data: Record<string, unknown>;
}

let cachedYears: string[] | null = null;
let yearsCacheExpiresAt = 0;

interface StringListCacheEntry {
  expiresAt: number;
  values: string[];
}

interface VehiclesCacheEntry {
  expiresAt: number;
  vehicles: Vehicle[];
}

const makesCache = new Map<string, StringListCacheEntry>();
const modelsCache = new Map<string, StringListCacheEntry>();
const bodyTypesCache = new Map<string, StringListCacheEntry>();
const subModelsCache = new Map<string, StringListCacheEntry>();
const vehiclesCache = new Map<string, VehiclesCacheEntry>();

interface VehicleFitmentCacheEntry {
  expiresAt: number;
  data: Record<string, unknown>;
}

const vehicleFitmentCache = new Map<string, VehicleFitmentCacheEntry>();

function getDriveRightConfig(): { base: string; username: string; token: string } | null {
  const username = import.meta.env.DRIVERIGHT_USERNAME;
  const token = import.meta.env.DRIVERIGHT_SECURITY_TOKEN;
  const base = import.meta.env.DRIVERIGHT_API_BASE || DEFAULT_API_BASE;

  if (!username || !token) return null;
  return { base, username, token };
}

function getVehicleInfoApiBase(): string {
  return import.meta.env.DRIVERIGHT_VEHICLE_INFO_API_BASE || DEFAULT_VEHICLE_INFO_API_BASE;
}

/** Dedupes DRChassisID + DRModelID pairs from AAIA vehicle records. */
export function extractVehicleFitmentRequests(vehicles: Vehicle[]): VehicleFitmentRequest[] {
  const seen = new Set<string>();
  const requests: VehicleFitmentRequest[] = [];

  for (const vehicle of vehicles) {
    const DRDChassisID = vehicle.DRChassisID?.trim();
    const DRDModelID = vehicle.DRModelID?.trim();
    if (!DRDChassisID || !DRDModelID) continue;

    const key = `${DRDChassisID}|${DRDModelID}`;
    if (seen.has(key)) continue;
    seen.add(key);

    requests.push({ DRDChassisID, DRDModelID });
  }

  return requests;
}

/** Fetches the list of AAIA vehicle years (newest first). Cached for 24h. */
export async function getVehicleYears(): Promise<string[]> {
  const now = Date.now();
  if (cachedYears && now < yearsCacheExpiresAt) {
    return cachedYears;
  }

  const config = getDriveRightConfig();
  if (!config) {
    console.warn('vehicle-fitment: missing DRIVERIGHT_USERNAME or DRIVERIGHT_SECURITY_TOKEN');
    return [];
  }

  try {
    const params = new URLSearchParams({
      username: config.username,
      securityToken: config.token,
    });
    const res = await fetch(`${config.base}/GetAAIAYears?${params}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.error('vehicle-fitment: GetAAIAYears request failed:', res.status);
      return cachedYears ?? [];
    }

    const data = (await res.json().catch(() => [])) as YearRow[];
    const years = Array.isArray(data)
      ? data
          .map((row) => row?.Year?.trim())
          .filter((year): year is string => Boolean(year))
      : [];

    if (!years.length) return cachedYears ?? [];

    cachedYears = years;
    yearsCacheExpiresAt = now + CACHE_TTL_MS;
    return years;
  } catch (error) {
    console.error('vehicle-fitment: failed to fetch years:', error);
    return cachedYears ?? [];
  }
}

/** Fetches the vehicle makes (manufacturers) for a given year. Cached for 24h per year. */
export async function getVehicleMakes(year: string): Promise<string[]> {
  const normalizedYear = year.trim();
  if (!/^\d{4}$/.test(normalizedYear)) return [];

  const now = Date.now();
  const cached = makesCache.get(normalizedYear);
  if (cached && now < cached.expiresAt) {
    return cached.values;
  }

  const config = getDriveRightConfig();
  if (!config) {
    console.warn('vehicle-fitment: missing DRIVERIGHT_USERNAME or DRIVERIGHT_SECURITY_TOKEN');
    return [];
  }

  try {
    const params = new URLSearchParams({
      username: config.username,
      securityToken: config.token,
      year: normalizedYear,
      regionID: '1',
    });
    const res = await fetch(`${config.base}/GetAAIAManufacturers?${params}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.error('vehicle-fitment: GetAAIAManufacturers request failed:', res.status);
      return cached?.values ?? [];
    }

    const data = (await res.json().catch(() => [])) as ManufacturerRow[];
    const makes = Array.isArray(data)
      ? data
          .map((row) => row?.Manufacturer?.trim())
          .filter((make): make is string => Boolean(make))
      : [];

    if (!makes.length) return cached?.values ?? [];

    makesCache.set(normalizedYear, { values: makes, expiresAt: now + CACHE_TTL_MS });
    return makes;
  } catch (error) {
    console.error('vehicle-fitment: failed to fetch makes:', error);
    return cached?.values ?? [];
  }
}

/** Fetches the vehicle models for a given year + make. Cached for 24h per year|make. */
export async function getVehicleModels(year: string, make: string): Promise<string[]> {
  const normalizedYear = year.trim();
  const normalizedMake = make.trim();
  if (!/^\d{4}$/.test(normalizedYear) || !normalizedMake) return [];

  const cacheKey = `${normalizedYear}|${normalizedMake.toLowerCase()}`;
  const now = Date.now();
  const cached = modelsCache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return cached.values;
  }

  const config = getDriveRightConfig();
  if (!config) {
    console.warn('vehicle-fitment: missing DRIVERIGHT_USERNAME or DRIVERIGHT_SECURITY_TOKEN');
    return [];
  }

  try {
    const params = new URLSearchParams({
      username: config.username,
      securityToken: config.token,
      year: normalizedYear,
      regionID: '1',
      manufacturer: normalizedMake,
    });
    const res = await fetch(`${config.base}/GetAAIAModels?${params}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.error('vehicle-fitment: GetAAIAModels request failed:', res.status);
      return cached?.values ?? [];
    }

    const data = (await res.json().catch(() => [])) as ModelRow[];
    const models = Array.isArray(data)
      ? data
          .map((row) => row?.Model?.trim())
          .filter((model): model is string => Boolean(model))
      : [];

    if (!models.length) return cached?.values ?? [];

    modelsCache.set(cacheKey, { values: models, expiresAt: now + CACHE_TTL_MS });
    return models;
  } catch (error) {
    console.error('vehicle-fitment: failed to fetch models:', error);
    return cached?.values ?? [];
  }
}

/** Fetches the vehicle body types for a given year + make + model. Cached 24h per key. */
export async function getVehicleBodyTypes(
  year: string,
  make: string,
  model: string,
): Promise<string[]> {
  const normalizedYear = year.trim();
  const normalizedMake = make.trim();
  const normalizedModel = model.trim();
  if (!/^\d{4}$/.test(normalizedYear) || !normalizedMake || !normalizedModel) return [];

  const cacheKey = `${normalizedYear}|${normalizedMake.toLowerCase()}|${normalizedModel.toLowerCase()}`;
  const now = Date.now();
  const cached = bodyTypesCache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return cached.values;
  }

  const config = getDriveRightConfig();
  if (!config) {
    console.warn('vehicle-fitment: missing DRIVERIGHT_USERNAME or DRIVERIGHT_SECURITY_TOKEN');
    return [];
  }

  try {
    const params = new URLSearchParams({
      username: config.username,
      securityToken: config.token,
      year: normalizedYear,
      regionID: '1',
      manufacturer: normalizedMake,
      model: normalizedModel,
    });
    const res = await fetch(`${config.base}/GetAAIABodyTypes?${params}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.error('vehicle-fitment: GetAAIABodyTypes request failed:', res.status);
      return cached?.values ?? [];
    }

    const data = (await res.json().catch(() => [])) as BodyTypeRow[];
    const bodyTypes = Array.isArray(data)
      ? data
          .map((row) => row?.BodyType?.trim())
          .filter((bodyType): bodyType is string => Boolean(bodyType))
      : [];

    if (!bodyTypes.length) return cached?.values ?? [];

    bodyTypesCache.set(cacheKey, { values: bodyTypes, expiresAt: now + CACHE_TTL_MS });
    return bodyTypes;
  } catch (error) {
    console.error('vehicle-fitment: failed to fetch body types:', error);
    return cached?.values ?? [];
  }
}

/** Fetches the vehicle submodels for a given year + make + model + body type. Cached 24h per key. */
export async function getVehicleSubModels(
  year: string,
  make: string,
  model: string,
  bodyType: string,
): Promise<string[]> {
  const normalizedYear = year.trim();
  const normalizedMake = make.trim();
  const normalizedModel = model.trim();
  const normalizedBodyType = bodyType.trim();
  if (
    !/^\d{4}$/.test(normalizedYear) ||
    !normalizedMake ||
    !normalizedModel ||
    !normalizedBodyType
  ) {
    return [];
  }

  const cacheKey = `${normalizedYear}|${normalizedMake.toLowerCase()}|${normalizedModel.toLowerCase()}|${normalizedBodyType.toLowerCase()}`;
  const now = Date.now();
  const cached = subModelsCache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return cached.values;
  }

  const config = getDriveRightConfig();
  if (!config) {
    console.warn('vehicle-fitment: missing DRIVERIGHT_USERNAME or DRIVERIGHT_SECURITY_TOKEN');
    return [];
  }

  try {
    const params = new URLSearchParams({
      username: config.username,
      securityToken: config.token,
      year: normalizedYear,
      regionID: '1',
      manufacturer: normalizedMake,
      model: normalizedModel,
      bodyType: normalizedBodyType,
    });
    const res = await fetch(`${config.base}/GetAAIASubModels?${params}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.error('vehicle-fitment: GetAAIASubModels request failed:', res.status);
      return cached?.values ?? [];
    }

    const data = (await res.json().catch(() => [])) as SubModelRow[];
    const subModels = Array.isArray(data)
      ? data
          .map((row) => row?.SubModel?.trim())
          .filter((subModel): subModel is string => Boolean(subModel))
      : [];

    if (!subModels.length) return cached?.values ?? [];

    subModelsCache.set(cacheKey, { values: subModels, expiresAt: now + CACHE_TTL_MS });
    return subModels;
  } catch (error) {
    console.error('vehicle-fitment: failed to fetch submodels:', error);
    return cached?.values ?? [];
  }
}

/**
 * Fetches the resolved vehicle record(s) for a full YMM + body type + submodel
 * selection. This is the data that will later drive product custom_field filtering.
 * Cached 24h per key.
 */
export async function getVehicles(
  year: string,
  make: string,
  model: string,
  bodyType: string,
  subModel: string,
): Promise<Vehicle[]> {
  const normalizedYear = year.trim();
  const normalizedMake = make.trim();
  const normalizedModel = model.trim();
  const normalizedBodyType = bodyType.trim();
  const normalizedSubModel = subModel.trim();
  if (
    !/^\d{4}$/.test(normalizedYear) ||
    !normalizedMake ||
    !normalizedModel ||
    !normalizedBodyType ||
    !normalizedSubModel
  ) {
    return [];
  }

  const cacheKey = `${normalizedYear}|${normalizedMake.toLowerCase()}|${normalizedModel.toLowerCase()}|${normalizedBodyType.toLowerCase()}|${normalizedSubModel.toLowerCase()}`;
  const now = Date.now();
  const cached = vehiclesCache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return cached.vehicles;
  }

  const config = getDriveRightConfig();
  if (!config) {
    console.warn('vehicle-fitment: missing DRIVERIGHT_USERNAME or DRIVERIGHT_SECURITY_TOKEN');
    return [];
  }

  try {
    const params = new URLSearchParams({
      username: config.username,
      securityToken: config.token,
      year: normalizedYear,
      regionID: '1',
      manufacturer: normalizedMake,
      model: normalizedModel,
      bodyType: normalizedBodyType,
      subModel: normalizedSubModel,
    });
    const res = await fetch(`${config.base}/GetAAIAVehicles?${params}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.error('vehicle-fitment: GetAAIAVehicles request failed:', res.status);
      return cached?.vehicles ?? [];
    }

    const data = (await res.json().catch(() => [])) as Vehicle[];
    const vehicles = Array.isArray(data) ? data : [];

    if (!vehicles.length) return cached?.vehicles ?? [];

    vehiclesCache.set(cacheKey, { vehicles, expiresAt: now + CACHE_TTL_MS });
    return vehicles;
  } catch (error) {
    console.error('vehicle-fitment: failed to fetch vehicles:', error);
    return cached?.vehicles ?? [];
  }
}

/** Fetches wheel/fitment data for a single DRChassisID + DRModelID pair. Cached 24h. */
export async function getVehicleDataFromDRD(
  chassisId: string,
  modelId: string,
): Promise<Record<string, unknown>> {
  const DRDChassisID = chassisId.trim();
  const DRDModelID = modelId.trim();
  if (!DRDChassisID || !DRDModelID) return {};

  const cacheKey = `${DRDChassisID}|${DRDModelID}`;
  const now = Date.now();
  const cached = vehicleFitmentCache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  const config = getDriveRightConfig();
  if (!config) {
    console.warn('vehicle-fitment: missing DRIVERIGHT_USERNAME or DRIVERIGHT_SECURITY_TOKEN');
    return {};
  }

  try {
    const params = new URLSearchParams({
      username: config.username,
      securityToken: config.token,
      DRDModelID,
      DRDChassisID,
    });
    const res = await fetch(
      `${getVehicleInfoApiBase()}/GetVehicleDataFromDRD_NA?${params}`,
      { headers: { Accept: 'application/json' } },
    );

    if (!res.ok) {
      console.error('vehicle-fitment: GetVehicleDataFromDRD_NA request failed:', res.status);
      return cached?.data ?? {};
    }

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!data || typeof data !== 'object') return cached?.data ?? {};

    vehicleFitmentCache.set(cacheKey, { data, expiresAt: now + CACHE_TTL_MS });
    return data;
  } catch (error) {
    console.error('vehicle-fitment: failed to fetch vehicle fitment data:', error);
    return cached?.data ?? {};
  }
}

/**
 * Resolves AAIA vehicles into one or more DRD fitment payloads.
 * Multiple DRModelIDs indicate different front/rear wheel sizing.
 */
export async function getMergedVehicleFitmentData(
  vehicles: Vehicle[],
): Promise<VehicleFitmentResult[]> {
  const requests = extractVehicleFitmentRequests(vehicles);
  if (!requests.length) return [];

  const results = await Promise.all(
    requests.map(async ({ DRDChassisID, DRDModelID }) => ({
      DRDChassisID,
      DRDModelID,
      data: await getVehicleDataFromDRD(DRDChassisID, DRDModelID),
    })),
  );

  return results.filter((result) => Object.keys(result.data).length > 0);
}
