import * as _ from 'lodash';
import Joi from 'joi';
import wktParser from 'wkt-parser';
import * as esriProjCodes from '@esri/proj-codes';
import {
  ISpatialReference,
  SpatialRelationship,
} from '@esri/arcgis-rest-types';
import { arcgisToGeoJSON } from '@terraformer/arcgis';
import bboxToPolygon from '@turf/bbox-polygon';
import { projectCoordinates } from './project-coordinates';
import {
  isSinglePointArray,
  isEnvelopeArray,
  filterSchema,
  spatialReferenceSchema,
  wgsWkt,
  wgsExtentEnvelope,
  spatialReferenceObject,
} from './helpers';
import { BBox } from 'geojson';
import { clipToEnvelope } from './clip-to-envelope';
import {
  ArcgisSpatialReference,
  Coordinates,
  Geometry,
  GeometryFilter,
} from './common-types';
import { someCoordinates } from './traverse-coordinates';

export interface IStandardizedGeometryFilter {
  geometry: Geometry;
  spatialReference?: ISpatialReference;
  relation: string;
}


const JoiCustom = Joi.extend({
  type: 'object',
  base: Joi.object(),
  coerce: {
    from: 'string',
    method(value: any) {
      // Check if the string looks like a potential JSON object
      if (typeof value !== 'string' || (value[0] !== '{' && !/^\s*{/.test(value))) {
        return { value }; // Return as is if not a likely JSON string
      }
      try {
        // Attempt to parse the string into an object
        return { value: JSON.parse(value) };
      } catch (error) {
        // If parsing fails, Joi's base validation will handle the error
        return { errors: [error] };
      }
    }
  }
});

const inputSpatialReferenceSchema = Joi.alternatives().try(
    Joi.number().integer(),
    JoiCustom.object(spatialReferenceObject).unknown(),
    spatialReferenceSchema
  ).optional();

export function standardizeGeometryFilter(
  params: IStandardizedGeometryFilterParams,
): IStandardizedGeometryFilter {
  return StandardizedGeometryFilter.build(params);
}

interface IStandardizedGeometryFilterParams {
  geometry: GeometryFilter | string;
  inSR?: ArcgisSpatialReference;
  reprojectionSR?: ArcgisSpatialReference;
  spatialRel?: SpatialRelationship;
}

class StandardizedGeometryFilter {
  public geometry;
  public spatialReference;
  public relation;
  private filter;
  private filterSpatialReference;
  private reprojectionSpatialReference;

  static build(
    params: IStandardizedGeometryFilterParams,
  ): IStandardizedGeometryFilter {
    const { geometry, relation, spatialReference } =
      new StandardizedGeometryFilter(params);
    return { geometry, relation, spatialReference };
  }

  constructor(params: IStandardizedGeometryFilterParams) {
    const { geometry, inSR, reprojectionSR, spatialRel } = params;

    this.filter = _.isString(geometry) ? parseString(geometry) : geometry;
    this.relation = spatialRel || 'esriSpatialRelIntersects';

    this.filterSpatialReference = this.extractSR(
      'inSR',
      this.filter?.spatialReference || inSR,
    );
    this.reprojectionSpatialReference = this.extractSR(
      'reprojectionSR',
      reprojectionSR,
    );

    this.validateFilterShape();
    this.geometry = this.transformGeometry();

    this.spatialReference = packageSpatialReference(
      this.filterSpatialReference,
    );

    if (this.shouldClipOutOfBoundsFilter()) {
      this.geometry.coordinates = clipToEnvelope(
        this.geometry.coordinates,
        wgsExtentEnvelope,
      );
    }

    if (reprojectionSR && this.validateReproject()) {
      this.geometry.coordinates = projectCoordinates(
        this.geometry.coordinates,
        this.filterSpatialReference.wkt,
        this.reprojectionSpatialReference.wkt,
      );

      this.spatialReference = packageSpatialReference(
        this.reprojectionSpatialReference,
      );
    }
  }

  validateFilterShape(): StandardizedGeometryFilter {
    const { error } = filterSchema.validate(this.filter);
    if (error) {
      throw new Error(
        `Unsupported geometry filter format: ${JSON.stringify(
          this.filter,
        )}; must be a spatial reference ID or object`,
      );
    }

    return this;
  }

  extractSR(
    srSource: string,
    spatialReference: ArcgisSpatialReference | undefined,
  ): ISpatialReference | void {
    if (!spatialReference) {
      return;
    }

    const { error } = inputSpatialReferenceSchema.validate(spatialReference);

    if (error) {
      throw new Error(
        `Unsupported ${srSource} format; must be a spatial reference ID or object`,
      );
    }

    if (
      !Number.isNaN(Number(spatialReference))
    ) {
      return getSpatialReferenceFromCode(Number(spatialReference));
    }

    if (
      getSrid(spatialReference as ISpatialReference)
    ) {
      return getSpatialReferenceFromCode(spatialReference);
    }

    if ((spatialReference as ISpatialReference).wkt) {
      weakValidateWkt((spatialReference as ISpatialReference).wkt as string);
      return spatialReference as ISpatialReference;
    }
  }

  validateReproject(): boolean {
    if (!this.filterSpatialReference) {
      throw new Error(
        'Unknown geometry filter spatial reference; unable to reproject',
      );
    }

    if (!this.filterSpatialReference.wkt) {
      throw new Error(
        `Unknown geometry filter spatial reference WKT; unable to reproject`,
      );
    }

    if (!this.reprojectionSpatialReference) {
      throw new Error(
        `Unknown reprojection spatial reference; unable to reproject`,
      );
    }

    if (!this.reprojectionSpatialReference.wkt) {
      throw new Error(
        `Unknown reprojection spatial reference WKT; unable to reproject`,
      );
    }

    return true;
  }

  shouldClipOutOfBoundsFilter(): boolean {
    return this.filterSpatialReference?.wkt === wgsWkt && this.hasOOBCoords();
  }

  hasOOBCoords(): boolean {
    const extent = wgsExtentEnvelope;

    const predicate = (coords: Coordinates): boolean => {
      const [lon, lat] = coords;

      return (
        lon > extent.xmax ||
        lon < extent.xmin ||
        lat > extent.ymax ||
        lat < extent.ymin
      );
    };

    return someCoordinates(this.geometry.coordinates, predicate);
  }

  transformGeometry(): Geometry {
    if (isSinglePointArray(this.filter)) {
      return {
        type: 'Point',
        coordinates: (this.filter as number[]).map(Number),
      };
    }

    if (isEnvelopeArray(this.filter)) {
      return bboxToPolygon(this.filter as BBox).geometry;
    }

    return arcgisToGeoJSON(this.filter);
  }
}

function packageSpatialReference(
  spatialReference?: any,
): ISpatialReference | void {
  if (!spatialReference) {
    return;
  }
  const { wkid, wkt } = spatialReference;
  return { wkid, wkt };
}

function getSpatialReferenceFromCode(sr: ArcgisSpatialReference): any {
  const srid = Number.isInteger(sr) ? sr : getSrid(sr as ISpatialReference);
  const spatialReferenceDefinition = esriProjCodes.lookup(srid);

  if (!spatialReferenceDefinition) {
    console.warn(`Unknown spatial reference: ${srid}; ignoring`);
    return;
  }

  const extentEnvelope = getSpatialReferenceExtent(spatialReferenceDefinition);

  return {
    wkid: spatialReferenceDefinition.wkid,
    wkt: spatialReferenceDefinition.wkt,
    extent: extentEnvelope,
  };
}

function getSrid(sr: ISpatialReference): number | undefined {
  return sr.wkid || sr.latestWkid || sr.vcsWkid || sr.latestVcsWkid;
}

function getSpatialReferenceExtent(spatialReferenceDefinition: any): any {
  const { extent } = spatialReferenceDefinition;

  if (!extent) {
    return;
  }

  const { llon, slat, rlon, nlat } = extent;
  return { xmin: llon, ymin: slat, xmax: rlon, ymax: nlat };
}

function weakValidateWkt(wkt: string): void {
  try {
    wktParser(wkt);
  } catch (error) {
    throw new Error(`Spatial reference WKT is unparseable: "${wkt}"`);
  }
}

function parseString(param: string): number[] {
  try {
    return JSON.parse(param);
  } catch (error) {
    return param.split(',').map((item) => Number(item.trim()));
  }
}
