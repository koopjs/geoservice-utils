import * as _ from "lodash";
import {
  IEnvelope,
  IPoint,
  IPolyline,
  IPolygon,
  ISpatialReference,
  SpatialRelationship,
} from '@esri/arcgis-rest-types';
import { arcgisToGeoJSON } from '@terraformer/arcgis';
import bboxToPolygon from '@turf/bbox-polygon';

import { transformSpatialReferenceToWkt } from './transform-spatial-reference-to-wkt';
import { projectCoordinates } from './project-coordinates';
import {
  isArcgisEnvelope,
  isSinglePointArray,
  isEnvelopeArray,
  filterSchema,
} from './helpers';
import {
  BBox,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
} from 'geojson';

type Geometry =
  | Point
  | MultiPoint
  | LineString
  | MultiLineString
  | Polygon
  | MultiPolygon;

type GeometryFilter = IEnvelope | IPoint | IPolyline | IPolygon | number[];

type ArcgisSpatialReference = string | number | ISpatialReference;

export interface IStandardizedGeometryFilter {
  geometry: Geometry;
  spatialReference?: ArcgisSpatialReference;
  relation: string;
}

export function standardizeGeometryFilter<T extends ArcgisSpatialReference>(params: {
  geometry: GeometryFilter | string;
  inSR?: T;
  reprojectionSR?: T;
  spatialRel?: SpatialRelationship;
}): IStandardizedGeometryFilter {
  const { geometry, inSR, reprojectionSR, spatialRel } = params;
  const filter = (
    _.isString(geometry) ? parseString(geometry as string) : geometry
  ) as GeometryFilter;

  validateFilter(filter);

  const spatialReference =
    extractGeometryFilterSpatialReference(filter) || inSR || reprojectionSR;
  const filterCrsWkt =
    spatialReference && transformSpatialReferenceToWkt(spatialReference);
  const targetCrsWkt = reprojectionSR && transformSpatialReferenceToWkt(reprojectionSR);

  const geojsonGeometry = transformGeometryToGeojson(filter);
  const projectedGeometry = shouldReproject(filterCrsWkt, targetCrsWkt)
    ? reproject(geojsonGeometry, filterCrsWkt, targetCrsWkt)
    : geojsonGeometry;

  return {
    geometry: projectedGeometry,
    spatialReference: reprojectionSR || spatialReference,
    relation: spatialRel || 'esriSpatialRelIntersects',
  };
}

function validateFilter(filter: GeometryFilter): void {
  const { error } = filterSchema.validate(filter);

  if (error) {
    throw new Error(
      `Unsupported geometry filter format: ${JSON.stringify(filter)}`,
    );
  }
}

function parseString(param: string): number[] {
  return param.split(',').map((item) => Number(item.trim()));
}

function extractGeometryFilterSpatialReference(
  filter: GeometryFilter,
): ISpatialReference | number | undefined {
  if (isArcgisEnvelope(filter)) {
    return (filter as IEnvelope).spatialReference;
  }
}

function transformGeometryToGeojson(input: GeometryFilter): Geometry {
  if (isSinglePointArray(input)) {
    return {
      type: 'Point',
      coordinates: (input as number[]).map(Number),
    };
  }

  if (isEnvelopeArray(input)) {
    const { geometry } = bboxToPolygon(input as BBox);
    return geometry;
  }

  return arcgisToGeoJSON(input);
}

function shouldReproject(fromSr: string, toSr: string): boolean {
  return toSr && toSr !== fromSr;
}

function reproject(geometry: Geometry, fromSr: string, toSr: string): Geometry {
  const coordinates = projectCoordinates(geometry.coordinates, fromSr, toSr);
  return {
    ...geometry,
    coordinates,
  } as Geometry;
}

