import { transformSpatialReferenceToWkt } from './transform-spatial-reference-to-wkt';
import * as projCodes from '@esri/proj-codes';

jest.mock('@esri/proj-codes', () => {
  return {
    lookup: jest.fn(() => {
      return { wkt: 'the-wkt'}
    })
  };
});

jest.mock('@alloc/quick-lru', () => {
  return function () {
    this.get = () => {};
    this.set = () => {};
  };
});

describe('transformSpatialReferenceToWkt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  })

  test('invalid input', () => {
    try {
      /* tslint:disable-next-line */
      transformSpatialReferenceToWkt(undefined as any);
      throw new Error('should have thrown')
    } catch (error) {
      expect(error.message).toEqual('Unsupported spatial reference format: "undefined"');
    }
  });

  test('wkid input', () => {
    const result = transformSpatialReferenceToWkt(4326)
    expect(result).toEqual('the-wkt');
    expect(projCodes.lookup.mock.calls[0]).toEqual([4326]);
  });

  test('string-wkid input', () => {
    const result = transformSpatialReferenceToWkt('4326')
    expect(result).toEqual('the-wkt');
    expect(projCodes.lookup.mock.calls[0]).toEqual([4326]);
  });

  test('spatial reference wkid input', () => {
    const result = transformSpatialReferenceToWkt({ wkid: 4326})
    expect(result).toEqual('the-wkt');
    expect(projCodes.lookup.mock.calls[0]).toEqual([4326]);
  });

  test('wkt input', () => {
    const result = transformSpatialReferenceToWkt('GEOGCS["WGS 84"]')
    expect(result).toEqual('GEOGCS["WGS 84"]');
  });

  test('spatial reference latest-wkid input', () => {
    const result = transformSpatialReferenceToWkt({ latestWkid: 4326})
    expect(result).toEqual('the-wkt');
    expect(projCodes.lookup.mock.calls[0]).toEqual([4326]);
  });

  test('spatial reference wkt input', () => {
    const result = transformSpatialReferenceToWkt({ wkt: 'GEOGCS["WGS 84"]'})
    expect(result).toEqual('GEOGCS["WGS 84"]');
  });

  test('invalid spatial reference wkid input', () => {
    jest.resetAllMocks();
    jest.mock('@esri/proj-codes', () => {
      return {
        lookup: jest.fn(() => {
          return;
        })
      };
    });
    try {
      transformSpatialReferenceToWkt({ wkid: 99999});
      throw new Error('should have thrown')
    } catch (error) {
      expect(error.message).toEqual('"99999" is an unknown spatial reference');
    }
  });

  test('unparseable WKT', () => {
    try {
      transformSpatialReferenceToWkt({ wkt: 'test' });
      throw new Error('should have thrown')
    } catch (error) {
      expect(error.message).toEqual('Spatial reference WKT is unparseable: "test"');
    }
  });

});