import { Coordinates } from './common-types';
import { someCoordinates, transformCoordinates } from './traverse-coordinates';

describe('transformCoordinates', () => {
  test('traverse and transform array', () => {
    const transform = (coordinates: Coordinates): Coordinates => {
      const [x, y] = coordinates;
      return [x as number + 1, y as number + 1];
    };
    const result = transformCoordinates([[45, 60]], transform);
    expect(result).toEqual([[46, 61]]);
  });

  test('traverse and transform nested array', () => {
    const transform = (coordinates: Coordinates): Coordinates => {
      const [x, y] = coordinates;
      return [x as number + 1, y as number + 1];
    };
    const result = transformCoordinates([[45, 60], [35, 40]], transform);
    expect(result).toEqual([[46, 61], [36, 41]]);
  });
});


describe('someCoordinates', () => {
  test('traverse and until predicate is fufilled', () => {
    const predicate = (coordinates: Coordinates): boolean => {
      const [x, y] = coordinates;
      return y as number > 90;
    };
    const result = someCoordinates([[45, 60], [35, 95]], predicate);
    expect(result).toEqual(true);
  });
});