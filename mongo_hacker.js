/* 
 *
 * Mongo Hacker
 * MongoDB Shell Enhancements for Hackers 
 *
 * Tyler J. Brock - 2013
 *
 * http://tylerbrock.github.com/mongo-hacker
 *
 */

__ansi = {
    csi: String.fromCharCode(0x1B) + '[',
    reset: '0',
    text_prop: 'm',
    foreground: '3',
    bright: '1',
    underline: '4',

    colors: {
        red: '1',
        green: '2',
        yellow: '3',
        blue: '4',
        magenta: '5',
        cyan: '6'
    }
};

if (_isWindows()) {
    print("\nSorry! MongoDB Shell Enhancements for Hackers isn't compatible with Windows.\n");
}

var ver = version().split(".");
if ( ver[0] <= parseInt("2", 10) && ver[1] < parseInt("2", 10) ) {
    print(colorize("\nSorry! MongoDB shell version 2.1+ required! Please upgrade.\n", "red", true));
}

setVerboseShell(true);
setIndexParanoia(true);

DBQuery.prototype._prettyShell = true

__indent = "  ";
// Type of function for legacy UUID objects (BinData with subtype = 3) rendering
// Values: "java", "c#", and "default"
uuidType = "java";

function setIndexParanoia( value ) {
    if( value === undefined ) value = true;
    _indexParanoia = value;
}

function controlCode( parameters ) {
    if ( parameters === undefined ) {
        parameters = "";
    }
    else if (typeof(parameters) == 'object' && (parameters instanceof Array)) {
        parameters = parameters.join(';');
    }

    return __ansi.csi + String(parameters) + String(__ansi.text_prop);
}

function applyColorCode( string, properties ) {
    return controlCode(properties) + String(string) + controlCode();
}

function colorize( string, color, bright, underline ) {
    var params = [];
    var code = __ansi.foreground + __ansi.colors[color];

    params.push(code);

    if ( bright === true ) params.push(__ansi.bright);
    if ( underline === true ) params.push(__ansi.underline);

    return applyColorCode( string, params );
}

function getEnv(env_var){
    clearRawMongoProgramOutput();
    run('env');
    var env = rawMongoProgramOutput();
    var env_regex = new RegExp(env_var + '=(.*)');
    return env.match(env_regex)[1];
}

ObjectId.prototype.toString = function() {
    return this.str;
};

ObjectId.prototype.tojson = function(indent, nolint) {
    return tojson(this);
};

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
    var startTime = new Date().getTime();
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
        var time = new Date().getTime() - startTime;
        var slowms = this.getProfilingStatus().slowms;
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
  if(this._limit > 0 || this._skip > 0){
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

Date.prototype.tojson = function() {

    var UTC = Date.printAsUTC ? 'UTC' : '';

    var year = this['get'+UTC+'FullYear']().zeroPad(4);
    var month = (this['get'+UTC+'Month']() + 1).zeroPad(2);
    var date = this['get'+UTC+'Date']().zeroPad(2);
    var hour = this['get'+UTC+'Hours']().zeroPad(2);
    var minute = this['get'+UTC+'Minutes']().zeroPad(2);
    var sec = this['get'+UTC+'Seconds']().zeroPad(2);

    if (this['get'+UTC+'Milliseconds']())
        sec += '.' + this['get'+UTC+'Milliseconds']().zeroPad(3);

    var ofs = 'Z';
    if (!Date.printAsUTC) {
        var ofsmin = this.getTimezoneOffset();
        if (ofsmin !== 0){
            ofs = ofsmin > 0 ? '-' : '+'; // This is correct
            ofs += (ofsmin/60).zeroPad(2);
            ofs += (ofsmin%60).zeroPad(2);
        }
    }

    var isodate =  colorize('"' + [year, month, date].join('-') + 'T' + hour +':' + minute + ':' + sec + ofs + '"', "cyan");
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

NumberLong.prototype.tojson = function() {
    return 'NumberLong(' + colorize('"' + this.toString().match(/-?\d+/)[0] + '"', "red") + ')';
};

NumberInt.prototype.tojson = function() {
    return 'NumberInt(' + colorize('"' + this.toString().match(/-?\d+/)[0] + '"', "red") + ')';
};

function base64ToHex(base64) {
    var base64Digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var hexDigits = "0123456789abcdef";
    var hex = "";
    for (var i = 0; i < 24; ) {
        var e1 = base64Digits.indexOf(base64[i++]);
        var e2 = base64Digits.indexOf(base64[i++]);
        var e3 = base64Digits.indexOf(base64[i++]);
        var e4 = base64Digits.indexOf(base64[i++]);
        var c1 = (e1 << 2) | (e2 >> 4);
        var c2 = ((e2 & 15) << 4) | (e3 >> 2);
        var c3 = ((e3 & 3) << 6) | e4;
        hex += hexDigits[c1 >> 4];
        hex += hexDigits[c1 & 15];
        if (e3 != 64) {
            hex += hexDigits[c2 >> 4];
            hex += hexDigits[c2 & 15];
        }
        if (e4 != 64) {
            hex += hexDigits[c3 >> 4];
            hex += hexDigits[c3 & 15];
        }
    }
    return hex;
}

function hexToBase64(hex) {
    var base64Digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var base64 = "";
    var group;
    for (var i = 0; i < 30; i += 6) {
        group = parseInt(hex.substr(i, 6), 16);
        base64 += base64Digits[(group >> 18) & 0x3f];
        base64 += base64Digits[(group >> 12) & 0x3f];
        base64 += base64Digits[(group >> 6) & 0x3f];
        base64 += base64Digits[group & 0x3f];
    }
    group = parseInt(hex.substr(30, 2), 16);
    base64 += base64Digits[(group >> 2) & 0x3f];
    base64 += base64Digits[(group << 4) & 0x3f];
    base64 += "==";
    return base64;
}

var platformSpecificUuidModifications = {
    "java": function (hex) {
        var msb = hex.substr(0, 16);
        var lsb = hex.substr(16, 16);
        msb = msb.substr(14, 2) + msb.substr(12, 2) + msb.substr(10, 2) + msb.substr(8, 2)
            + msb.substr(6, 2) + msb.substr(4, 2) + msb.substr(2, 2) + msb.substr(0, 2);
        lsb = lsb.substr(14, 2) + lsb.substr(12, 2) + lsb.substr(10, 2) + lsb.substr(8, 2)
            + lsb.substr(6, 2) + lsb.substr(4, 2) + lsb.substr(2, 2) + lsb.substr(0, 2);
        return msb + lsb;
    },
    "c#": function (hex) {
        return hex.substr(6, 2) + hex.substr(4, 2) + hex.substr(2, 2) + hex.substr(0, 2)
            + hex.substr(10, 2) + hex.substr(8, 2) + hex.substr(14, 2) + hex.substr(12, 2)
            + hex.substr(16, 16);
    },
    "default": function (hex) {
        return hex;
    }
};

function UUID(uuid, type) {
    var hex = uuid.replace(/[{}-]/g, "");
    var typeNum = 4;
    if (type != undefined) {
        typeNum = 3;
        hex = platformSpecificUuidModifications[type](hex);
    }
    return new BinData(typeNum, hexToBase64(hex));
}

function uuidToString(uuid, uuidType) {
    var hex = platformSpecificUuidModifications[uuidType](base64ToHex(uuid.base64()));
    return hex.substr(0, 8) + '-' + hex.substr(8, 4) + '-' + hex.substr(12, 4)
        + '-' + hex.substr(16, 4) + '-' + hex.substr(20, 12);
}

BinData.prototype.tojson = function(indent , nolint) {
    if (this.subtype() === 3) {
        return 'UUID(' + colorize('"' + uuidToString(this, uuidType) + '"', "cyan") + ', ' + colorize('"' + uuidType + '"', "cyan") +')'
    } else if (this.subtype() === 4) {
        return 'UUID(' + colorize('"' + uuidToString(this, "default") + '"', "cyan") + ')'
    } else {
        return 'BinData(' + colorize(this.subtype(), "red") + ', ' + colorize('"' + this.base64() + '"', "green", true) + ')';
    }
};

tojson = function( x, indent , nolint ) {
    if ( x === null )
        return colorize("null", "red", true);

    if ( x === undefined )
        return colorize("undefined", "magenta", true);

    if ( x.isObjectId ) {
        return 'ObjectId(' + colorize('"' + x.str + '"', "green", false, true) + ')';
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
        return colorize(s, "green", true);
    }
    case "number":
        return colorize(x, "red");
    case "boolean":
        return colorize("" + x, "blue");
    case "object": {
        s = tojsonObject( x, indent , nolint );
        if ( ( nolint === null || nolint === true ) && s.length < 80 && ( indent === null || indent.length === 0 ) ){
            s = s.replace( /[\s\r\n ]+/gm , " " );
        }
        return s;
    }
    case "function":
        return colorize(x.toString(), "magenta");
    default:
        throw "tojson can't handle type " + ( typeof x );
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
    for ( var key in keys ){

        var val = x[key];
        if ( val == DB.prototype || val == DBCollection.prototype )
            continue;

        s += indent + colorize("\"" + key + "\"", "yellow") + ": " + tojson( val, indent , nolint );
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

// Improve the default prompt with hostname, process type, and version
prompt = function() {
    var serverstatus = db.serverStatus();
    var host = serverstatus.host.split('.')[0];
    var process = serverstatus.process;
    var version = db.serverBuildInfo().version;
    var repl_set = db._adminCommand({"replSetGetStatus": 1}).ok !== 0;
    var rs_state = '';
    if(repl_set) {
        rs_state = db.isMaster().ismaster ? '[primary]' : '[secondary]';
    }
    var mongos = db.isMaster().msg == 'isdbgrid';
    var state = mongos ? '' : rs_state;
    return host + '(' + process + '-' + version + ')' + state + ' ' + db + '> ';
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
            var slowms = this._db.getProfilingStatus().slowms;
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
