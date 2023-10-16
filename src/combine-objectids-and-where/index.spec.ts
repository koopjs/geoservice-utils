const {combineObjectIdsAndWhere} = require('./index');

describe('combine-object-ids-and-where', () => {
  it('should return empty string if no params', () => {
    const clause = combineObjectIdsAndWhere({})
    expect(clause).toBe('');
  });

  it('should return clause with objectIds string', () => {
    const clause = combineObjectIdsAndWhere({ objectIds: '1,2,3'})
    expect(clause).toBe('(OBJECTID IN (1,2,3))');
  });

  it('should return clause with objectIds as string', () => {
    const clause = combineObjectIdsAndWhere({ objectIds: 'a,b'})
    expect(clause).toBe('(OBJECTID IN (\'a\',\'b\'))');
  });

  it('should return clause with objectIds as array', () => {
    const clause = combineObjectIdsAndWhere({ objectIds: ['a','b']})
    expect(clause).toBe('(OBJECTID IN (\'a\',\'b\'))');
  });

  it('should return clause with objectIds string and default idField', () => {
    const clause = combineObjectIdsAndWhere({ objectIds: '1,2,3', idField: '_id' })
    expect(clause).toBe('(_id IN (1,2,3))');
  });

  it('should return clause with where defined', () => {
    const clause = combineObjectIdsAndWhere({ where: 'foo=\'bar\'' })
    expect(clause).toBe('(foo=\'bar\')');
  });
})