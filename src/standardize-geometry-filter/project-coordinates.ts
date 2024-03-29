import proj4 from 'proj4';
import * as _ from 'lodash';
import { transformCoordinates } from './traverse-coordinates';
import { Coordinates } from './common-types';
import { wgsExtentEnvelope, wgsWkt } from './helpers';
const WGS_MIN_LAT = wgsExtentEnvelope.ymin;
const WGS_MAX_LAT = wgsExtentEnvelope.ymax;

export function projectCoordinates(coordinates: Coordinates , fromSR: string, toSR: string): Coordinates {
  const reproject = (coords: Coordinates): Coordinates => {
    if (shouldReproject(coords)) {
      const [, lat] = coords;
      if(shouldConstrainSourceX(fromSR, lat as number)) {
        coords[1] = constrainX(lat as number);
      }
      return proj4(fromSR, toSR, coords);
    }
    return coords;
  }
  
  return transformCoordinates(coordinates, reproject)
}

// Prevent error in event of null or undefined coordinates
function shouldReproject(coordinates: Coordinates): boolean {
  return coordinates && _.isNumber(coordinates[0]) && _.isNumber(coordinates[1]);
}

function shouldConstrainSourceX(fromSR: string, x: number): boolean {
  return fromSR === wgsWkt && (x === WGS_MIN_LAT || x === WGS_MAX_LAT);
}

function constrainX(x: number): number {
  return x === WGS_MAX_LAT ? WGS_MAX_LAT - 1e-8 : WGS_MIN_LAT + 1e-8;
}