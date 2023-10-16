export interface ICombineObjectIdsAndWhereParams {
  where?: string;
  objectIds?: string | string[] | number[];
  idField?: string;
}

export function combineObjectIdsAndWhere(
  params: ICombineObjectIdsAndWhereParams,
): string {
  const sqlWhereComponents = [];
  const { objectIds, where, idField = 'OBJECTID' } = params;

  if (!where && objectIds === undefined) {
    return '';
  }

  if (objectIds && idField) {
    const objectIdsComponent = normalizeObjectIds(objectIds)
      .map((val: string | number) => {
        return isNaN(val as number) ? `'${val}'` : val;
      })
      .join(',')
      .replace(/^/, `${idField} IN (`)
      .replace(/$/, ')');

    sqlWhereComponents.push(`(${objectIdsComponent})`);
  }

  if (where) {
    sqlWhereComponents.push(`(${where})`);
  }

  return sqlWhereComponents.join(' AND ');
}

function normalizeObjectIds(
  objectIds: string | string[] | number[],
): string[] | number[] {
  return Array.isArray(objectIds) ? objectIds : objectIds.split(',');
}
