/**
 * GET /api/vehicle-submodels?year=2004&make=Nissan&model=350Z&bodyType=Coupe
 * Returns the vehicle submodels for a given year + make + model + body type
 * from the DriveRight AAIA API.
 */
import { getVehicleSubModels } from '../../lib/vehicle-fitment';

export async function GET({ request }: { request: Request }) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year')?.trim() ?? '';
  const make = searchParams.get('make')?.trim() ?? '';
  const model = searchParams.get('model')?.trim() ?? '';
  const bodyType = searchParams.get('bodyType')?.trim() ?? '';

  if (!/^\d{4}$/.test(year) || !make || !model || !bodyType) {
    return new Response(JSON.stringify({ error: 'Invalid or missing year/make/model/bodyType' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const subModels = await getVehicleSubModels(year, make, model, bodyType);

  return new Response(JSON.stringify({ subModels }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
