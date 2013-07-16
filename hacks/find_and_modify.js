//----------------------------------------------------------------------------
// findAndModify Helper
//----------------------------------------------------------------------------
DBQuery.prototype._findAndModify = function( options ) {
    var findAndModify = {
        'findandmodify': this._collection.getName(),
        'query': this._query,
        'new': true,
        'fields': this._fields,
        'upsert': this._upsert || false,
        'sort': this._query.orderby || {},
    };

    for (var key in options){
        findAndModify[key] = options[key];
    };

    var result = this._db.runCommand( findAndModify );
    if ( ! result.ok ){
        throw "findAndModifyFailed failed: " + tojson( result );
    };
    return result.value;
};

//----------------------------------------------------------------------------
// findAndModify Terminal Variants
//----------------------------------------------------------------------------
DBQuery.prototype.updateAndGet = function( update ) {
    return this._findAndModify({ 'update': update });
};

DBQuery.prototype.getAndUpdate = function( update ) {
    return this._findAndModify({ 'update': update, 'new': false });
};

DBQuery.prototype.replaceAndGet = function( replacement ) {
    return this._findAndModify({ 'update': replacement });
};

DBQuery.prototype.getAndReplace = function( replacement ) {
    return this._findAndModify({ 'update': replacement, 'new': false });
};

DBQuery.prototype.getAndRemove = function() {
    return this._findAndModify({ 'remove': true })
};