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
    const transformed = projectCoordinates([null as any, 63], 'test', 'test');
    expect(transformed[0]).toEqual(null);
    expect(transformed[1]).toEqual(63);
    expect((proj4 as any as jest.Mock).mock.calls.length).toEqual(0);
  });

  test('Do not project coordinates if both are null', () => {
    const transformed = projectCoordinates([null as any, null], 'test', 'test');
    expect(transformed[0]).toEqual(null);
    expect(transformed[1]).toEqual(null);
    expect((proj4 as any as jest.Mock).mock.calls.length).toEqual(0);
  });

  test('Do not project coordinates if empty array', () => {
    const transformed = projectCoordinates([], 'test', 'test');
    expect(transformed[0]).toEqual(undefined);
    expect(transformed[1]).toEqual(undefined);
    expect((proj4 as any as jest.Mock).mock.calls.length).toEqual(0);
  });


  test('should reproject simple array', () => {
    const transformed = projectCoordinates([75, 45], '4326', '2991');
    expect(transformed[0]).toEqual('lon');
    expect(transformed[1]).toEqual('lat');
    expect((proj4 as any as jest.Mock).mock.calls.length).toEqual(1);
    expect((proj4 as any as jest.Mock).mock.calls[0]).toEqual([
      '4326',
      '2991',
      [75, 45],
    ]);
  });

  test('should reproject nested array', () => {
    const transformed = projectCoordinates(
      [
        [75, 45],
        [76, 48],
      ],
      '4326',
      '2991',
    );
    expect(transformed).toEqual([
      ['lon', 'lat'],
      ['lon', 'lat'],
    ]);
    expect((proj4 as any as jest.Mock).mock.calls.length).toEqual(2);
    expect((proj4 as any as jest.Mock).mock.calls[0]).toEqual([
      '4326',
      '2991',
      [75, 45],
    ]);
    expect((proj4 as any as jest.Mock).mock.calls[1]).toEqual([
      '4326',
      '2991',
      [76, 48],
    ]);
  });

  test('should reproject nested array', () => {
    const transformed = projectCoordinates(
      [
        [75, 45],
        [20, 30],
      ],
      '4326',
      '2991',
    );
    expect(transformed).toEqual([
      ['lon', 'lat'],
      ['lon', 'lat'],
    ]);
    expect((proj4 as any as jest.Mock).mock.calls.length).toEqual(2);
    expect((proj4 as any as jest.Mock).mock.calls[0]).toEqual([
      '4326',
      '2991',
      [75, 45],
    ]);
  });
});
