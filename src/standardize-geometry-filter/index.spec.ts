import { ISpatialReference } from '@esri/arcgis-rest-types';
import { standardizeGeometryFilter } from './';
import * as projCodes from '@esri/proj-codes';
import { GeometryFilter } from './common-types';

jest.mock('@esri/proj-codes', () => ({
  __esModule: true,
  // @ts-ignore
  ...jest.requireActual('@esri/proj-codes'),
}));

const mockLogger = 
describe('standardizeGeometryFilter', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });
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
        spatialReference: { wkid: 4326 },
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

  test('envelope object with unsupported spatial reference', () => {
    try {
      const result = standardizeGeometryFilter({
        geometry: {
          xmin: -123,
          xmax: -122,
          ymin: 48,
          ymax: 49,
          spatialReference: 'foo-bar' as unknown as ISpatialReference,
        },
      });
      throw new Error('should have thrown');
    } catch (error) {
      expect(error.message).toBe(
        'Unsupported inSR format; must be a spatial reference ID or object',
      );
    }
  });

  test('envelope object with unsupported spatial reference wkt', () => {
    try {
      const result = standardizeGeometryFilter({
        geometry: {
          xmin: -123,
          xmax: -122,
          ymin: 48,
          ymax: 49,
          spatialReference: { wkt: 'foo-bar' },
        },
      });
      throw new Error('should have thrown');
    } catch (error) {
      expect(error.message).toBe(
        'Spatial reference WKT is unparseable: "foo-bar"',
      );
    }
  });

  test('envelope object with unknown spatial reference', () => {
    const result = standardizeGeometryFilter({
      geometry: {
        xmin: -123,
        xmax: -122,
        ymin: 48,
        ymax: 49,
      },
      inSR: 9999
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

  test('envelope object with WGS84 spatial reference and clip option', () => {
    const result = standardizeGeometryFilter({
      geometry: {
        xmin: -123,
        xmax: -122,
        ymin: -95,
        ymax: 95,
        spatialReference: { wkid: 4326 },
      },
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

  test('envelope object with reprojection spatial reference, without source spatial reference', () => {
    try {
      const result = standardizeGeometryFilter({
        geometry: {
          xmin: -123,
          xmax: -122,
          ymin: 45,
          ymax: 90,
        },
        reprojectionSR: 3857,
      });
      throw new Error('should have thrown');
    } catch (error) {
      expect(error.message).toBe(
        'Unknown geometry filter spatial reference; unable to reproject',
      );
    }
  });

  test('envelope object with unknown reprojection spatial reference', () => {
    try {
      const result = standardizeGeometryFilter({
        geometry: {
          xmin: -123,
          xmax: -122,
          ymin: 45,
          ymax: 90,
        },
        inSR: 4326,
        reprojectionSR: 99999,
      });
      throw new Error('should have thrown');
    } catch (error) {
      expect(error.message).toBe(
        'Unknown reprojection spatial reference; unable to reproject',
      );
    }
  });

  test('envelope object with WKT spatial reference', () => {
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

  test('envelope object with spatial reference that has no wkt will not reproject', () => {
    jest.spyOn(projCodes, 'lookup').mockReturnValue({});

    try {
      standardizeGeometryFilter({
        geometry: {
          xmin: -123,
          xmax: -122,
          ymin: 48,
          ymax: 95,
        },
        inSR: 99999,
        reprojectionSR: 3857,
      });
      throw new Error('should have thrown');
    } catch (error) {
      expect(error.message).toBe(
        'Unknown geometry filter spatial reference WKT; unable to reproject',
      );
    }
  });

  test('reprojection spatial reference that has no wkt will not reproject', () => {
    jest
      .spyOn(projCodes, 'lookup')
      .mockReturnValueOnce({
        wkt: `GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]`,
      })
      .mockReturnValueOnce({});

    try {
      standardizeGeometryFilter({
        geometry: {
          xmin: -123,
          xmax: -122,
          ymin: 48,
          ymax: 95,
          spatialReference: { wkid: 4326 },
        },
        reprojectionSR: 3857,
      });
      throw new Error('should have thrown');
    } catch (error) {
      expect(error.message).toBe(
        'Unknown reprojection spatial reference WKT; unable to reproject',
      );
    }
  });

  test('envelope object with spatial reference that has no extent will not clip', () => {
    jest.spyOn(projCodes, 'lookup').mockReturnValue({});
    const result = standardizeGeometryFilter({
      geometry: {
        xmin: -123,
        xmax: -122,
        ymin: 48,
        ymax: 95,
      },
      inSR: 99999
    });

    expect(result).toEqual({
      geometry: {
        coordinates: [
          [
            [-122, 95],
            [-123, 95],
            [-123, 48],
            [-122, 48],
            [-122, 95],
          ],
        ],
        type: 'Polygon',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: { wkt: undefined, wkid: undefined },
    });
  });

  test('unsupported filter format', () => {
    try {
      standardizeGeometryFilter({
        geometry: { hello: 'world' } as unknown as GeometryFilter,
      });
      throw new Error('should have thrown');
    } catch (error) {
      expect(error.message).toEqual(
        'Unsupported geometry filter format: {"hello":"world"}; must be a spatial reference ID or object',
      );
    }
  });
});
