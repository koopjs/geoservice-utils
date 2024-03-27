import * as _ from 'lodash';
import proj4 from 'proj4';
import Joi from 'joi';
import wktParser from 'wkt-parser';
import * as esriProjCodes from '@esri/proj-codes';
import {
  IEnvelope,
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
} from './helpers';
import { BBox } from 'geojson';
import { clipToEnvelope } from './clip-to-bounds';
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

const inputSpatialReferenceSchema = Joi.any()
  .when(Joi.number(), {
    then: Joi.number().strict().integer(),
    otherwise: spatialReferenceSchema,
  })
  .optional();

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
  clipEnvelope?: IEnvelope;
  logger?: { [key: string]: any };
}

class StandardizedGeometryFilter {
  public geometry;
  public spatialReference;
  public relation;
  private filter;
  private logger;
  private filterSpatialReference;
  private reprojectionSpatialReference;
  private targetSpatialReference;
  private clipEnvelope;

  static build(
    params: IStandardizedGeometryFilterParams,
  ): IStandardizedGeometryFilter {
    const { geometry, relation, spatialReference } =
      new StandardizedGeometryFilter(params);
    return { geometry, relation, spatialReference };
  }

  constructor(params: IStandardizedGeometryFilterParams) {
    const {
      geometry,
      inSR,
      reprojectionSR,
      spatialRel,
      clipEnvelope,
      logger = console,
    } = params;

    this.logger = logger;
    this.filter = _.isString(geometry) ? parseString(geometry) : geometry;
    this.relation = spatialRel || 'esriSpatialRelIntersects';

    this.filterSpatialReference = this.extractSR({
      inSR: this.filter?.spatialReference || inSR,
    });
    this.reprojectionSpatialReference = this.extractSR({ reprojectionSR });

    this.validateFilterShape();
    this.validateReproject();
    this.geometry = this.transformGeometry();

    this.targetSpatialReference =
      this.reprojectionSpatialReference || this.filterSpatialReference;

    this.spatialReference = this.packageSpatialReference();

    if (this.shouldClipOutOfBoundsFilter()) {
      this.geometry.coordinates = this.clipToEnvelope(clipEnvelope);
    }

    if (this.shouldReproject()) {
      this.geometry.coordinates = projectCoordinates(
        this.geometry.coordinates,
        this.filterSpatialReference.wkt,
        this.targetSpatialReference.wkt,
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

  extractSR(srInput: { [key: string]: any } | number): ISpatialReference {
    const srOption = Object.keys(srInput)[0];
    const srOptionValue = srInput[srOption];

    if (!srOptionValue) {
      return;
    }

    const { error } = inputSpatialReferenceSchema.validate(srOptionValue);

    if (error) {
      throw new Error(`Unsupported ${srOption} format; ${error.message}`);
    }

    try {
      if (Number.isInteger(srOptionValue) || getSrid(srOptionValue)) {
        return getSpatialReferenceFromCode(srOptionValue);
      }

      if (srOptionValue.wkt) {
        weakValidateWkt(srOptionValue.wkt);
        return srOptionValue;
      }
    } catch (error) {
      this.logger.debug(error.message, error.stacktrace);
    }
  }

  validateReproject(): void {
    if (this.reprojectionSpatialReference && !this.filterSpatialReference) {
      this.logger.debug(`Unknown inSR; unable to reproject`);
    }
  }

  shouldClipOutOfBoundsFilter(): boolean {
    return this.hasRequiredSpatialReferences() && this.hasOOBCoords();
  }

  hasRequiredSpatialReferences(): boolean {
    return (
      this.filterSpatialReference?.wkt &&
      (this.reprojectionSpatialReference?.extent ||
        this.filterSpatialReference.extent)
    );
  }

  hasOOBCoords(): boolean {
    const extentEnvelope = this.clipEnvelope || wgsExtentEnvelope;
    const conditions = (coords: Coordinates): boolean => {
      const coordinatesWkt = this.filterSpatialReference.wkt;
      const [lon, lat] =
        coordinatesWkt === wgsWkt || this.clipEnvelope
          ? coords
          : proj4(coordinatesWkt, wgsWkt, coords);
      return (
        lon > extentEnvelope.xmax ||
        lon < extentEnvelope.xmin ||
        lat > extentEnvelope.ymax ||
        lat < extentEnvelope.ymin
      );
    };
    return someCoordinates(this.geometry.coordinates, conditions);
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

  clipToEnvelope(clipEnvelope?: IEnvelope): Coordinates {
    // no need to reproject coordinates for clipping to spatial reference extent
    const filterCoordinatesWgs84 =
      this.filterSpatialReference.wkt === wgsWkt
        ? this.geometry.coordinates
        : projectCoordinates(
            this.geometry.coordinates,
            this.filterSpatialReference.wkt,
            wgsWkt,
          );

    const clippedCoordinates = clipToEnvelope(
      filterCoordinatesWgs84,
      clipEnvelope || wgsExtentEnvelope,
    );

    return this.filterSpatialReference.wkt === wgsWkt
      ? clippedCoordinates
      : projectCoordinates(
          clippedCoordinates,
          wgsWkt,
          this.filterSpatialReference.wkt,
        );
  }

  shouldReproject(): boolean {
    return (
      this.targetSpatialReference?.wkt &&
      this.filterSpatialReference?.wkt &&
      this.targetSpatialReference?.wkt !== this.filterSpatialReference?.wkt
    );
  }

  packageSpatialReference(): ISpatialReference | void {
    if (this.shouldReproject()) {
      const { wkid, wkt } = this.reprojectionSpatialReference;
      return { wkid, wkt };
    }

    if (this.filterSpatialReference) {
      const { wkid, wkt } = this.filterSpatialReference;
      return { wkid, wkt };
    }
  }
}

function getSpatialReferenceFromCode(sr: ArcgisSpatialReference): any {
  const srid = Number.isInteger(sr) ? sr : getSrid(sr as ISpatialReference);
  const spatialReferenceDefinition = esriProjCodes.lookup(srid);

  if (!spatialReferenceDefinition) {
    throw new Error(`Unknown spatial reference: ${srid}; ignoring`);
  }

  const extentEnvelope = getSpatialReferenceExtent(spatialReferenceDefinition);

  return {
    wkid: spatialReferenceDefinition.wkid,
    wkt: spatialReferenceDefinition.wkt,
    extent: extentEnvelope,
  };
}

function getSrid(sr: ISpatialReference): number {
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
