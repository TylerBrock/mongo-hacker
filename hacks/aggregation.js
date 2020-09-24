//----------------------------------------------------------------------------
// Aggregation API Extensions
//----------------------------------------------------------------------------

// Inject aggregation extension while supporting base API
DBCollection.prototype.aggregate = function( pipeline, aggregateOptions ){

    if (pipeline instanceof Array) {
        // Expected case for modern usage; skip extra checks
    } else if (hasDollar(pipeline) && !(pipeline instanceof Array) ) {
        // Support legacy varargs form (2.6 and older) but warn on usage
        print("WARNING: Legacy aggregate() syntax does not support passing options.");
        print("         Passing the pipeline as an array is recommended.");
        pipeline = Array.from(arguments);
        aggregateOptions = {};
    } else if (pipeline === undefined) {
        pipeline = [];
    } else {
        // Use Mongo Hacker's fluent aggregation API
        return new Aggregation( this ).match( pipeline || {} );
    }

    if (aggregateOptions === undefined) {
        aggregateOptions = {};
    }

    if (aggregateOptions.cursor === undefined){
        aggregateOptions.cursor = {batchSize: 1000};
    }

    const cmdObj = this._makeCommand("aggregate", {pipeline: pipeline});
    return this._db._runAggregate(cmdObj, aggregateOptions);
};

// Helper method for determining if parameter has dollar signs
function hasDollar(fields){
    for (k in fields){
        if(k.indexOf('$') !== -1){
            return true;
        };
    };
    return false;
}

//----------------------------------------------------------------------------
// Aggregation Object
//----------------------------------------------------------------------------
Aggregation = function( collection, fields ){
    this._collection = collection;
    this._pipeline = [];
    this._options = {};
};

Aggregation.prototype.hasNext = function() {
    if (this._results == undefined) {
        return;
    } else {
        return this._results.hasNext();
    }
};

// Alias the cursor API's hasNext() in case any Mongo Hacker users relied on this
Aggregation.prototype.has_next = Aggregation.prototype.hasNext;

Aggregation.prototype.next = function() {
    if (this._results === undefined) {
        return;
    } else {
        return this._results.next();
    }
};

Aggregation.prototype.execute = function() {
    var aggregateOptions = this._options;
    if (aggregateOptions === undefined) {
        aggregateOptions = {};
    }

    if (aggregateOptions.cursor === undefined){
        aggregateOptions.cursor = {batchSize: 1000};
    }

    var res = this._collection.aggregate(this._pipeline, aggregateOptions);
    this._results = res;

    return;
};

Aggregation.prototype.shellPrint = function() {
    if (this._results === undefined) {
        this.execute();
    }

    try {
        var i = 0;
        while (this.hasNext() && (i < DBQuery.shellBatchSize) ) {
            var result = this.next();
            printjson( result );
            i++;
        }
        if ( this.hasNext() ) {
            print ( "Type \"it\" for more" );
            ___it___ = this;
        }
        else {
            ___it___ = null;
        }
    }
    catch ( e ) {
        print( e );
    }
};

Aggregation.prototype.project = function( fields ) {
    if ( ! fields ) {
        throw "project needs fields";
    }
    this._pipeline.push({ "$project": fields });
    return this;
};

Aggregation.prototype.find = function( criteria ) {
    if ( ! criteria ) {
        throw "match needs a query object";
    }
    this._pipeline.push({ "$match": criteria });
    return this;
};

Aggregation.prototype.match = function( criteria ) {
    if ( ! criteria ) {
        throw "match needs a query object";
    }
    this._pipeline.push({ "$match": criteria });
    return this;
};

Aggregation.prototype.limit = function( limit ) {
    if ( ! limit ) {
        throw "limit needs an integer indicating the limit";
    }
    this._pipeline.push({ "$limit": limit });
    return this;
};

Aggregation.prototype.skip = function( skip ) {
    if ( ! skip ) {
        throw "skip needs an integer indicating the number to skip";
    }
    this._pipeline.push({ "$skip": skip });
    return this;
};

Aggregation.prototype.unwind = function( field ) {
    if ( ! field ) {
        throw "unwind needs the key of an array field to unwind";
    }
    this._pipeline.push({ "$unwind": "$" + field });
    return this;
};

Aggregation.prototype.group = function( group_expression ) {
    if ( ! group_expression ) {
        throw "group needs an group expression";
    }
    this._pipeline.push({ "$group": group_expression });
    return this;
};

Aggregation.prototype.sort = function( sort ) {
    if ( ! sort ) {
        throw "sort needs a sort document";
    }
    this._pipeline.push({ "$sort": sort });
    return this;
};

Aggregation.prototype.geoNear = function( options ) {
    if ( ! options ) {
        throw "geo near requires options"
    }
    this._pipeline.push({ "$geoNear": options });
    return this;
};

Aggregation.prototype.readPreference = function( mode ) {
    this._readPreference = mode;
    return this;
};

Aggregation.prototype.explain = function( ) {
    this._options['explain'] = true;
    return this;
};

if (module && module.exports) {
    module.exports = { DBCollection, hasDollar, Aggregation };
}
