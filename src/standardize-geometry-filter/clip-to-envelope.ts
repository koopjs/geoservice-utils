import { transformCoordinates } from './traverse-coordinates';
import { Coordinates } from './common-types';
import { IEnvelope } from '@esri/arcgis-rest-types';

export function clipToEnvelope(coordinates: Coordinates , envelope: IEnvelope): Coordinates {
  const { xmin, xmax, ymin, ymax } = envelope;

  const repositionInvalidCoordinates = (coords): Coordinates => {
    const [lon, lat] = coords;
    return [constrainNumber(lon, xmax, xmin), constrainNumber(lat, ymax, ymin)];
  };

  return transformCoordinates(coordinates, repositionInvalidCoordinates);
}

function constrainNumber (num:number, max:number, min:number): number {
  if (num > max) {
    return max;
  }

  if (num < min) {
    return min;
  }

  return num;
}