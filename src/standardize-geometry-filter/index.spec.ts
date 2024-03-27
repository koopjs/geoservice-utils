const { standardizeGeometryFilter } = require('./');

describe('standardizeGeometryFilter', () => {
  test('delimited point', () => {
    const result = standardizeGeometryFilter({ geometry: '-123, 48' });
    expect(result).toEqual({
      geometry: {
        coordinates: [-123, 48],
        type: 'Point',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: undefined,
    });
  });

  test('delimited point with options', () => {
    const result = standardizeGeometryFilter({
      geometry: '-123, 48',
      inSR: 4326,
      reprojectionSR: 3857,
      spatialRel: 'esriSpatialRelIntersects',
    });
    expect(result).toEqual({
      geometry: {
        coordinates: [-13692297.36757265, 6106854.834885075],
        type: 'Point',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: {
        wkid: 3857,
        wkt: 'PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]',
      },
    });
  });

  test('delimited bbox', () => {
    const result = standardizeGeometryFilter({
      geometry: '-123, 48, -122, 49',
    });
    expect(result).toEqual({
      geometry: {
        coordinates: [
          [
            [-123, 48],
            [-122, 48],
            [-122, 49],
            [-123, 49],
            [-123, 48],
          ],
        ],
        type: 'Polygon',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: undefined,
    });
  });

  test('point', () => {
    const result = standardizeGeometryFilter({ geometry: { x: -123, y: 48 } });
    expect(result).toEqual({
      geometry: {
        coordinates: [-123, 48],
        type: 'Point',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: undefined,
    });
  });

  test('envelope object without spatial reference', () => {
    const result = standardizeGeometryFilter({
      geometry: {
        xmin: -123,
        xmax: -122,
        ymin: 48,
        ymax: 49,
      },
    });
    expect(result).toEqual({
      geometry: {
        coordinates: [
          [
            [-122, 49],
            [-123, 49],
            [-123, 48],
            [-122, 48],
            [-122, 49],
          ],
        ],
        type: 'Polygon',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: undefined,
    });
  });

  test('envelope object with spatial reference', () => {
    const result = standardizeGeometryFilter({
      geometry: {
        xmin: -123,
        xmax: -122,
        ymin: 48,
        ymax: 49,
        spatialReference: { wkid: 4326 },
      },
    });
    expect(result).toEqual({
      geometry: {
        coordinates: [
          [
            [-122, 49],
            [-123, 49],
            [-123, 48],
            [-122, 48],
            [-122, 49],
          ],
        ],
        type: 'Polygon',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: {
        wkid: 4326,
        wkt: 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]',
      },
    });
  });

  test('envelope object with spatial reference and reproject', () => {
    const result = standardizeGeometryFilter({
      geometry: {
        xmin: -123,
        xmax: -122,
        ymin: 48,
        ymax: 49,
        spatialReference: { wkid: 4326, latestWkid: 9999 },
      },
      reprojectionSR: 3857,
    });
    expect(result).toEqual({
      geometry: {
        coordinates: [
          [
            [-13580977.876779376, 6274861.394006576],
            [-13692297.36757265, 6274861.394006576],
            [-13692297.36757265, 6106854.834885075],
            [-13580977.876779376, 6106854.834885075],
            [-13580977.876779376, 6274861.394006576],
          ],
        ],
        type: 'Polygon',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: {
        wkid: 3857,
        wkt: 'PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]',
      },
    });
  });

  test('envelope object with unknown spatial reference', () => {
    const result = standardizeGeometryFilter({
      geometry: {
        xmin: -123,
        xmax: -122,
        ymin: 48,
        ymax: 49,
        spatialReference: { wkid: 99999 },
      },
    });

    expect(result).toEqual({
      geometry: {
        coordinates: [
          [
            [-122, 49],
            [-123, 49],
            [-123, 48],
            [-122, 48],
            [-122, 49],
          ],
        ],
        type: 'Polygon',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: undefined,
    });
  });

  test('envelope object with spatial reference and clip option', () => {
    const result = standardizeGeometryFilter({
      geometry: {
        xmin: -123,
        xmax: -122,
        ymin: -95,
        ymax: 95,
        spatialReference: { wkid: 4326 },
      },
      clipToValidBounds: true,
    });
    expect(result).toEqual({
      geometry: {
        coordinates: [
          [
            [-122, 90],
            [-123, 90],
            [-123, -90],
            [-122, -90],
            [-122, 90],
          ],
        ],
        type: 'Polygon',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: {
        wkid: 4326,
        wkt: 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]',
      },
    });
  });

  test('envelope object without spatial reference and has clip option', () => {
    const result = standardizeGeometryFilter({
      geometry: {
        xmin: -123,
        xmax: -122,
        ymin: 48,
        ymax: 49,
      },
      clipToValidBounds: true,
    });
    expect(result).toEqual({
      geometry: {
        coordinates: [
          [
            [-122, 49],
            [-123, 49],
            [-123, 48],
            [-122, 48],
            [-122, 49],
          ],
        ],
        type: 'Polygon',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: undefined,
    });
  });

  test('envelope object with reprojection spatial reference', () => {
    const result = standardizeGeometryFilter({
      geometry: {
        xmin: -123,
        xmax: -122,
        ymin: 45,
        ymax: 90,
        spatialReference: { wkid: 4326 },
      },
      reprojectionSR: 3857,
    });
    expect(result).toEqual({
      geometry: {
        coordinates: [
          [
            [-13580977.876779376, 147730758.19456753],
            [-13692297.36757265, 147730758.19456753],
            [-13692297.36757265, 5621521.486192066],
            [-13580977.876779376, 5621521.486192066],
            [-13580977.876779376, 147730758.19456753],
          ],
        ],
        type: 'Polygon',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: {
        wkid: 3857,
        wkt: 'PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]',
      },
    });
  });

  test('envelope object with WKT spatial reference and clip option', () => {
    const result = standardizeGeometryFilter({
      geometry: {
        xmin: -123,
        xmax: -122,
        ymin: 43,
        ymax: 44,
        spatialReference: {
          wkt: `GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]`,
        },
      },
      clipToValidBounds: true,
    });
    expect(result).toEqual({
      geometry: {
        coordinates: [
          [
            [-122, 44],
            [-123, 44],
            [-123, 43],
            [-122, 43],
            [-122, 44],
          ],
        ],
        type: 'Polygon',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: {
        wkt: `GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]`,
      },
    });
  });

  test('envelope object with unknown spatial reference and clip option', () => {
    const result = standardizeGeometryFilter({
      geometry: {
        xmin: -123,
        xmax: -122,
        ymin: 48,
        ymax: 49,
        spatialReference: { wkid: 99999 },
      },
      clipToValidBounds: true,
    });

    expect(result).toEqual({
      geometry: {
        coordinates: [
          [
            [-122, 49],
            [-123, 49],
            [-123, 48],
            [-122, 48],
            [-122, 49],
          ],
        ],
        type: 'Polygon',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: undefined,
    });
  });

  test('geometry submitted as stringified JSON', () => {
    const filter = {
      geometry: JSON.stringify({
        xmin: -123,
        xmax: -122,
        ymin: 48,
        ymax: 49,
        spatialReference: { wkid: 4326, latestWkid: 9999 },
      }),
    };

    const result = standardizeGeometryFilter(filter);

    expect(result).toEqual({
      geometry: {
        coordinates: [
          [
            [-122, 49],
            [-123, 49],
            [-123, 48],
            [-122, 48],
            [-122, 49],
          ],
        ],
        type: 'Polygon',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: {
        wkid: 4326,
        wkt: 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]',
      },
    });
  });

  test('polyline', () => {
    const result = standardizeGeometryFilter({
      geometry: {
        paths: [
          [
            [1, 4],
            [-2, 4],
            [2, 3],
            [3, 10],
            [0, 10],
          ],
        ],
      },
    });
    expect(result).toEqual({
      geometry: {
        coordinates: [
          [1, 4],
          [-2, 4],
          [2, 3],
          [3, 10],
          [0, 10],
        ],
        type: 'LineString',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: undefined,
    });
  });

  test('multi-polyline', () => {
    const result = standardizeGeometryFilter({
      geometry: {
        paths: [
          [
            [1, 4],
            [-2, 4],
            [2, 3],
          ],
          [
            [3, 10],
            [0, 10],
          ],
        ],
      },
    });
    expect(result).toEqual({
      geometry: {
        coordinates: [
          [
            [1, 4],
            [-2, 4],
            [2, 3],
          ],
          [
            [3, 10],
            [0, 10],
          ],
        ],
        type: 'MultiLineString',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: undefined,
    });
  });

  test('polygon', () => {
    const result = standardizeGeometryFilter({
      geometry: {
        rings: [
          [
            [-134, 610],
            [-134, 594],
            [-135, 594],
            [-135, 610],
            [-134, 610],
          ],
        ],
      },
    });
    expect(result).toEqual({
      geometry: {
        coordinates: [
          [
            [-134, 610],
            [-135, 610],
            [-135, 594],
            [-134, 594],
            [-134, 610],
          ],
        ],
        type: 'Polygon',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: undefined,
    });
  });

  test('unsupported filter format', () => {
    try {
      standardizeGeometryFilter({ geometry: { hello: 'world' } });
      throw new Error('should have thrown');
    } catch (error) {
      expect(error.message).toEqual(
        'Unsupported geometry filter format: {"hello":"world"}; must be a spatial reference ID or object',
      );
    }
  });
});
