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