//----------------------------------------------------------------------------
// API Additions
//----------------------------------------------------------------------------
DBQuery.prototype.fields = function( fields ) {
    this._fields = fields;
    return this;
};

DBQuery.prototype.select = function( fields ){
    this._fields = fields;
    return this;
};

DBQuery.prototype.one = function(){
    return this.limit(1)[0];
};

DBQuery.prototype.first = function(field){
    var field = field || "$natural";
    var sortBy = {};
    sortBy[field] = 1;
    return this.sort(sortBy).one();
}

DBQuery.prototype.reverse = function( field ){
    var field = field || "$natural";
    var sortBy = {};
    sortBy[field] = -1;
    return this.sort(sortBy);
}

DBQuery.prototype.last = function( field ){
    var field = field || "$natural";
    return this.reverse(field).one();
}

DB.prototype.rename = function(newName) {
    if(newName == this.getName() || newName.length === 0)
        return;

    this.copyDatabase(this.getName(), newName, "localhost");
    this.dropDatabase();
    db = this.getSiblingDB(newName);
};

//----------------------------------------------------------------------------
// API Modifications (additions and changes)
//----------------------------------------------------------------------------

// Add upsert method which has upsert set as true and multi as false
DBQuery.prototype.upsert = function( upsert ){
    assert( upsert , "need an upsert object" );

    this._validate(upsert);
    this._db._initExtraInfo();
    this._mongo.update( this._ns , this._query , upsert , true , false );
    this._db._getExtraInfo("Upserted");
};

// Updates are always multi and never an upsert
DBQuery.prototype.update = function( update ){
    assert( update , "need an update object" );

    this._checkMulti();
    this._validate(update);
    this._db._initExtraInfo();
    this._mongo.update( this._ns , this._query , update , false , true );
    this._db._getExtraInfo("Updated");
};

// Replace one document
DBQuery.prototype.replace = function( replacement ){
   assert( replacement , "need an update object" );

   this._validate(replacement);
   this._db._initExtraInfo();
   this._mongo.update( this._ns , this._query , replacement , false , false );
   this._db._getExtraInfo("Replaced");
};

// Remove is always multi
DBQuery.prototype.remove = function(){
    for ( var k in this._query ){
        if ( k == "_id" && typeof( this._query[k] ) == "undefined" ){
            throw "can't have _id set to undefined in a remove expression";
        }
    }

    this._checkMulti();
    this._db._initExtraInfo();
    this._mongo.remove( this._ns , this._query , false );
    this._db._getExtraInfo("Removed");
};

//----------------------------------------------------------------------------
// Full Text Search
//----------------------------------------------------------------------------
DBQuery.prototype.textSearch = function( search ) {
    var text = {
        text: this._collection.getName(),
        search: search,
        filter: this._query,
        project: this._fields,
        limit: this._limit
    }

    var result = this._db.runCommand( text );
    return result.results;
};