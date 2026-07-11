/**
 * GET /api/vehicle-models?year=2004&make=Nissan
 * Returns the list of vehicle models for a given year + make from the DriveRight AAIA API.
 */
import { getVehicleModels } from '../../lib/vehicle-fitment';

export async function GET({ request }: { request: Request }) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year')?.trim() ?? '';
  const make = searchParams.get('make')?.trim() ?? '';

  if (!/^\d{4}$/.test(year) || !make) {
    return new Response(JSON.stringify({ error: 'Invalid or missing year/make' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const models = await getVehicleModels(year, make);

  return new Response(JSON.stringify({ models }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
