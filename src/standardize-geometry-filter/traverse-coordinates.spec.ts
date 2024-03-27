import { Coordinates } from './common-types';
import { traverseCoordinates } from './traverse-coordinates';

describe('traverseCoordinates', () => {
  test('traverse and transform array', () => {
    const transform = (coordinates: Coordinates): Coordinates => {
      const [x, y] = coordinates;
      return [x as number + 1, y as number + 1];
    };
    const result = traverseCoordinates([[45, 60]], transform);
    expect(result).toEqual([[46, 61]]);
  });

  test('traverse and transform nested array', () => {
    const transform = (coordinates: Coordinates): Coordinates => {
      const [x, y] = coordinates;
      return [x as number + 1, y as number + 1];
    };
    const result = traverseCoordinates([[45, 60], [35, 40]], transform);
    expect(result).toEqual([[46, 61], [36, 41]]);
  });
});
