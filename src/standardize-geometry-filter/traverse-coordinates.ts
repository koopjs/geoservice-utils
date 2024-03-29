import { Coordinates } from "./common-types";

type TransformFunction = (coordinates: Coordinates) => Coordinates;

export function transformCoordinates(coordinates: Coordinates, transform: TransformFunction): Coordinates {
  if (Array.isArray(coordinates[0])) {
    return coordinates.map((coords) => {
      return transformCoordinates(coords, transform)
    }) as Coordinates;
  }
  return transform(coordinates);
}

type Predicate = (coordinates: Coordinates) => boolean;

export function someCoordinates(coordinates: Coordinates, condition: Predicate): boolean {
  if (Array.isArray(coordinates[0])) {
    return coordinates.some((coords) => {
      return someCoordinates(coords, condition)
    });
  }
  return condition(coordinates);
}
