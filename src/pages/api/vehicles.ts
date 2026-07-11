/**
 * GET /api/vehicles?year=2004&make=Nissan&model=350Z&bodyType=Coupe&subModel=Base
 * Returns AAIA vehicle records and merged DRD fitment data for product filtering.
 */
import { normalizeVehicleFitmentList } from '../../lib/normalize-vehicle-fitment';
import { getMergedVehicleFitmentData, getVehicles } from '../../lib/vehicle-fitment';
import { searchProductsByOemFitment } from '../../lib/wheel-filters';

export async function GET({ request }: { request: Request }) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year')?.trim() ?? '';
  const make = searchParams.get('make')?.trim() ?? '';
  const model = searchParams.get('model')?.trim() ?? '';
  const bodyType = searchParams.get('bodyType')?.trim() ?? '';
  const subModel = searchParams.get('subModel')?.trim() ?? '';
  const categoryId = Number(searchParams.get('categoryId') || '');

  if (!/^\d{4}$/.test(year) || !make || !model || !bodyType || !subModel) {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing year/make/model/bodyType/subModel' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const vehicles = await getVehicles(year, make, model, bodyType, subModel);
  const fitment = await getMergedVehicleFitmentData(vehicles);
  const normalizedFitment = normalizeVehicleFitmentList(fitment);

  const fitmentProducts =
    Number.isFinite(categoryId) && categoryId > 0 && normalizedFitment.length
      ? await searchProductsByOemFitment({ categoryId }, normalizedFitment)
      : null;

  return new Response(JSON.stringify({ normalizedFitment, fitmentProducts }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
