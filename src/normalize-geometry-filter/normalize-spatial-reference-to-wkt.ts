import * as esriProjCodes from '@esri/proj-codes';
import * as _ from 'lodash';
import Joi from 'joi';
import wktParser from 'wkt-parser';
import QuickLRU from '@alloc/quick-lru';
const wkidCache = new QuickLRU({ maxSize: 10 });

const schema = Joi.alternatives(
  Joi.string(),
  Joi.number().integer(),
  Joi.object({
    wkid: Joi.number().strict().integer().optional(),
    latestWkid: Joi.number().strict().integer().optional(),
    wkt: Joi.string().optional(),
  })
    .unknown()
    .or('wkid', 'latestWkid', 'wkt')
    .required(),
).required();

type SpatialReference = {
  wkid?: number;
  latestWkid?: number;
  wkt?: string;
};

type Input = string | number | SpatialReference;

export function normalizeSpatialReferenceToWkt(input: Input): string {
  const { error, value: castInput } = schema.validate(input);

  if (error) {
    throw new Error(
      `Unsupported spatial reference format: "${JSON.stringify(input)}"`,
    );
  }

  const { type, value } = parseSpatialReferenceInput(castInput);

  if (type === 'wkid') {
    return wkidCache.get(value) as string || esriWktLookup(value as number);
  }

  return weakValidateWkt(value as string);
}

type ParsedSpatialReference = {
  value: string | number;
  type: string;
}

function parseSpatialReferenceInput(spatialReference: Input): ParsedSpatialReference {
  if (isNumericSpatialReferenceId(spatialReference)) {
    return {
      type: 'wkid',
      value: Number(spatialReference),
    };
  }

  const { wkt, wkid, latestWkid } = spatialReference as SpatialReference;

  if (_.isString(spatialReference) || wkt) {
    return {
      type: 'wkt',
      value: wkt || spatialReference as string,
    };
  }

  return {
    type: 'wkid',
    value: wkid || latestWkid,
  };
}

function isNumericSpatialReferenceId(spatialReference: Input): boolean {
  return (
    Number.isInteger(spatialReference) ||
    Number.isInteger(Number(spatialReference))
  );
}

function esriWktLookup(wkid: number): string {
  const result = esriProjCodes.lookup(wkid);

  if (!result) {
    throw new Error(`"${wkid}" is an unknown spatial reference`);
  }

  const { wkt } = result;

  // Add the WKT to the local lookup so we don't need to scan the Esri lookups next time
  // TODO: move to LRU cache
  wkidCache.set(wkid, wkt);
  return wkt;
}

function weakValidateWkt(wkt: string): any {
  try {
    wktParser(wkt);
  } catch (error) {
    throw new Error(`Spatial reference WKT is unparseable: "${wkt}"`);
  }

  return wkt;
}
