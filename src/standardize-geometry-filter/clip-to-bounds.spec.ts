import { clipToEnvelope } from './clip-to-bounds';

describe('clipToBounds', () => {
  test('clipToBoundsOfSpatialReference', () => {
    const result = clipToEnvelope([[-190, 95], [-185, 45]], {ymin: -90, ymax: 90, xmin: -180, xmax: 180})
    expect(result).toEqual([[-180, 90], [-180, 45]]);
  });
});
