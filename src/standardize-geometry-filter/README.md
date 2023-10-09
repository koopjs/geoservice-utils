# standardizeGeometryFilter

The GeoService `geometry` filter can be one of many formats: a delimited-string representing a point, a delimited-string representing a bounding box, or an ArcGIS geometry. Geometry formats may or may not include a `spatialReference` property, and if they do not, it might have been sent in a separate `inSR` parameter.  In addition, the filter itself, does not include a target operation or spatial relation (intersection, falls within, etc).  This is captured in the GeoService `spatialRel` parameter.

This utility accepts the noted parameters and their possible variation and returns a "standardized" geometry-filter-object.

## Usage

### Parameters
#### `geometry` (required)

The value of `geometry` can be a comma-delimited point, comma-delimited bounding box, or an ArcGIS geometry in JSON.

#### `inSR` (optional)
A spatial reference designation for the input geometry. It can be specified as either a well-known ID, and WKT string, or as a [spatial reference JSON object](https://developers.arcgis.com/documentation/common-data-types/geometry-objects.htm).

#### `spatialRel` (optional)
The spatial relationship that is intended to be applied to the input geometry.  Defaults to `'esriSpatialRelIntersects'`.

#### `reprojectionSR` (optional)
A spatial reference that the filter should be reprojected to. Reprojection can only be executed if the geometry's initial spatial reference has been defined. As with `inSR`, it can be specified as either a well-known ID, and WKT string, or as a [spatial reference JSON object](https://developers.arcgis.com/documentation/common-data-types/geometry-objects.htm).


```js
const filter = standardizeGeometryFilter({ geometry, inSR, spatialRel, reprojectionSR });

/*
returns:
{
  geometry - a GeoJSON geometry
  spatialReference - filter's spatial reference
  relation - how filter should be applied
}
*/ 
```

### Return 
```js
{
  geometry,
  spatialReference,
  relation
}
```

#### `geometry`
The input geometry converted to a GeoJSON geometry equivalent. Envelopes are converted to polygons. If a `reprojectionSR` was supplied, the coordinates will be reprojected to the requested spatial reference.

#### `spatialReference`
The spatial reference of the returned geometry.  Format will depend on the data type of spatial reference supplied by input parameters.

#### `relation`
The relation passed into the function or a default value of `esriSpatialRelIntersects`.