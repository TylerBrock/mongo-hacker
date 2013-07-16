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
DBQuery.prototype.updateOneAndGet = function( update ) {
    // TODO: ensure only $ keys
    return this._findAndModify({ 'update': update });
};

DBQuery.prototype.getOneAndUpdate = function( update ) {
    // TODO: ensure only $ keys
    return this._findAndModify({ 'update': update, 'new': false });
};

DBQuery.prototype.replaceOneAndGet = function( replacement ) {
    // TODO: ensure no $ keys
    return this._findAndModify({ 'update': replacement });
};

DBQuery.prototype.getOneAndReplace = function( replacement ) {
    // TODO: ensure no $ keys
    return this._findAndModify({ 'update': replacement, 'new': false });
};

DBQuery.prototype.getOneAndRemove = function() {
    return this._findAndModify({ 'remove': true })
};