// @ts-ignore
import tippecanoe from 'tippecanoe';

export async function writeTippecanoe() {
  await tippecanoe(
    ['./output/index.geojson'],
    {
      // TODO add line simplification
      outputToDirectory: './output/tiles',
      zg: true,
      dropDensestAsNeeded: true,
      extendZoomsIfStillDropping: true,
    },
    {echo: true},
  );
}
