import proj4 from 'proj4';
import * as _ from 'lodash';
import { traverseCoordinates } from './traverse-coordinates';
import { Coordinates } from './common-types';
import { wgsWkt } from './helpers';

export function projectCoordinates(coordinates: Coordinates , fromSR: string, toSR: string): Coordinates {
  const reproject = (coords: Coordinates): Coordinates => {
    if (shouldReproject(coords)) {
      if(fromSR === wgsWkt && (coords[1] === 90 || coords[1] === -90)) {
        coords[1] = coords[1] === 90 ? 90 - 1e-8 : -90 + 90 - 1e-8;
      }
      return proj4(fromSR, toSR, coords);
    }
    return coords;
  }
  
  return traverseCoordinates(coordinates, reproject)
}

// Prevent error in event of null or undefined coordinates
function shouldReproject(coordinates: Coordinates): boolean {
  return coordinates && _.isNumber(coordinates[0]) && _.isNumber(coordinates[1]);
}
