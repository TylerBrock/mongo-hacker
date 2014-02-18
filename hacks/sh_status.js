printShardingStatus = function( configDB , verbose ){
    if (configDB === undefined)
        configDB = db.getSisterDB('config')

    var version = configDB.getCollection( "version" ).findOne();
    if ( version == null ){
        print( "printShardingStatus: this db does not have sharding enabled. be sure you are connecting to a mongos from the shell and not to a mongod." );
        return;
    }

    var raw = "";
    var output = function(s){
        raw += s + "\n";
    }
    output( "--- Sharding Status --- " );
    output( "  sharding version: " + tojson( configDB.getCollection( "version" ).findOne(), "  " ) );

    output( "  shards:" );
    configDB.shards.find().sort( { _id : 1 } ).forEach(
        function(z){
            output( "    " + tojsononeline( z ) );
        }
    );

    output( "  databases:" );
    configDB.databases.find().sort( { name : 1 } ).forEach(
        function(db){
            output( "    " + tojsononeline(db,"",true) );

            if (db.partitioned){
                configDB.collections.find( { _id : new RegExp( "^" +
                    RegExp.escape(db._id) + "\\." ) } ).
                    sort( { _id : 1 } ).forEach( function( coll ){
                        if ( coll.dropped == false ){
                            output( "    " + coll._id );
                            output( "      shard key: " + tojson(coll.key, 0, true) );
                            output( "      chunks:" );

                            res = configDB.chunks.aggregate(
                                { "$match": { ns: coll._id } },
                                { "$group": { _id: "$shard", nChunks: { "$sum": 1 } } }
                            ).result

                            var totalChunks = 0;
                            res.forEach( function(z){
                                totalChunks += z.nChunks;
                                output( "        " + z._id + ": " + z.nChunks );
                            } )

                            if ( totalChunks < 20 || verbose ){
                                configDB.chunks.find( { "ns" : coll._id } ).sort( { min : 1 } ).forEach(
                                    function(chunk){
                                        output( "        " +
                                            tojson( chunk.min, 0, true) + " -> " +
                                            tojson( chunk.max, 0, true ) +
                                            " on: " + colorize(chunk.shard, {color: 'cyan'}) + " " +
                                            ( chunk.jumbo ? "jumbo " : "" )
                                        );
                                    }
                                );
                            }
                            else {
                                output( "\t\t\ttoo many chunks to print, use verbose if you want to force print" );
                            }

                            configDB.tags.find( { ns : coll._id } ).sort( { min : 1 } ).forEach(
                                function( tag ) {
                                    output( "        tag: " + tag.tag + "  " + tojson( tag.min ) + " -> " + tojson( tag.max ) );
                                }
                            )
                        }
                    }
                )
            }
        }
    );

    print( raw );
}
