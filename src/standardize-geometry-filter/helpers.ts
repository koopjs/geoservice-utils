import joi from 'joi';
import {
  IEnvelope,
  IPoint,
  IPolyline,
  IPolygon,
} from '@esri/arcgis-rest-types';

const envelopeSchema = joi
  .object({
    ymin: joi.number().strict().required(),
    ymax: joi.number().strict().required(),
    xmin: joi.number().strict().required(),
    xmax: joi.number().strict().required(),
    spatialReference: joi
      .object({
        wkid: joi.number().strict().required(),
      })
      .unknown(true)
      .optional(),
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

type GeometryFilter =
  | IEnvelope
  | IPoint
  | IPolyline
  | IPolygon
  | number[]
  | string;

function passesValidation(schema: joi.Schema, input: GeometryFilter): boolean {
  const { error } = schema.validate(input);
  return !error;
}

export function isArcgisObject(input: GeometryFilter): boolean {
  return (
    passesValidation(envelopeSchema, input) ||
    passesValidation(pointSchema, input) ||
    passesValidation(lineStringSchema, input) ||
    passesValidation(polygonSchema, input) ||
    passesValidation(multiPointSchema, input) ||
    passesValidation(multiLineStringSchema, input) ||
    passesValidation(multipolygonSchema, input)
  );
}

export function isSinglePointArray(input: GeometryFilter): boolean {
  const { error } = pointArraySchema.validate(input);
  return !error;
}

export function isEnvelopeArray(input: GeometryFilter): boolean {
  const { error } = envelopeArraySchema.validate(input);
  return !error;
}
