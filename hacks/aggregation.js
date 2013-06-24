function hasDollar(fields){
    for (k in fields){
        if(k.indexOf('$') !== -1){
            return true;
        };
    };
    return false;
}

// Aggregate extension to support alternate API
DBCollection.prototype.aggregate = function( ops ){
    if(arguments.length >= 1 && (hasDollar(ops) || hasDollar(ops[0]))){
        var arr = ops;

        if (!ops.length) {
            arr = [];
            for (var i=0; i<arguments.length; i++) {
                arr.push(arguments[i]);
            }
        }

        var res = this.runCommand("aggregate", {pipeline: arr});
        if (!res.ok) {
            printStackTrace();
            throw "aggregate failed: " + tojson(res);
        }
        return res;
    } else {
       return new AggHelper( this ).match( ops || {} );
    }
};

// Aggregation Framework Helper
AggHelper = function( collection, fields ){
    this.collection = collection;
    this.pipeline = [];
};

AggHelper.prototype.execute = function(){
    var res = this.collection.runCommand("aggregate", {pipeline: this.pipeline});
    if (!res.ok) {
        printStackTrace();
        throw "aggregate failed: " + tojson(res);
    }
    return res;
};

AggHelper.prototype.shellPrint = function(){
    this.execute().result.forEach(function(result){
        printjson(result);
    });
};

AggHelper.prototype.project = function( fields ){
    if(!fields){
        throw "project needs fields";
    }
    this.pipeline.push({"$project" : fields});
    return this;
};

AggHelper.prototype.match = function( criteria ){
    if(!criteria){
        throw "match needs a query object";
    }
    this.pipeline.push({"$match" : criteria});
    return this;
};

AggHelper.prototype.limit = function( limit ){
    if(!limit){
        throw "limit needs an integer indicating the max number of documents to limit";
    }
    this.pipeline.push({"$limit" : limit});
    return this;
};

AggHelper.prototype.skip = function( skip ){
    if(!skip){
        throw "skip needs an integer indicating the number of documents to skip";
    }
    this.pipeline.push({"$skip" : skip});
    return this;
};

AggHelper.prototype.unwind = function( field ){
    if(!field){
        throw "unwind needs a string indicating the key of an array field to unwind";
    }
    this.pipeline.push({"$unwind" : "$" + field});
    return this;
};

AggHelper.prototype.group = function( group_expression ){
    if(!group_expression){
        throw "group needs an group expression";
    }
    this.pipeline.push({"$group" : group_expression});
    return this;
};

AggHelper.prototype.sort = function( sort ){
    this.pipeline.push({"$sort" : sort});
    return this;
};
