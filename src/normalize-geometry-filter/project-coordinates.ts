import proj4 from 'proj4';
import * as _ from 'lodash';
import { Position } from 'geojson';

type Coordinates = Position | Position[] | Position[][] | Position[][][];

export function projectCoordinates(coordinates: Coordinates , fromSR?: string, toSR?: string): Coordinates {
  if (!toSR || fromSR === toSR) {
    return coordinates;
  }

  return recursiveCoordinatesReproject(coordinates, fromSR, toSR);
}

function recursiveCoordinatesReproject(coordinates: Coordinates, fromSr: string, toSr: string): Coordinates {
  if (Array.isArray(coordinates[0])) {
    return coordinates.map((coords) => {
      return recursiveCoordinatesReproject(coords, fromSr, toSr)
    }) as Coordinates;
  }

  if (shouldReproject(coordinates)) {
    return proj4(fromSr, toSr, coordinates);
  }

  return coordinates;
}

function shouldReproject(coordinates: Coordinates): boolean {
  return _.isNumber(coordinates[0]) && _.isNumber(coordinates[1]);
}
