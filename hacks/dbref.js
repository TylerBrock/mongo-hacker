DBRef.prototype.__toString = DBRef.prototype.toString;
DBRef.prototype.toString = function () {
  var org = this.__toString();
  var config = mongo_hacker_config.dbref;
  if (!config.extended_info) {
    return org;
  }
  var additional = {};
  var o = this;
  for (var p in o) {
    if (typeof o[p] === 'function') {
      continue;
    }
    if (!config.plain && (p === '$ref' || p === '$id')) {
      continue;
    }
    if (config.db_if_differs && p === '$db' && o[p] === db.getName()) {
      continue;
    }
    additional[p] = o[p];
  }
  if (config.plain) {
    return tojsonObject(additional, undefined, true);
  }
  return Object.keys(additional).length
    ? (org.slice(0, -1) + ", " + tojsonObject(additional, undefined, true) + ")")
    : org;
};
