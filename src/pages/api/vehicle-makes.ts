/**
 * GET /api/vehicle-makes?year=2004
 * Returns the list of vehicle makes for a given year from the DriveRight AAIA API.
 */
import { getVehicleMakes } from '../../lib/vehicle-fitment';

export async function GET({ request }: { request: Request }) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year')?.trim() ?? '';

  if (!/^\d{4}$/.test(year)) {
    return new Response(JSON.stringify({ error: 'Invalid or missing year' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const makes = await getVehicleMakes(year);

  return new Response(JSON.stringify({ makes }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
