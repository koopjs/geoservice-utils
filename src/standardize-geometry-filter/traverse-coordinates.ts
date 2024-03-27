import { Coordinates } from "./common-types";

type TransformFunction = (coordinates: Coordinates) => Coordinates;

export function traverseCoordinates(coordinates: Coordinates, transform: TransformFunction): Coordinates {
  if (Array.isArray(coordinates[0])) {
    return coordinates.map((coords) => {
      return traverseCoordinates(coords, transform)
    }) as Coordinates;
  }
  return transform(coordinates);
}

type ConditionFunction = (coordinates: Coordinates) => boolean;

export function someCoordinates(coordinates: Coordinates, condition: ConditionFunction): boolean {
  if (Array.isArray(coordinates[0])) {
    return coordinates.some((coords) => {
      return someCoordinates(coords, condition)
    });
  }
  return condition(coordinates);
}