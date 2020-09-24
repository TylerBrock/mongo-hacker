require('../fixtures/DBCollection')

const { DBCollection, hasDollar, Aggregation } = require('../../hacks/aggregation')

it('hasDollar $group', () => {
  const fields = {
    $group: {},
    $match: {},
    _id: {}
  }
  const result = hasDollar(fields)
  expect(result).toBe(true)
})

it('hasDollar _id', () => {
  const fields = {
    _id: {}
  }
  const result = hasDollar(fields)
  expect(result).toBe(false)
})
