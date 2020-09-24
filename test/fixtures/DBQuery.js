function DBQuery() {
}

DBQuery.prototype.limit = () => {
  return []
}
DBQuery.prototype.sort = () => {
  return this
}

global.DBQuery = DBQuery
