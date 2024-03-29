import {
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  Position
} from 'geojson';
import {
  IEnvelope,
  IPoint,
  IPolyline,
  IPolygon,
  ISpatialReference,
} from '@esri/arcgis-rest-types';

export type Geometry =
  | Point
  | MultiPoint
  | LineString
  | MultiLineString
  | Polygon
  | MultiPolygon;

export type GeometryFilter = IEnvelope | IPoint | IPolyline | IPolygon | number[];

export type Coordinates = Position | Position[] | Position[][] | Position[][][];

export type ArcgisSpatialReference = number | ISpatialReference;

export type SpatialReference = {
  wkid?: number;
  latestWkid?: number;
  wkt?: string;
  vcsWkid?: number;
  latestVcsWkid?: number;
};

export type SpatialReferenceInput = string | number | SpatialReference;
