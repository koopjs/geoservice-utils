import joi from 'joi';
import {
  IEnvelope,
  IPoint,
  IPolyline,
  IPolygon,
} from '@esri/arcgis-rest-types';

const envelopeSchema = joi.object({
  ymin: joi.number().strict().required(),
  ymax: joi.number().strict().required(),
  xmin: joi.number().strict().required(),
  xmax: joi.number().strict().required(),
  spatialReference: joi.object({
    wkid: joi.number().strict().required()
  }).unknown(true).optional()
});

const envelopeArraySchema = joi.array().items(joi.number()).length(4);

const pointArraySchema = joi.array().items(joi.number()).length(2);

const pointSchema = joi.object({
  y: joi.number().strict().required(),
  x: joi.number().strict().required()
});

const multiPointSchema = joi.object({
  points: joi.array().items(pointArraySchema).min(2)
});

const lineStringSchema = joi.object({
  paths: joi.array().items(joi.array().items(pointArraySchema).length(1))
})

const multiLineStringSchema = joi.object({
  paths: joi.array().items(joi.array().items(pointArraySchema).min(2))
})

const polygonSchema = joi.object({
  rings: joi.array().items(joi.array().items(pointArraySchema).length(1))
});

const multipolygonSchema = joi.object({
  rings: joi.array().items(joi.array().items(pointArraySchema).min(2))
})

export const filterSchema = joi.alternatives(
  envelopeSchema,
  envelopeArraySchema,
  pointArraySchema,
  pointSchema,
  multiPointSchema,
  lineStringSchema,
  multiLineStringSchema,
  polygonSchema,
  multipolygonSchema
).required();

type GeometryFilter = IEnvelope | IPoint | IPolyline | IPolygon | number[] | string;

export function isArcgisEnvelope(input: GeometryFilter): boolean {
  const { error } = envelopeSchema.validate(input);
  return !error;
}

export function isSinglePointArray(input: GeometryFilter): boolean {
  const { error } = pointArraySchema.validate(input);
  return !error;
}

export function isEnvelopeArray(input: GeometryFilter): boolean {
  const { error } = envelopeArraySchema.validate(input);
  return !error;
}
