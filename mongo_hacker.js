/* 
 *
 * Mongo Hacker
 * MongoDB Shell Enhancements for Hackers 
 *
 * Tyler J. Brock - 2012
 *
 * http://tylerbrock.github.com/mongo-hacker
 *
 */

var _tabular_defaults = {
    // How many rows to show by default
    limit: 20,

    // Columns longer than this will be truncated
    maxlen: 50,

    // Undefined field values will be output using this string
    undef: '',
};

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
}

if (_isWindows()) {
  print("\nSorry! MongoDB Shell Enhancements for Hackers isn't compatible with Windows.\n");
}

var ver = db.version().split(".");
if ( ver[0] <= parseInt("2") && ver[1] < parseInt("2") ) {
  print(colorize("\nSorry! Mongo version 2.2.x and above is required! Please upgrade.\n", "red", true));
} 

setVerboseShell(true);
setIndexParanoia(true);
setAutoMulti(true);

__indent = "  "

function setIndexParanoia( value ) { 
    if( value == undefined ) value = true; 
    _indexParanoia = value; 
}

function setAutoMulti( value ) { 
    if( value == undefined ) value = true; 
    _autoMulti = value; 
}

function controlCode( parameters ) {
    if ( parameters == undefined ) {
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

    if ( bright == true ) params.push(__ansi.bright);
    if ( underline == true ) params.push(__ansi.underline);

    return applyColorCode( string, params );
}

ObjectId.prototype.toString = function() {
    return this.str;
}

ObjectId.prototype.tojson_c = function(indent, nolint) {
    return tojson_c(this);
}

Date.prototype.tojson_c = function() {

    var UTC = Date.printAsUTC ? 'UTC' : '';

    var year = this['get'+UTC+'FullYear']().zeroPad(4);
    var month = (this['get'+UTC+'Month']() + 1).zeroPad(2);
    var date = this['get'+UTC+'Date']().zeroPad(2);
    var hour = this['get'+UTC+'Hours']().zeroPad(2);
    var minute = this['get'+UTC+'Minutes']().zeroPad(2);
    var sec = this['get'+UTC+'Seconds']().zeroPad(2)

    if (this['get'+UTC+'Milliseconds']())
        sec += '.' + this['get'+UTC+'Milliseconds']().zeroPad(3)

    var ofs = 'Z';
    if (!Date.printAsUTC) {
        var ofsmin = this.getTimezoneOffset();
        if (ofsmin != 0){
            ofs = ofsmin > 0 ? '-' : '+'; // This is correct
            ofs += (ofsmin/60).zeroPad(2)
            ofs += (ofsmin%60).zeroPad(2)
        }
    }

    var date =  colorize('"' + year + month + date + 'T' + hour +':' + minute + ':' + sec + ofs + '"', "cyan");
    return 'ISODate(' + date + ')';
}

NumberLong.prototype.tojson_c = function(indent , nolint) {
    return colorize(this.toNumber().toString()+"L", "red");
}

Array.tojson_c = function( a , indent , nolint ){
    var lineEnding = nolint ? " " : "\n";

    if (!indent)
        indent = "";

    if ( nolint )
        indent = "";

    if (a.length == 0) {
        return "[ ]";
    }

    var s = "[" + lineEnding;
    indent += __indent;
    for ( var i=0; i<a.length; i++){
        s += indent + tojson_c( a[i], indent , nolint );
        if ( i < a.length - 1 ){
            s += "," + lineEnding;
        }
    }
    if ( a.length == 0 ) {
        s += indent;
    }

    indent = indent.substring(__indent.length);
    s += lineEnding+indent+"]";
    return s;
}


tojson_c = function( x, indent , nolint ) {
    if ( x === null )
        return colorize("null", "red", true);
    
    if ( x === undefined )
        return colorize("undefined", "magenta", true);

    if ( x.isObjectId ) {
        return 'ObjectId(' + colorize('"' + x.str + '"', "green", false, true) + ')';
    }
    
    if (!indent) 
        indent = "";

    switch ( typeof x ) {
    case "string": {
        var s = "\"";
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
        s += "\""
        return colorize(s, "green", true);
    }
    case "number":
        return colorize(x, "red") 
    case "boolean":
        return colorize("" + x, "blue");
    case "object": {
        var s = tojsonObject_c( x, indent , nolint );
        if ( ( nolint == null || nolint == true ) && s.length < 80 && ( indent == null || indent.length == 0 ) ){
            s = s.replace( /[\s\r\n ]+/gm , " " );
        }
        return s;
    }
    case "function":
        return colorize(x.toString(), "magenta")
    default:
        throw "tojson can't handle type " + ( typeof x );
    }
    
}

tojsonObject_c = function( x, indent , nolint ) {
    var lineEnding = nolint ? " " : "\n";
    var tabSpace = nolint ? "" : __indent;
    
    assert.eq( ( typeof x ) , "object" , "tojsonObject needs object, not [" + ( typeof x ) + "]" );

    if (!indent) 
        indent = "";
    
    if ( typeof( x.tojson ) == "function" && x.tojson != tojson_c ) {
        return x.tojson_c(indent,nolint);
    }
    
    if ( x.constructor && typeof( x.constructor.tojson ) == "function" && x.constructor.tojson != tojson_c ) {
        return x.constructor.tojson_c( x, indent , nolint );
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
    if ( total == 0 ) {
        s += indent + lineEnding;
    }

    var keys = x;
    if ( typeof( x._simpleKeys ) == "function" )
        keys = x._simpleKeys();
    var num = 1;
    for ( var k in keys ){
        
        var val = x[k];
        if ( val == DB.prototype || val == DBCollection.prototype )
            continue;

        s += indent + colorize("\"" + k + "\"", "yellow") + ": " + tojson_c( val, indent , nolint );
        if (num != total) {
            s += ",";
            num++;
        }
        s += lineEnding;
    }

    // pop one level of indent
    indent = indent.substring(__indent.length);
    return s + indent + "}";
}

// Hardcode multi update -- now you only need to remember upsert
DBCollection.prototype.update = function( query , obj , upsert, multi ) {
    assert( query , "need a query" );
    assert( obj , "need an object" );

    var firstKey = null;
    for (var k in obj) { firstKey = k; break; }

    if (firstKey != null && firstKey[0] == '$') {
        // for mods we only validate partially, for example keys may have dots
        this._validateObject( obj );
    } else {
        // we're basically inserting a brand new object, do full validation
        this._validateForStorage( obj );
    }

    // can pass options via object for improved readability    
    if ( typeof(upsert) === 'object' ) {
        assert( multi === undefined, "Fourth argument must be empty when specifying upsert and multi with an object." );

        opts = upsert;
        multi = opts.multi;
        upsert = opts.upsert;
    }

    this._db._initExtraInfo();
    this._mongo.update( this._fullName , query , obj , upsert ? true : false , _autoMulti ? true : multi );
    this._db._getExtraInfo("Updated");
}

// Override group because map/reduce style is deprecated
DBCollection.prototype.agg_group = function( name, group_field, operation, op_value, filter ) {
    var ops = [];
    var group_op = { $group: { _id: '$' + group_field } };

    if (filter != undefined) {
        ops.push({ '$match': filter })
    }
  
    group_op['$group'][name] = { };
    group_op['$group'][name]['$' + operation] = op_value
    ops.push(group_op);

    return this.aggregate(ops);
}

// Function that groups and counts by group after applying filter
DBCollection.prototype.gcount = function( group_field, filter ) {
    return this.agg_group('count', group_field, 'sum', 1, filter);
}

// Function that groups and sums sum_field after applying filter
DBCollection.prototype.gsum = function( group_field, sum_field, filter ) {
    return this.agg_group('sum', group_field, 'sum', '$' + sum_field, filter);
}

// Function that groups and averages avg_feld after applying filter
DBCollection.prototype.gavg = function( group_field, avg_field, filter ) {
    return this.agg_group('avg', group_field, 'avg', '$' + avg_field, filter);
}

// Improve the default prompt with hostname, process type, and version
prompt = function() {
    var serverstatus = db.serverStatus();
    var host = serverstatus.host.split('.')[0];
    var process = serverstatus.process;
    var version = db.serverBuildInfo().version;
    return host + '(' + process + '-' + version + ') ' + db + '> ';
}

DBQuery.prototype.shellPrint = function(){
    try {
        var start = new Date().getTime();
        var n = 0;
        while ( this.hasNext() && n < DBQuery.shellBatchSize ){
            var s = this._prettyShell ? tojson_c( this.next() ) : tojson_c( this.next() , "" , true );
            print( s );
            n++;
        }

        var output = []

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
            var index_use = "Index["
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

}

_tabular_encode = function(obj, opts, tojson) {
    if ( obj === undefined ) {
        return opts.undef;
    }
    if ( obj instanceof ObjectId ) {
        return obj.valueOf();
    }
    ret = tojson(obj, false, true);

    if ( ret.length > opts.maxlen ) {
        ret = ret.slice(0, opts.maxlen - 3) + '...';
        ret = ret.replace("\t", "", 'g')
    }

    return ret;
};
DBQuery.prototype.tabular = function(opts) {
    if ( typeof(opts) == 'object' ) {
        opts.limit  = (typeof(opts.limit)  != 'undefined') ? opts.limit  : _tabular_defaults.limit;
        opts.maxlen = (typeof(opts.maxlen) != 'undefined') ? opts.maxlen : _tabular_defaults.maxlen;
        opts.undef  = (typeof(opts.undef)  != 'undefined') ? opts.undef  : _tabular_defaults.undef;
    }
    else if ( typeof(opts) == 'number' ) {
        opts.limit  = opts;
        opts.maxlen = _tabular_defaults.maxlen;
        opts.undef  = _tabular_defaults.undef;
    }
    else {
        opts = _tabular_defaults;
    }

    var field_length = { '_id': 24 };

    var docs = this.limit(opts.limit).toArray();

    docs.forEach(function(doc) {
        var field;
        for ( field in doc ) {
            var value = _tabular_encode(doc[field], opts, tojson);
            if ( !field_length[field] ) {
                field_length[field] = field.length;
            }
            if ( field_length[field] < value.length ) {
                field_length[field] = value.length;
            }
        }
    });

    var field;
    var fields = [];
    var output = '';

    for ( field in field_length ) {
        fields.push(field);
    }

    // Divider
    var divider = '+';
    fields.forEach(function(field) {
        var width = field_length[field];
        divider += Array(width+3).join('-');
        divider += '+';
    });

    var header = '| ';
    // Title row
    fields.forEach(function(field) {
        var width = field_length[field];
        var lpad = Math.floor((width - field.length)/2);
        var rpad = width - lpad - field.length;
        header += Array(lpad+1).join(' ') + field + Array(rpad+1).join(' ');
        header += ' | ';
    });

    output += divider + "\n";
    output += header + "\n";
    output += divider + "\n";

    // Rows
    docs.forEach(function(doc) {
        var row = '| ';
        fields.forEach(function(field) {
            var value    = _tabular_encode(doc[field], opts, tojson);
            var rawvalue = _tabular_encode(doc[field], opts, tojson);
            var width = field_length[field];
            var rpad = Math.floor(width - rawvalue.length);
            row += value + Array(rpad+1).join(' ');
            row += ' | ';
        });
        output += row + "\n";
    });

    output += divider + "\n";
    return output;
};
DBQuery.prototype.t = DBQuery.prototype.tabular;
