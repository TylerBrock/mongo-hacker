__indent = Array(mongo_hacker_config.indent + 1).join(' ');
__colorize = mongo_hacker_config['use_color'];

// Disable color for terminals that aren't likely to support ANSI color codes
if (__colorize && !mongo_hacker_config['force_color']) {
    if (_isWindows()) {
        __colorize = false;
    } else if (typeof(isInteractive) === typeof(Function)) {
        // Requires MongoDB 4.2+ shell
        __colorize = isInteractive();
    }
}

ObjectId.prototype.toString = function() {
    return this.str;
};

ObjectId.prototype.tojson = function(indent, nolint) {
    return tojson(this);
};

var dateToJson = Date.prototype.tojson;

Date.prototype.tojson = function(indent, nolint, nocolor) {
  var isoDateString = dateToJson.call(this);
  var dateString = isoDateString.substring(8, isoDateString.length-1);

  var isodate = colorize(dateString, mongo_hacker_config.colors.date, nocolor);
  return 'ISODate(' + isodate + ')';
};

Array.tojson = function( a , indent , nolint, nocolor ){
    var lineEnding = nolint ? " " : "\n";

    if (!indent)
        indent = "";

    if ( nolint )
        indent = "";

    if (a.length === 0) {
        return "[ ]";
    }

    var s = "[" + lineEnding;
    indent += __indent;
    for ( var i=0; i<a.length; i++){
        s += indent + tojson( a[i], indent , nolint, nocolor );
        if ( i < a.length - 1 ){
            s += "," + lineEnding;
        }
    }
    if ( a.length === 0 ) {
        s += indent;
    }

    indent = indent.substring(__indent.length);
    s += lineEnding+indent+"]";
    return s;
};

function surround(name, inside) {
    return [name, '(', inside, ')'].join('');
}

Number.prototype.commify = function() {
    // http://stackoverflow.com/questions/2901102
    return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

NumberLong.prototype.tojson = function(indent, nolint, nocolor) {
    var color = mongo_hacker_config.colors.number;
    var output = colorize('"' + this.toString().match(/-?\d+/)[0] + '"', color, nocolor);
    return surround('NumberLong', output);
};

NumberInt.prototype.tojson = function(indent, nolint, nocolor) {
    var color = mongo_hacker_config.colors.number;
    var output = colorize('"' + this.toString().match(/-?\d+/)[0] + '"', color, nocolor);
    return surround('NumberInt', output);
};

BinData.prototype.tojson = function(indent , nolint, nocolor) {
    var uuidType = mongo_hacker_config.uuid_type;
    var uuidColor = mongo_hacker_config.colors.uuid;
    var binDataColor = mongo_hacker_config.colors.binData;

    if (this.subtype() === 3) {
        var output = colorize('"' + uuidToString(this) + '"', uuidColor, nocolor) + ', '
        output += colorize('"' + uuidType + '"', uuidColor)
        return surround('UUID', output);
    } else if (this.subtype() === 4) {
        var output = colorize('"' + uuidToString(this, "default") + '"', uuidColor, nocolor)
        return surround('UUID', output);
    } else {
        var output = colorize(this.subtype(), {color: 'red'}) + ', '
        output += colorize('"' + this.base64() + '"', binDataColor, nocolor)
        return surround('BinData', output);
    }
};

DBQuery.prototype.shellPrint = function(){
    try {
        var start = new Date().getTime();
        var n = 0;
        while ( this.hasNext() && n < DBQuery.shellBatchSize ){
            var s = this._prettyShell ? tojson( this.next() ) : tojson( this.next() , "" , true );
            print( s );
            n++;
        }

        var output = [];

        if (typeof _verboseShell !== 'undefined' && _verboseShell) {
            var time = new Date().getTime() - start;
            var slowms = getSlowms();
            var fetched = "Fetched " + n + " document" + (n === 1 ? "" : "s") + " in ";
            if (time > slowms) {
                fetched += colorize(time + "ms", { color: "red", bright: true });
            } else {
                fetched += colorize(time + "ms", { color: "green", bright: true });
            }
            output.push(fetched);
        }

        var paranoia = mongo_hacker_config.index_paranoia;

        if (typeof paranoia !== 'undefined' && paranoia) {
            var explanation = this.explain();
            var cursor = explanation.cursor;
            var clauses = explanation.clauses;
            var queryPlanner = explanation.queryPlanner;

            if (cursor !== undefined || clauses !== undefined) {
                var index_use = "Index[";
                var parseClause = function(clause) {
                    var indexInfo;
                    if (clause.cursor === "BasicCursor") {
                        indexInfo = colorize("none", {color: "red", bright: true});
                    } else {
                        var indexName = clause.cursor === "IDCursor" ? "_id_" : clause.cursor.split(" ")[1];
                        indexInfo = colorize(indexName, {color: "green", bright: true});
                        if (clause.indexOnly) {
                            indexInfo += colorize("(covered)", {color: "green", bright: false});
                        }
                    }
                    return indexInfo;
                };
                if (clauses) {
                    var clauseInfo = [];
                    var singleClauseInfo;
                    clauses.forEach(function(clause) {
                        singleClauseInfo = parseClause(clause);
                        if (clauseInfo.filter(function(info) { return info === singleClauseInfo; }).length === 0) {
                            clauseInfo.push(singleClauseInfo);
                        }
                    });
                    index_use += clauseInfo.join(', ');
                } else {
                    index_use += parseClause(explanation);
                }
                index_use += "]";
                output.push(index_use);
            } else if (queryPlanner !== undefined) {
                var collectionIndexes;
                var getIndexNameByKey = (function(query) {
                    return function(key) {
                        if (!collectionIndexes) {
                            var nsParts = query._ns.split('.');
                            var dbName = nsParts[0];
                            var colName = nsParts[1];
                            collectionIndexes = db.getSisterDB(dbName)[colName].getIndexes();
                        }
                        return collectionIndexes.filter(function (index) {
                          return JSON.stringify(index.key) === JSON.stringify(key);
                        })[0].name;
                    }
                })(this);
                var traverseStageTree = function(currentStage, results) {
                    results = results || {
                        collscans: 0,
                        eof: false,
                        fetches: 0,
                        idhacks: 0,
                        indexes: [],
                        ixscans: 0
                    };
                    switch(currentStage.stage) {
                    case "EOF":
                        results.eof = true;
                        break;
                    case "COLLSCAN":
                        results.collscans++;
                        break;
                    case "IDHACK":
                        results.idhacks++;
                        break;
                    case "IXSCAN":
                        results.ixscans++;
                        var currentIndexName = currentStage.indexName;
                        if (!currentIndexName) {
                          currentIndexName = getIndexNameByKey(currentStage.keyPattern);
                        }
                        if (results.indexes.filter(function(indexName) { return indexName === currentIndexName; }).length === 0) {
                            results.indexes.push(currentIndexName);
                        }
                        break;
                    case "FETCH":
                        results.fetches++;
                      // Fallthrough.
                    default:
                        if (currentStage.inputStage) {
                            traverseStageTree(currentStage.inputStage, results);
                        } else if (currentStage.inputStages) {
                            for (var i = 0, length = currentStage.inputStages.length; i < length; i++) {
                                traverseStageTree(currentStage.inputStages[i], results);
                            }
                        }
                    }
                    return results;
                };
                var parseQueryResults = function(results) {
                    var indexInfo;
                    if (results.eof) {
                        indexInfo = colorize("collection doesn't exist", { color: "red", bright: true });
                    } else if (results.idhacks) {
                        indexInfo = colorize("_id_", { color: "green", bright: true });
                    } else if (results.ixscans) {
                        indexInfo = results.indexes.map(function(index) {
                            return colorize(index, { color: "green", bright: true });
                        }).join(', ');
                        if (!results.fetches) {
                            indexInfo += colorize(" (covered)", { color: "green", bright: false });
                        }
                    } else if (results.collscans) {
                        indexInfo = colorize("none", { color: "red", bright: true });
                    } else {
                        indexInfo = colorize( "CAN'T DETERMINE", { color: "red", bright: true });
                    }
                    return indexInfo;
                };

                var index_use = "Index[";
                if (queryPlanner.winningPlan.shards) {
                    var shards = queryPlanner.winningPlan.shards;
                    var shardIndexesInfo = [];
                    shards.forEach(function(shard) {
                        shardIndexesInfo.push(
                            "shard " +
                            colorize(shard.shardName, { color: "blue", bright: true }) +
                            ": " +
                            parseQueryResults(traverseStageTree(shard.winningPlan))
                        );
                    });
                    index_use += shardIndexesInfo.join('; ');
                } else {
                    index_use += parseQueryResults(traverseStageTree(queryPlanner.winningPlan));
                }

                index_use += "]";
                output.push(index_use);
            }
        }

        if ( this.hasNext() ) {
            ___it___  = this;
            output.push("More[" + colorize("true", { color: "green", bright: true }) + "]");
        }
        print(output.join(" -- "));
    }
    catch ( e ){
        print( e );
    }
};

function isInArray(array, value) {
    return array.indexOf(value) > -1;
}

tojsonObject = function( x, indent, nolint, nocolor, sort_keys ) {
    var lineEnding = nolint ? " " : "\n";
    var tabSpace = nolint ? "" : __indent;
    var sortKeys = (null == sort_keys) ? mongo_hacker_config.sort_keys : sort_keys;

    assert.eq( ( typeof x ) , "object" , "tojsonObject needs object, not [" + ( typeof x ) + "]" );

    if (!indent)
        indent = "";

    if ( typeof( x.tojson ) == "function" && x.tojson != tojson ) {
        return x.tojson( indent, nolint, nocolor );
    }

    if ( x.constructor && typeof( x.constructor.tojson ) == "function" && x.constructor.tojson != tojson ) {
        return x.constructor.tojson( x, indent , nolint, nocolor );
    }

    if ( x.toString() == "[object MaxKey]" )
        return "{ $maxKey : 1 }";
    if ( x.toString() == "[object MinKey]" )
        return "{ $minKey : 1 }";

    var s = "{" + lineEnding;

    // push one level of indent
    indent += tabSpace;

    var total = 0;
    for ( var k in x ) total++;
    if ( total === 0 ) {
        s += indent + lineEnding;
    }

    var keys = x;
    if ( typeof( x._simpleKeys ) == "function" )
        keys = x._simpleKeys();
    var num = 1;

    var keylist=[];

    for(var key in keys)
        keylist.push(key);

    if ( sortKeys ) {
        // Disable sorting if this object looks like an index spec
        if ( (isInArray(keylist, "v") && isInArray(keylist, "key") && isInArray(keylist, "name") && isInArray(keylist, "ns")) ) {
            sortKeys = false;
        } else {
            keylist.sort();
        }
    }

    for ( var i=0; i<keylist.length; i++) {
        var key=keylist[i];

        var val = x[key];
        if ( val == DB.prototype || val == DBCollection.prototype )
            continue;

        var color = mongo_hacker_config.colors.key;
        s += indent + colorize("\"" + key + "\"", color, nocolor) + ": " + tojson( val, indent , nolint, nocolor, sortKeys );
        if (num != total) {
            s += ",";
            num++;
        }
        s += lineEnding;
    }

    // pop one level of indent
    indent = indent.substring(__indent.length);
    return s + indent + "}";
};

tojson = function( x, indent , nolint, nocolor, sort_keys ) {

    var sortKeys = (null == sort_keys) ? mongo_hacker_config.sort_keys : sort_keys;

    try {
        if (tojson.caller === null) {
            // Unknown caller context, so assume this is from C++ code
            nocolor = true;
        }
    }
    catch (err) {
        // Access to caller function can be disabled in strict mode
        no_color = true;
    }

    if ( x === null )
        return colorize("null", mongo_hacker_config.colors['null'], nocolor);

    if ( x === undefined )
        return colorize("undefined", mongo_hacker_config.colors['undefined'], nocolor);

    if ( x.isObjectId ) {
        var color = mongo_hacker_config.colors['objectid'];
        return surround('ObjectId', colorize('"' + x.str + '"', color, nocolor));
    }

    if (!indent)
        indent = "";

    var s;
    switch ( typeof x ) {
    case "string": {
        s = "\"";
        for ( var i=0; i<x.length; i++ ){
            switch (x[i]){
                case '"': s += '\\"'; break;
                case '\\': s += '\\\\'; break;
                case '\b': s += '\\b'; break;
                case '\f': s += '\\f'; break;
                case '\n': s += '\\n'; break;
                case '\r': s += '\\r'; break;
                case '\t': s += '\\t'; break;

                default: {
                    var code = x.charCodeAt(i);
                    if (code < 0x20){
                        s += (code < 0x10 ? '\\u000' : '\\u00') + code.toString(16);
                    } else {
                        s += x[i];
                    }
                }
            }
        }
        s += "\"";
        return colorize(s, mongo_hacker_config.colors.string, nocolor);
    }
    case "number":
        return colorize(x, mongo_hacker_config.colors.number, nocolor);
    case "boolean":
        return colorize("" + x, mongo_hacker_config.colors['boolean'], nocolor);
    case "object": {
        s = tojsonObject( x, indent , nolint, nocolor, sortKeys );
        if ( ( nolint === null || nolint === true ) && s.length < 80 && ( indent === null || indent.length === 0 ) ){
            s = s.replace( /[\s\r\n ]+/gm , " " );
        }
        return s;
    }
    case "function":
        return colorize(x.toString(), mongo_hacker_config.colors['function'], nocolor);
    default:
        throw "tojson can't handle type " + ( typeof x );
    }

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

DBQuery.prototype._checkMulti = function(){
  if(this._limit > 0 || this._skip > 0){
    var ids = this.clone().select({_id: 1}).map(function(o){return o._id;});
    this._query['_id'] = {'$in': ids};
    return true;
  } else {
    return false;
  }
};

DBQuery.prototype.ugly = function(){
    this._prettyShell = false;
    return this;
}

DB.prototype.shutdownServer = function(opts) {
    if( "admin" != this._name ){
        return "shutdown command only works with the admin database; try 'use admin'";
    }

    cmd = {"shutdown" : 1};
    opts = opts || {};
    for (var o in opts) {
        cmd[o] = opts[o];
    }

    try {
        var res = this.runCommand(cmd);
        if( res )
            throw "shutdownServer failed: " + res.errmsg;
        throw "shutdownServer failed";
    }
    catch ( e ){
        assert( e.message.indexOf( "error doing query: failed" ) >= 0 , "unexpected error: " + tojson( e ) );
        print( "server should be down..." );
    }
}
