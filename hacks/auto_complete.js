function listDbs(){
  return db.adminCommand("listDatabases").databases.map(function(d){return d.name});
}

this.__proto__.constructor.autocomplete = listDbs;