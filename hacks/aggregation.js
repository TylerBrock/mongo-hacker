//----------------------------------------------------------------------------
// Aggregation API Extensions
//----------------------------------------------------------------------------

// Inject aggregation extension while supporting base API
DBCollection.prototype.aggregate = function( ops, extraOpts ){
    if (hasDollar(ops) || (ops instanceof Array && hasDollar(ops[0]))){
        var arr = ops;

        if (!ops.length) {
            arr = [];
            for (var i=0; i<arguments.length; i++) {
                arr.push(arguments[i]);
            }
        }

        if (extraOpts === undefined) {
            extraOpts = {};
        }

        var cmd = {pipeline: arr};
        Object.extend(cmd, extraOpts);

        var res = this.runCommand("aggregate", cmd);
        if (!res.ok) {
            printStackTrace();
            throw "aggregate failed: " + tojson(res);
        }
        return res;
    } else {
        return new Aggregation( this ).match( ops || {} );
    }
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
    this._shellBatchSize = 20;
};

Aggregation.prototype.has_next = function() {
    return (this._index < this._results.length);
};

Aggregation.prototype.next = function() {
    var next = this._results[this._index];
    this._index += 1;
    return next
};

Aggregation.prototype.execute = function() {
    // build the command
    var aggregation = { pipeline: this._pipeline };
    if ( this._readPreference ) {
        aggregation["$readPreference"] = this.readPreference;
    }
    Object.extend(aggregation, this._options);

    // run the command
    var res = this._collection.runCommand(
        "aggregate", aggregation
    );

    // check result
    if ( ! res.ok ) {
        printStackTrace();
        throw "aggregation failed: " + tojson(res);
    }

    // setup results as pseudo cursor
    this._index = 0;

    if (this._options["explain"] === true) {
        this._results = res.stages
    } else {
        this._results = res.result;
    }

    return this._results;
};

Aggregation.prototype.shellPrint = function() {
    if (this._results == undefined) {
        this.execute();
    }
    try {
        var i = 0;
        while (this.has_next() && i < this._shellBatchSize) {
            var result = this.next();
            printjson( result );
            i++;
        }
        if ( this.has_next() ) {
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
