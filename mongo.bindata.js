BinData.prototype.tojson = function(indent , nolint) {
    return 'BinData(' + colorize(this.subtype(), "cyan") + ', ' + colorize('"' + this.base64() + '"', "cyan") + ')';
};