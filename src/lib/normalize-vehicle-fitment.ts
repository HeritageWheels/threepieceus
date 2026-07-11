export interface NormalizedOemAxis {
  widths: number[];
  diameters: number[];
  offsets: number[];
}

export interface NormalizedDrdLimitsAxis {
  maxWidth: number;
  offsetMin: number;
  offsetMax: number;
}

export interface NormalizedVehicleFitment {
  vehicle: {
    DRDChassisID: string;
  };
  compatibility: {
    boltPattern: string;
    hubBore: number;
  };
  oem: {
    front: NormalizedOemAxis;
    rear: NormalizedOemAxis;
  };
  drdLimits: {
    front: NormalizedDrdLimitsAxis;
    rear: NormalizedDrdLimitsAxis;
  };
}

interface DrdRecord {
  [key: string]: unknown;
}

function asRecord(value: unknown): DrdRecord | null {
  return value && typeof value === 'object' ? (value as DrdRecord) : null;
}

function asString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function parseNumber(value: unknown): number | undefined {
  const stringValue = asString(value);
  if (!stringValue) return undefined;
  const parsed = Number(stringValue);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseNumberOrZero(value: unknown): number {
  return parseNumber(value) ?? 0;
}

export function parseRimSize(value: unknown): { width?: number; diameter?: number } {
  const stringValue = asString(value);
  if (!stringValue) return {};

  const match = stringValue.match(/^([\d.]+)\s*x\s*([\d.]+)$/i);
  if (!match) return {};

  const width = Number(match[1]);
  const diameter = Number(match[2]);

  return {
    width: Number.isFinite(width) ? width : undefined,
    diameter: Number.isFinite(diameter) ? diameter : undefined,
  };
}

function addUniqueNumber(values: number[], value: unknown): void {
  const parsed = parseNumber(value);
  if (parsed === undefined || values.includes(parsed)) return;
  values.push(parsed);
}

function pushUniqueNumber(values: number[], value: number): void {
  if (!values.includes(value)) values.push(value);
}

function addUniqueRimSize(values: { widths: number[]; diameters: number[] }, rimSize: unknown): void {
  const { width, diameter } = parseRimSize(rimSize);
  if (width !== undefined) pushUniqueNumber(values.widths, width);
  if (diameter !== undefined) pushUniqueNumber(values.diameters, diameter);
}

function sortNumbers(values: number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

/** Accumulates OEM wheel values from a model option into an existing axis (in place). */
function accumulateOemAxis(
  axis: NormalizedOemAxis,
  option: DrdRecord,
  rimSizeKey: 'RimSize' | 'RimSize_R',
  offsetKey: 'RimOffset' | 'Offset_R',
): void {
  addUniqueRimSize(axis, option[rimSizeKey]);
  addUniqueNumber(axis.offsets, option[offsetKey]);
}

function collectModelOptions(modelReturn: DrdRecord): DrdRecord[] {
  const options: DrdRecord[] = [];
  const primaryOption = asRecord(modelReturn.PrimaryOption);
  if (primaryOption) options.push(primaryOption);

  if (Array.isArray(modelReturn.Options)) {
    for (const option of modelReturn.Options) {
      const record = asRecord(option);
      if (record) options.push(record);
    }
  }

  return options;
}

function createEmptyFitment(DRDChassisID: string): NormalizedVehicleFitment {
  return {
    vehicle: { DRDChassisID },
    compatibility: { boltPattern: '', hubBore: 0 },
    oem: {
      front: { widths: [], diameters: [], offsets: [] },
      rear: { widths: [], diameters: [], offsets: [] },
    },
    drdLimits: {
      front: { maxWidth: 0, offsetMin: 0, offsetMax: 0 },
      rear: { maxWidth: 0, offsetMin: 0, offsetMax: 0 },
    },
  };
}

function sortFitmentAxes(fitment: NormalizedVehicleFitment): NormalizedVehicleFitment {
  fitment.oem.front.widths = sortNumbers(fitment.oem.front.widths);
  fitment.oem.front.diameters = sortNumbers(fitment.oem.front.diameters);
  fitment.oem.front.offsets = sortNumbers(fitment.oem.front.offsets);
  fitment.oem.rear.widths = sortNumbers(fitment.oem.rear.widths);
  fitment.oem.rear.diameters = sortNumbers(fitment.oem.rear.diameters);
  fitment.oem.rear.offsets = sortNumbers(fitment.oem.rear.offsets);
  return fitment;
}

/**
 * Normalizes and merges DRD responses grouped by DRDChassisID. Multiple
 * DRDModelIDs sharing a chassis merge their OEM wheel options into one object,
 * so the result is one normalized fitment per vehicle/chassis (not per trim).
 */
export function normalizeVehicleFitmentList(
  fitmentResults: Array<{ data: Record<string, unknown> }>,
): NormalizedVehicleFitment[] {
  const byChassis = new Map<string, NormalizedVehicleFitment>();

  for (const { data } of fitmentResults) {
    const chassis = asRecord(data.DRDChassisReturn_NA);
    const modelReturn = asRecord(data.DRDModelReturn);
    if (!chassis || !modelReturn) continue;

    const DRDChassisID = asString(chassis.DRDChassisID);

    let fitment = byChassis.get(DRDChassisID);
    if (!fitment) {
      fitment = createEmptyFitment(DRDChassisID);
      // Chassis-level values are identical across model IDs on the same chassis.
      fitment.compatibility.boltPattern = asString(chassis.PCD);
      fitment.compatibility.hubBore = parseNumberOrZero(chassis.CenterBore);
      fitment.drdLimits.front = {
        maxWidth: parseNumberOrZero(chassis.RimWidth_Max_F),
        offsetMin: parseNumberOrZero(chassis.ET_Min_F),
        offsetMax: parseNumberOrZero(chassis.ET_Max_F),
      };
      fitment.drdLimits.rear = {
        maxWidth: parseNumberOrZero(chassis.RimWidth_Max_R),
        offsetMin: parseNumberOrZero(chassis.ET_Min_R),
        offsetMax: parseNumberOrZero(chassis.ET_Max_R),
      };
      byChassis.set(DRDChassisID, fitment);
    }

    for (const option of collectModelOptions(modelReturn)) {
      accumulateOemAxis(fitment.oem.front, option, 'RimSize', 'RimOffset');
      accumulateOemAxis(fitment.oem.rear, option, 'RimSize_R', 'Offset_R');
    }
  }

  return [...byChassis.values()].map(sortFitmentAxes);
}
