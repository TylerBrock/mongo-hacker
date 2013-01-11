ObjectId.prototype.toString = function() {
    return this.str;
};

ObjectId.prototype.tojson = function(indent, nolint) {
    return tojson(this);
};

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

    var isodate =  colorize('"' + year + "-" + month + "-" + date + 'T' + hour +':' + minute + ':' + sec + ofs + '"', "cyan");
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

Array.prototype.shellPrint = function(){
    print(tojson(this, "", false))
};

bson_object.prototype.shellPrint = function(){
    print(tojson(this, "", false))
};