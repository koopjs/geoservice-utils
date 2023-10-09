const { standardizeGeometryFilter } = require('./');

describe('standardizeGeometryFilter', () => {
  test('delimited point', () => {
    const result = standardizeGeometryFilter({ geometry: '-123, 48'});
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
    const result = standardizeGeometryFilter({ geometry: '-123, 48',
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
      spatialReference: 3857,
    });
  });

  test('delimited bbox', () => {
    const result = standardizeGeometryFilter({ geometry: '-123, 48, -122, 49' });
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
    const result = standardizeGeometryFilter({ geometry: { x: -123, y: 48 }});
    expect(result).toEqual({
      geometry: {
        coordinates: [-123, 48],
        type: 'Point',
      },
      relation: 'esriSpatialRelIntersects',
      spatialReference: undefined,
    });
  });

  test('envelope object with spatial reference', () => {
    const result = standardizeGeometryFilter({ geometry: {
      xmin: -123,
      xmax: -122,
      ymin: 48,
      ymax: 49,
    }});
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

  test('polyline', () => {
    const result = standardizeGeometryFilter({ geometry: {
      paths: [
        [
          [1, 4],
          [-2, 4],
          [2, 3],
          [3, 10],
          [0, 10],
        ],
      ],
    }});
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
    const result = standardizeGeometryFilter({ geometry: {
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
    }});
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

  test('unsupported', () => {
    try {
      standardizeGeometryFilter({ geometry: { hello: 'world' } });
      throw new Error('should have thrown');
    } catch (error) {
      expect(error.message).toEqual(
        'Unsupported geometry filter format: {"hello":"world"}',
      );
    }
  });
});
