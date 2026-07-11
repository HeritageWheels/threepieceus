/**
 * GET /api/vehicle-body-types?year=2004&make=Nissan&model=350Z
 * Returns the vehicle body types for a given year + make + model from the DriveRight AAIA API.
 */
import { getVehicleBodyTypes } from '../../lib/vehicle-fitment';

export async function GET({ request }: { request: Request }) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year')?.trim() ?? '';
  const make = searchParams.get('make')?.trim() ?? '';
  const model = searchParams.get('model')?.trim() ?? '';

  if (!/^\d{4}$/.test(year) || !make || !model) {
    return new Response(JSON.stringify({ error: 'Invalid or missing year/make/model' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const bodyTypes = await getVehicleBodyTypes(year, make, model);

  return new Response(JSON.stringify({ bodyTypes }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
