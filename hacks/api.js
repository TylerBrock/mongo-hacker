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

DB.prototype.indexStats = function(collectionFilter, details){

    details = details || false;

    collectionNames = db.getCollectionNames().filter(function (collectionName) {
        // exclude "system" collections from "count" operation

        if (!collectionFilter) {
            return !collectionName.startsWith('system.');
        }

        if (collectionName == collectionFilter) {
            return !collectionName.startsWith('system.');
        }
    });
    documentIndexes = collectionNames.map(function (collectionName) {
        var count = db.getCollection(collectionName).count();
        return (count.commify() + " document(s)");
    });

    columnSeparator = mongo_hacker_config['column_separator'];

    assert(collectionNames.length == documentIndexes.length);

    maxKeyLength   = maxLength(collectionNames);
    maxValueLength = maxLength(documentIndexes);

    for (i = 0; i < collectionNames.length; i++) {
        print(
            colorize(collectionNames[i].pad(maxKeyLength, true), mongo_hacker_config['colors']['collectionNames'])
            + " " + columnSeparator + " "
            + documentIndexes[i].pad(maxValueLength)
        );

        var stats = db.getCollection(collectionNames[i]).stats();
        var totalIndexSize = (Math.round((stats.totalIndexSize / 1024 / 1024) * 10) / 10) + " MB";

        var indexNames = [];
        var indexSizes = [];
        for (indexName in stats.indexSizes) {
            indexSizes.push((Math.round((stats.indexSizes[indexName] / 1024 / 1024) * 10) / 10) + " MB");
            indexNames.push("  " + indexName);
        }

        maxIndexKeyLength   = maxLength(indexNames);
        maxIndexValueLength = maxLength(indexSizes);

        print(
            colorize("totalIndexSize".pad(maxKeyLength, true), mongo_hacker_config['colors']['string'])
            + " " + columnSeparator + " "
            + colorize(totalIndexSize.pad(maxValueLength), mongo_hacker_config['colors']['number'])
        );

        if (details) {
            for (var j = 0; j < indexSizes.length; j++) {
                print(
                    colorize("" + indexNames[j].pad(maxIndexKeyLength, true), mongo_hacker_config['colors']['string'])
                    + " " + columnSeparator + " "
                    + colorize(indexSizes[j].pad(maxIndexValueLength), mongo_hacker_config['colors']['binData'])
                );
            };
        }
    }

    return "";
}

Mongo.prototype.getDatabaseNames = function() {
    // this API addition gives us the following convenience function:
    //
    //   db.getMongo().getDatabaseNames()
    //
    // which is similar in use to:
    //
    //   db.getCollectionNames()
    //
    // mongo-hacker FTW :-)
    return this.getDBs().databases.reduce(function(names, db) {
        return names.concat(db.name);
    }, []);
}

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
