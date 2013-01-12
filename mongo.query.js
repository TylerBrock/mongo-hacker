
DBCollection.prototype.filter = function( filter ) {
    return new DBQuery( this._mongo, this._db, this, this._fullName, this._massageObject( filter ) );
};

DBQuery.prototype._validate = function( o ){
    var firstKey = null;
    for (var k in o) { firstKey = k; break; }

    if (firstKey !== null && firstKey[0] == '$') {
        // for mods we only validate partially, for example keys may have dots
        this._validateObject( o );
    } else {
        // we're basically inserting a brand new object, do full validation
        this._validateForStorage( o );
    }
};

DBQuery.prototype._validateObject = function( o ){
    if (typeof(o) != "object")
        throw "attempted to save a " + typeof(o) + " value.  document expected.";

    if ( o._ensureSpecial && o._checkModify )
        throw "can't save a DBQuery object";
};

DBQuery.prototype._validateForStorage = function( o ){
    this._validateObject( o );
    for ( var k in o ){
        if ( k.indexOf( "." ) >= 0 ) {
            throw "can't have . in field names [" + k + "]" ;
        }

        if ( k.indexOf( "$" ) === 0 && ! DBCollection._allowedFields[k] ) {
            throw "field names cannot start with $ [" + k + "]";
        }

        if ( o[k] !== null && typeof( o[k] ) === "object" ) {
            this._validateForStorage( o[k] );
        }
    }
};

DB.prototype._getExtraInfo = function(action) {
    if ( typeof _verboseShell === 'undefined' || !_verboseShell ) {
        __callLastError = true;
        return;
    }

    // explicit w:1 so that replset getLastErrorDefaults aren't used here which would be bad.
    var res = this.getLastErrorCmd(1);
    if (res) {
        if (res.err !== undefined && res.err !== null) {
            // error occurred, display it
            print(res.err);
            return;
        }

        var info = action + " ";
        // hack for inserted because res.n is 0
        info += action != "Inserted" ? res.n : 1;
        if (res.n > 0 && res.updatedExisting !== undefined) info += " " + (res.updatedExisting ? "existing" : "new");
        info += " record(s) in ";
        var time = new Date().getTime() - this.startTime;
        var slowms = this.setProfilingLevel().slowms;
        if (time > slowms) {
            info += colorize(time + "ms", "red", true);
        } else {
            info += colorize(time + "ms", "green", true);
        }
        print(info);
    }
};

DB.prototype.rename = function(newName) {
    if(newName == this.getName() || newName.length === 0)
        return;

    this.copyDatabase(this.getName(), newName, "localhost");
    this.dropDatabase();
    db = this.getSiblingDB(newName);
};

DBQuery.prototype._checkMulti = function(){
    if(this._limit > 0){
        var ids = this.clone().select({_id: 1}).map(function(o){return o._id;});
        this._query['_id'] = {'$in': ids};
        return true;
    } else {
        return false;
    }
};

DBQuery.prototype.upsert = function( upsert ){
    assert( upsert , "need an upsert object" );

    this._validate(upsert);
    this._db._initExtraInfo();
    this._mongo.update( this._ns , this._query , upsert , true , false );
    this._db._getExtraInfo("Upserted");
};

DBQuery.prototype.update = function( update ){
    assert( update , "need an update object" );

    this._checkMulti();
    this._validate(update);
    this._db._initExtraInfo();
    this._mongo.update( this._ns , this._query , update , false , true );
    this._db._getExtraInfo("Updated");
};

DBQuery.prototype.replace = function( replacement ){
    assert( replacement , "need an update object" );

    this._validate(replacement);
    this._db._initExtraInfo();
    this._mongo.update( this._ns , this._query , replacement , false , false );
    this._db._getExtraInfo("Replaced");
};

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

DBQuery.prototype.select = function( fields ){
    this._fields = fields;
    return this;
};

DBQuery.prototype.one = function(){
    return this.limit(1)[0];
};

// Override group because map/reduce style is deprecated
DBCollection.prototype.agg_group = function( name, group_field, operation, op_value, filter ) {
    var ops = [];
    var group_op = { $group: { _id: '$' + group_field } };

    if (filter !== undefined) {
        ops.push({ '$match': filter });
    }

    group_op['$group'][name] = { };
    group_op['$group'][name]['$' + operation] = op_value;
    ops.push(group_op);

    return this.aggregate(ops);
};

// Function that groups and counts by group after applying filter
DBCollection.prototype.gcount = function( group_field, filter ) {
    return this.agg_group('count', group_field, 'sum', 1, filter);
};

// Function that groups and sums sum_field after applying filter
DBCollection.prototype.gsum = function( group_field, sum_field, filter ) {
    return this.agg_group('sum', group_field, 'sum', '$' + sum_field, filter);
};

// Function that groups and averages avg_feld after applying filter
DBCollection.prototype.gavg = function( group_field, avg_field, filter ) {
    return this.agg_group('avg', group_field, 'avg', '$' + avg_field, filter);
};

DBQuery.prototype.shellPrint = function(){
    try {
        var start = new Date().getTime();
        var n = 0;
        while ( this.hasNext() && n < DBQuery.shellBatchSize ){
            var s = this._prettyShell ? tojson( this.next() ) : tojson( this.next() , "" , false );
            print( s );
            n++;
        }

        var output = [];

        if (typeof _verboseShell !== 'undefined' && _verboseShell) {
            var time = new Date().getTime() - start;
            var slowms = this._db.setProfilingLevel().slowms;
            var fetched = "Fetched " + n + " record(s) in ";
            if (time > slowms) {
                fetched += colorize(time + "ms", "red", true);
            } else {
                fetched += colorize(time + "ms", "green", true);
            }
            output.push(fetched);
        }
        if (typeof _indexParanoia !== 'undefined' && _indexParanoia) {
            var explain = this.clone();
            explain._ensureSpecial();
            explain._query.$explain = true;
            explain._limit = Math.abs(n._limit) * -1;
            var result = explain.next();
            var type = result.cursor;
            var index_use = "Index[";
            if (type == "BasicCursor") {
                index_use += colorize( "none", "red", true);
            } else {
                index_use += colorize( result.cursor.substring(12), "green", true );
            }
            index_use += "]";
            output.push(index_use);
        }
        if ( this.hasNext() ) {
            ___it___  = this;
            output.push("More[" + colorize("true", "green", true) + "]");
        }
        else {
            ___it___  = null;
            output.push("More[" + colorize("false", "red", true) + "]");
        }
        print(output.join(" -- "));
    }
    catch ( e ){
        print( e );
    }
};
