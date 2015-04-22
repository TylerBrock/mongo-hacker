// Better show dbs
shellHelper.show = function (what) {
    assert(typeof what == "string");

    var args = what.split( /\s+/ );
    what = args[0]
    args = args.splice(1)

    if (what == "profile") {
        if (db.system.profile.count() == 0) {
            print("db.system.profile is empty");
            print("Use db.setProfilingLevel(2) will enable profiling");
            print("Use db.system.profile.find() to show raw profile entries");
        }
        else {
            print();
            db.system.profile.find({ millis: { $gt: 0} }).sort({ $natural: -1 }).limit(5).forEach(
                function (x) {
                    print("" + x.op + "\t" + x.ns + " " + x.millis + "ms " + String(x.ts).substring(0, 24));
                    var l = "";
                    for ( var z in x ){
                        if ( z == "op" || z == "ns" || z == "millis" || z == "ts" )
                            continue;

                        var val = x[z];
                        var mytype = typeof(val);

                        if ( mytype == "string" ||
                             mytype == "number" )
                            l += z + ":" + val + " ";
                        else if ( mytype == "object" )
                            l += z + ":" + tojson(val ) + " ";
                        else if ( mytype == "boolean" )
                            l += z + " ";
                        else
                            l += z + ":" + val + " ";

                    }
                    print( l );
                    print("\n");
                }
            )
        }
        return "";
    }

    if (what == "users") {
        db.getUsers().forEach(printjson);
        return "";
    }

    if (what == "roles") {
        db.getRoles({showBuiltinRoles: true}).forEach(printjson);
        return "";
    }

    if (what == "collections" || what == "tables") {
        var collectionNames = db.getCollectionNames();
        var collectionSizes = collectionNames.map(function (name) {
            var stats = db.getCollection(name).stats();
            var size = (stats.size / 1024 / 1024).toFixed(3);
            var storageSize = (stats.storageSize / 1024 / 1024).toFixed(3);
            return (size + "MB / " + storageSize + "MB");
        });
        printPaddedColumns(collectionNames, collectionSizes);
        return "";
    }

    if (what == "dbs" || what == "databases") {
        var dbinfo = [];
        var maxNameLength = maxLength(db.getMongo().getDatabaseNames());
        var maxGbDigits = 0;

        db.getMongo().getDBs().databases.forEach(function (x){
            var sizeStr = (x.sizeOnDisk / 1024 / 1024 / 1024).toFixed(3);
            var gbDigits = sizeStr.indexOf(".");

            if( gbDigits > maxGbDigits ) maxGbDigits = gbDigits;

            dbinfo.push({
                name:      x.name,
                size_str:  (x.sizeOnDisk > 1) ? (sizeStr + "GB") : "(empty)"
            });
        });

        dbinfo.sort(function (a,b) { a.name - b.name });
        dbinfo.forEach(function (db) {
            print(
              colorize(db.name.pad(maxNameLength, true), { color: 'green', bright: true })
              + "  " + db.size_str.pad(maxGbDigits + 6) // xxx.000GB, so 6 trailing chars
            );
        });

        return "";
    }

    if (what == "log" ) {
        var n = "global";
        if ( args.length > 0 )
            n = args[0]

        var res = db.adminCommand( { getLog : n } );
        if ( ! res.ok ) {
            print("Error while trying to show " + n + " log: " + res.errmsg);
            return "";
        }
        for ( var i=0; i<res.log.length; i++){
            print( res.log[i] )
        }
        return ""
    }

    if (what == "logs" ) {
        var res = db.adminCommand( { getLog : "*" } )
        if ( ! res.ok ) {
            print("Error while trying to show logs: " + res.errmsg);
            return "";
        }
        for ( var i=0; i<res.names.length; i++){
            print( res.names[i] )
        }
        return ""
    }

    if (what == "startupWarnings" ) {
        var dbDeclared, ex;
        try {
            // !!db essentially casts db to a boolean
            // Will throw a reference exception if db hasn't been declared.
            dbDeclared = !!db;
        } catch (ex) {
            dbDeclared = false;
        }
        if (dbDeclared) {
            var res = db.adminCommand( { getLog : "startupWarnings" } );
            if ( res.ok ) {
                if (res.log.length == 0) {
                    return "";
                }
                print( "Server has startup warnings: " );
                for ( var i=0; i<res.log.length; i++){
                    print( res.log[i] )
                }
                return "";
            } else if (res.errmsg == "no such cmd: getLog" ) {
                // Don't print if the command is not available
                return "";
            } else if (res.code == 13 /*unauthorized*/ ||
                       res.errmsg == "unauthorized" ||
                       res.errmsg == "need to login") {
                // Don't print if startupWarnings command failed due to auth
                return "";
            } else {
                print("Error while trying to show server startup warnings: " + res.errmsg);
                return "";
            }
        } else {
            print("Cannot show startupWarnings, \"db\" is not set");
            return "";
        }
    }

    throw "don't know how to show [" + what + "]";

}
