__indent = Array(mongo_hacker_config.indent + 1).join(' ');

ObjectId.prototype.toString = function() {
    return this.str;
};

ObjectId.prototype.tojson = function(indent, nolint) {
    return tojson(this);
};

var dateToJson = Date.prototype.tojson;

Date.prototype.tojson = function() {
  var isoDateString = dateToJson.call(this);
  var dateString = isoDateString.substring(8, isoDateString.length-1);

  var isodate = colorize(dateString, mongo_hacker_config.colors.date);
  return 'ISODate(' + isodate + ')';
};

Array.tojson = function( a , indent , nolint ){
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
        s += indent + tojson( a[i], indent , nolint );
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

NumberLong.prototype.tojson = function() {
    var color = mongo_hacker_config.colors.number;
    var output = colorize('"' + this.toString().match(/-?\d+/)[0] + '"', color);
    return surround('NumberLong', output);
};

NumberInt.prototype.tojson = function() {
    var color = mongo_hacker_config.colors.number;
    var output = colorize('"' + this.toString().match(/-?\d+/)[0] + '"', color);
    return surround('NumberInt', output);
};

BinData.prototype.tojson = function(indent , nolint) {
    var uuidType = mongo_hacker_config.uuid_type;
    var uuidColor = mongo_hacker_config.colors.uuid;
    var binDataColor = mongo_hacker_config.colors.binData;

    if (this.subtype() === 3) {
        var ouput = colorize('"' + uuidToString(this) + '"', color) + ', '
        output += colorize('"' + uuidType + '"', uuidColor)
        return surround('UUID', output);
    } else if (this.subtype() === 4) {
        var output = colorize('"' + uuidToString(this, "default") + '"', uuidColor) + ')'
        return surround('UUID', output);
    } else {
        var output = colorize(this.subtype(), {color: 'red'}) + ', '
        output += colorize('"' + this.base64() + '"', binDataColor)
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
            var fetched = "Fetched " + n + " record(s) in ";
            if (time > slowms) {
                fetched += colorize(time + "ms", { color: "red", bright: true });
            } else {
                fetched += colorize(time + "ms", { color: "green", bright: true });
            }
            output.push(fetched);
        }

        var paranoia = mongo_hacker_config.index_paranoia;

        if (typeof paranoia !== 'undefined' && paranoia) {
            var explain = this.clone();
            explain._ensureSpecial();
            explain._query.$explain = true;
            explain._limit = Math.abs(n._limit) * -1;
            var result = explain.next();
            var type = result.cursor;

            if (type !== undefined) {
                var index_use = "Index[";
                if (type == "BasicCursor") {
                    index_use += colorize( "none", { color: "red", bright: true });
                } else {
                    index_use += colorize( result.cursor.substring(12), { color: "green", bright: true });
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

tojsonObject = function( x, indent, nolint ) {
    var lineEnding = nolint ? " " : "\n";
    var tabSpace = nolint ? "" : __indent;

    assert.eq( ( typeof x ) , "object" , "tojsonObject needs object, not [" + ( typeof x ) + "]" );

    if (!indent)
        indent = "";

    if ( typeof( x.tojson ) == "function" && x.tojson != tojson ) {
        return x.tojson(indent,nolint);
    }

    if ( x.constructor && typeof( x.constructor.tojson ) == "function" && x.constructor.tojson != tojson ) {
        return x.constructor.tojson( x, indent , nolint );
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

    if ( mongo_hacker_config.sort_keys ) {
      keylist.sort();
    }

    for ( var i=0; i<keylist.length; i++) {
        var key=keylist[i];

        var val = x[key];
        if ( val == DB.prototype || val == DBCollection.prototype )
            continue;

        var color = mongo_hacker_config.colors.key;
        s += indent + colorize("\"" + key + "\"", color) + ": " + tojson( val, indent , nolint );
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


tojson = function( x, indent , nolint ) {
    if ( x === null )
        return colorize("null", mongo_hacker_config.colors['null']);

    if ( x === undefined )
        return colorize("undefined", mongo_hacker_config.colors['undefined']);

    if ( x.isObjectId ) {
        var color = mongo_hacker_config.colors['objectid'];
        return surround('ObjectId', colorize('"' + x.str + '"', color));
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
        return colorize(s, mongo_hacker_config.colors.string);
    }
    case "number":
        return colorize(x, mongo_hacker_config.colors.number);
    case "boolean":
        return colorize("" + x, mongo_hacker_config.colors['boolean']);
    case "object": {
        s = tojsonObject( x, indent , nolint );
        if ( ( nolint === null || nolint === true ) && s.length < 80 && ( indent === null || indent.length === 0 ) ){
            s = s.replace( /[\s\r\n ]+/gm , " " );
        }
        return s;
    }
    case "function":
        return colorize(x.toString(), mongo_hacker_config.colors['function']);
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
