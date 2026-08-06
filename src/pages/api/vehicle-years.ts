/**
 * GET /api/vehicle-years
 * Returns AAIA vehicle years from the DriveRight API (newest first).
 */
import { getVehicleYears } from '../../lib/vehicle-fitment';

export async function GET() {
  const years = await getVehicleYears();

  return new Response(JSON.stringify({ years }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000',
    },
  });
}
