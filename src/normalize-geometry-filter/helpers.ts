import joi  from 'joi';

const envelopeSchema = joi.object({
  ymin: joi.number().strict().required(),
  ymax: joi.number().strict().required(),
  xmin: joi.number().strict().required(),
  xmax: joi.number().strict().required()
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

export function isArcgisEnvelope(input) {
  const { error } = envelopeSchema.validate(input);
  return !error;
}

export function isSinglePointArray(input) {
  const { error } = pointArraySchema.validate(input);
  return !error;
}

export function isEnvelopeArray(input) {
  const { error } = envelopeArraySchema.validate(input);
  return !error;
}
