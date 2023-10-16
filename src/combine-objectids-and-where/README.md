# combineObjectIdsAndWhere

The GeoService `objectIds` parameter is a convienance parameter for filtering features by unique-identifier.  This could also be accomplished with use of the `where` parameter.  This function transforms the `objectIds` parameter as part of the `where` parameter, so it can be more easily passed on to remote APIs.

## Usage
```js
const objectIds = '1,2,3';
const idField = 'id';
const where = 'foo=\'bar\'';
const whereClause = combineObjectIdsAndWhere({ objectIds, where, idField})

/*
Returns
"(id in (1,2,3)) AND (foo='bar')"
*/
```

### Parameters

#### `objectIds`: string | string[] | number[] (optional)
A list of unique-identifiers that a feature result set should include. For convenience, it can be a comma-delimited string, or string/numeric array.

#### `idField`: string (optional)
The name of the feature attribute that serves as a unique identifier. Defaults to `OBJECTID`.

#### `where`: string (optional)
The Geoservices `where` filter, a typical SQL style WHERE clause.