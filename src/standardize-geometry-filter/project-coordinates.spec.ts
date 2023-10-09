import { projectCoordinates } from './project-coordinates';
import proj4 from 'proj4';

jest.mock('proj4', () => {
  return jest.fn(() => ['lon', 'lat']);
});

describe('project-coordinates', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Do not project coordinates if one is null', () => {
    const transformed = projectCoordinates([null as any, 63]);
    expect(transformed[0]).toEqual(null);
    expect(transformed[1]).toEqual(63);
    expect((proj4 as any as jest.Mock).mock.calls.length).toEqual(0);
  });
  
  test('Do not project coordinates if both are null', () => {
    const transformed = projectCoordinates([null as any, null]);
    expect(transformed[0]).toEqual(null);
    expect(transformed[1]).toEqual(null);
    expect((proj4 as any as jest.Mock).mock.calls.length).toEqual(0);
  });
  
  test('Do not project coordinates if empty array', () => {
    const transformed = projectCoordinates([]);
    expect(transformed[0]).toEqual(undefined);
    expect(transformed[1]).toEqual(undefined);
    expect((proj4 as any as jest.Mock).mock.calls.length).toEqual(0);
  });
  
  test('Do not project coordinates if no toSR', () => {
    const transformed = projectCoordinates([45, 75]);
    expect(transformed[0]).toEqual(45);
    expect(transformed[1]).toEqual(75);
    expect((proj4 as any as jest.Mock).mock.calls.length).toEqual(0);
  });
  
  test('Do not project coordinates if target and source spatial reference are the same', () => {
    const transformed = projectCoordinates([45, 75], '4326', '4326');
    expect(transformed[0]).toEqual(45);
    expect(transformed[1]).toEqual(75);
    expect((proj4 as any as jest.Mock).mock.calls.length).toEqual(0);
  });

  test('should reproject simple array', () => {
    const transformed = projectCoordinates([75, 45], '4326', '2991');
    expect(transformed[0]).toEqual('lon');
    expect(transformed[1]).toEqual('lat');
    expect((proj4 as any as jest.Mock).mock.calls.length).toEqual(1);
    expect((proj4 as any as jest.Mock).mock.calls[0]).toEqual(['4326', '2991', [75, 45]])
  });

  test('should reproject nested array', () => {
    const transformed = projectCoordinates([[75, 45], [76, 48]], '4326', '2991');
    expect(transformed).toEqual([["lon", "lat"], ["lon", "lat"]]);
    expect((proj4 as any as jest.Mock).mock.calls.length).toEqual(2);
    expect((proj4 as any as jest.Mock).mock.calls[0]).toEqual(['4326', '2991', [75, 45]]);
    expect((proj4 as any as jest.Mock).mock.calls[1]).toEqual(['4326', '2991', [76, 48]]);
  });

  test('should reproject nested array', () => {
    const transformed = projectCoordinates([[75, 45], [null as any, null]], '4326', '2991');
    expect(transformed).toEqual([["lon", "lat"], [null, null]]);
    expect((proj4 as any as jest.Mock).mock.calls.length).toEqual(1);
    expect((proj4 as any as jest.Mock).mock.calls[0]).toEqual(['4326', '2991', [75, 45]]);
  });
});
