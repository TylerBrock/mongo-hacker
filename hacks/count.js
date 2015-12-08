// "count documents", a bit akin to "show collections"
shellHelper.count = function (what) {
    assert(typeof what == "string");

    var args = what.split( /\s+/ );
    what = args[0]
    args = args.splice(1)

    if (what == "collections" || what == "tables") {
        databaseNames = db.getMongo().getDatabaseNames();
        collectionCounts = databaseNames.map(function (databaseName) {
            var count = db.getMongo().getDB(databaseName).getCollectionNames().length;
            return (count.commify() + " collection(s)");
        });
        printPaddedColumns(databaseNames, collectionCounts, mongo_hacker_config['colors']['databaseNames']);
        return "";
    }

    if (what == "documents" || what == "docs") {
        collectionNames = db.getCollectionNames().filter(function (collectionName) {
            // exclude "system" collections from "count" operation
            return !collectionName.startsWith('system.');
        });
        documentCounts = collectionNames.map(function (collectionName) {
            var count = db.getCollection(collectionName).count();
            return (count.commify() + " document(s)");
        });
        printPaddedColumns(collectionNames, documentCounts, mongo_hacker_config['colors']['collectionNames']);
        return "";
    }

    if (what == "index" || what == "indexes") {
        db.indexStats("", 1);
        return ""
    }

    throw "don't know how to count [" + what + "]";

}
