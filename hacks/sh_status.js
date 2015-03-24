sh.getRecentMigrations = function () {
    var configDB = db.getSiblingDB("config");
    var yesterday = new Date( new Date() - 24 * 60 * 60 * 1000 );
    var result = [];
    result = result.concat(configDB.changelog.aggregate( [
        { $match : { time : { $gt : yesterday }, what : "moveChunk.from", "details.errmsg" : {
            "$exists" : false } } },
        { $group : { _id: { msg: "$details.errmsg" }, count : { "$sum":1 } } },
        { $project : { _id : { $ifNull: [ "$_id.msg", "Success" ] }, count : "$count" } }
    ] ).result);
    result = result.concat(configDB.changelog.aggregate( [
        { $match : { time : { $gt : yesterday }, what : "moveChunk.from", "details.errmsg" : {
            "$exists" : true } } },
        { $group : { _id: { msg: "$details.errmsg", from : "$details.from", to: "$details.to" },
            count : { "$sum":1 } } },
        { $project : { _id : "$_id.msg" , from : "$_id.from", to : "$_id.to" , count : "$count" } }
    ] ).result);
    return result;
};

printShardingStatus = function( configDB , verbose ){
    if (configDB === undefined)
        configDB = db.getSisterDB('config')

    var version = configDB.getCollection( "version" ).findOne();
    if ( version == null ){
        print( "printShardingStatus: this db does not have sharding enabled. be sure you are",
                "connecting to a mongos from the shell and not to a mongod." );
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

    // All of the balancer information functions below depend on a connection to a liveDB
    // This isn't normally a problem, but can cause issues in testing and running with --nodb
    if ( typeof db !== "undefined" ) {
        output( "  balancer:" );

        //Is the balancer currently enabled
        output( "\tCurrently enabled:  " + ( sh.getBalancerState() ?
            colorize("yes", {color: "cyan"}) :
            colorize("no",  {color: "red"}) ) );

        //Is the balancer currently active
        output( "\tCurrently running:  " +
            colorize(( sh.isBalancerRunning() ? "yes" : "no" ), {color: "gray"}) );

        //Output details of the current balancer round
        var balLock = sh.getBalancerLockDetails();
        if ( balLock ) {
            output( "\t\tBalancer lock taken at " +
                colorize(balLock.when, {color: "gray"}) + " by " +
                colorize(balLock.who,  {color: "cyan"}) );
        }

        //Output the balancer window
        var balSettings = sh.getBalancerWindow();
        if ( balSettings ) {
            output( "\t\tBalancer active window is set between " +
                colorize(balSettings.start, {color: "gray"}) + " and " +
                colorize(balSettings.stop,  {color: "gray"}) + " server local time");
        }

        //Output the list of active migrations
        var activeMigrations = sh.getActiveMigrations();
        if (activeMigrations.length > 0 ){
            output("\tCollections with active migrations: ");
            activeMigrations.forEach( function(migration){
                output("\t\t" + 
                    colorize(migration._id,  {color: "cyan"})+ " started at " + 
                    colorize(migration.when, {color: "gray"}) );
            });
        }

        // Actionlog and version checking only works on 2.7 and greater
        var versionHasActionlog = false;
        var metaDataVersion = configDB.getCollection("version").findOne().currentVersion;
        if ( metaDataVersion > 5 ) {
            versionHasActionlog = true;
        }
        if ( metaDataVersion == 5 ) {
            var verArray = db.serverBuildInfo().versionArray;
            if (verArray[0] == 2 && verArray[1] > 6){
                versionHasActionlog = true;
            }
        }

        if ( versionHasActionlog ) {
            //Review config.actionlog for errors
            var actionReport = sh.getRecentFailedRounds();
            //Always print the number of failed rounds
            output( "\tFailed balancer rounds in last 5 attempts:  " + 
                colorize(actionReport.count, {color: "red"}) );

            //Only print the errors if there are any
            if ( actionReport.count > 0 ){
                output( "\tLast reported error:  "    + actionReport.lastErr );
                output( "\tTime of Reported error:  " + actionReport.lastTime );
            }

            output("\tMigration Results for the last 24 hours: ");
            var migrations = sh.getRecentMigrations();
            if(migrations.length > 0) {
                migrations.forEach( function(x) {
                    if (x._id === "Success"){
                        output( "\t\t" + colorize(x.count, {color: "gray"}) + 
                            " : "+ colorize(x._id, {color: "cyan"}));
                    } else {
                        output( "\t\t" + colorize(x.count, {color: "gray"}) + 
                            " : Failed with error '" + colorize(x._id, {color: "red"}) +
                        "', from " + x.from + " to " + x.to );
                    }
                });
            } else {
                    output( "\t\tNo recent migrations");
            }
        }
    }

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
                                { "$group": { _id: "$shard", nChunks: { "$sum": 1 } } },
                                { "$project" : { _id : 0 , shard : "$_id" , nChunks : "$nChunks" } },
                                { "$sort" : { shard : 1 } }
                            ).result

                            var totalChunks = 0;
                            res.forEach( function(z){
                                totalChunks += z.nChunks;
                                output( "        " + z.shard + ": " + z.nChunks );
                            } )

                            if ( totalChunks < 20 || verbose ){
                                configDB.chunks.find( { "ns" : coll._id } ).sort( { min : 1 } ).forEach(
                                    function(chunk){
                                        output( "        " +
                                            tojson( chunk.min, 0, true) + " -> " +
                                            tojson( chunk.max, 0, true ) +
                                            " on: " + colorize(chunk.shard, {color: 'cyan'}) + " " + tojson( chunk.lastmod ) + " " +
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
