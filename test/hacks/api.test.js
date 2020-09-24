require('../fixtures/DB')
require('../fixtures/DBQuery')
require('../fixtures/Mongo')


const { DB, Mongo, DBQuery } = require('../../hacks/api')

it('DBQuery.prototype.fields', () => {
  assert.ok(DBQuery.prototype.fields)
})
it('DBQuery.prototype.select', () => {
  assert.ok(DBQuery.prototype.select)
})
it('DBQuery.prototype.one', () => {
  assert.ok(DBQuery.prototype.one)

  const query = new DBQuery()
  const spy = jest.spyOn(query, 'limit')

  query.one()
  expect(spy).toHaveBeenCalled()
})
it('DBQuery.prototype.first', () => {
  assert.ok(DBQuery.prototype.first)

  const query = new DBQuery()
  DBQuery.prototype.sort = (args) => {
    expect(args).toEqual({ '$natural': 1 })
    return { one: () => {} }
  }

  query.first()
})
it('DBQuery.prototype.reverse', () => {
  assert.ok(DBQuery.prototype.reverse)

  const query = new DBQuery()
  DBQuery.prototype.sort = (args) => {
    expect(args).toEqual({ '$natural': -1 })
    return {}
  }

  query.reverse()
})
it('DBQuery.prototype.last', () => {
  assert.ok(DBQuery.prototype.last)

  const query = new DBQuery()
  DBQuery.prototype.sort = (args) => {
    expect(args).toEqual({ '$natural': -1 })
    return { one: () => {} }
  }

  query.last()
})
