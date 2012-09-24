/*
 *
 * Colorize the shell
 *
 * Tyler J. Brock - 2012
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

ObjectId.prototype.tojson = function(indent, nolint) {
    return tojson(this);
}

Date.prototype.tojson = function() {

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

Array.tojson = function( a , indent , nolint ){
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
        s += indent + tojson( a[i], indent , nolint );
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
        var s = tojsonObject( x, indent , nolint );
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

tojsonObject = function( x, indent , nolint ) {
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

        s += indent + colorize("\"" + k + "\"", "yellow") + ": " + tojson( val, indent , nolint );
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

DBQuery.prototype.shellPrint = function(){
    try {
        var start = new Date().getTime();
        var n = 0;
        while ( this.hasNext() && n < DBQuery.shellBatchSize ){
            var s = this._prettyShell ? tojson( this.next() ) : tojson( this.next() , "" , true );
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
