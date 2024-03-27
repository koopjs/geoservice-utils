import joi from 'joi';
import * as esriProjCodes from '@esri/proj-codes';
import { GeometryFilter } from './common-types';

export const spatialReferenceSchema = joi.object({
  wkid: joi.number().strict().integer().optional(),
  latestWkid: joi.number().strict().integer().optional(),
  vcsWkid: joi.number().strict().integer().optional(),
  latestVcsWkid: joi.number().strict().integer().optional(),
  wkt: joi.string().optional(),
}).unknown()
  .or('wkid', 'latestWkid', 'vcsWkid', 'latestVcsWkid', 'wkt')

const envelopeSchema = joi
  .object({
    ymin: joi.number().strict().required(),
    ymax: joi.number().strict().required(),
    xmin: joi.number().strict().required(),
    xmax: joi.number().strict().required(),
    spatialReference: spatialReferenceSchema.optional()
  })
  .unknown(true);

const envelopeArraySchema = joi.array().items(joi.number()).length(4);

const pointArraySchema = joi.array().items(joi.number()).length(2);

const pointSchema = joi
  .object({
    y: joi.number().strict().required(),
    x: joi.number().strict().required(),
    spatialReference: joi
      .object({
        wkid: joi.number().strict().required(),
      })
      .unknown(true)
      .optional(),
  })
  .unknown(true);

const multiPointSchema = joi
  .object({
    points: joi.array().items(pointArraySchema).min(2).required(),
    spatialReference: joi
      .object({
        wkid: joi.number().strict().required(),
      })
      .unknown(true)
      .optional(),
  })
  .unknown(true);

const lineStringSchema = joi
  .object({
    paths: joi.array().items(joi.array().items(pointArraySchema).length(1)).required(),
    spatialReference: joi
      .object({
        wkid: joi.number().strict().required(),
      })
      .unknown(true)
      .optional(),
  })
  .unknown(true);

const multiLineStringSchema = joi
  .object({
    paths: joi.array().items(joi.array().items(pointArraySchema).min(2)).required(),
    spatialReference: joi
      .object({
        wkid: joi.number().strict().required(),
      })
      .unknown(true)
      .optional(),
  })
  .unknown(true);

const polygonSchema = joi
  .object({
    rings: joi.array().items(joi.array().items(pointArraySchema).length(1)).required(),
    spatialReference: joi
      .object({
        wkid: joi.number().strict().required(),
      })
      .unknown(true)
      .optional(),
  })
  .unknown(true);

const multipolygonSchema = joi
  .object({
    rings: joi.array().items(joi.array().items(pointArraySchema).min(2)).required(),
    spatialReference: joi
      .object({
        wkid: joi.number().strict().required(),
      })
      .unknown(true)
      .optional(),
  })
  .unknown(true);

export const filterSchema = joi
  .alternatives(
    envelopeSchema,
    envelopeArraySchema,
    pointArraySchema,
    pointSchema,
    multiPointSchema,
    lineStringSchema,
    multiLineStringSchema,
    polygonSchema,
    multipolygonSchema,
  )
  .required();

export function isSinglePointArray(input: GeometryFilter | string): boolean {
  const { error } = pointArraySchema.validate(input);
  return !error;
}

export function isEnvelopeArray(input: GeometryFilter | string): boolean {
  const { error } = envelopeArraySchema.validate(input);
  return !error;
}

const wgs = esriProjCodes.lookup(4326);

export const wgsWkt = wgs.wkt;

export const wgsExtentEnvelope = {
  ymin: wgs.extent.slat,
  ymax: wgs.extent.nlat,
  xmin: wgs.extent.llon,
  xmax: wgs.extent.rlon
};