function delta(currentCount, previousCount) {
    if (!mongo_hacker_config['count_deltas']) {
        return "";
    }
    var delta = Number(currentCount - previousCount);
    delta = isNaN(delta) ? colorize("(first count)", { color: 'blue' }) :
        (delta == 0) ?  colorize("(=)", { color: 'blue' }) :
            (delta > 0) ? colorize("(+" + delta.commify() + ")", { color: 'green' }) :
                (delta < 0) ? colorize("(" + delta.commify() + ")", { color: 'red' }) :
                    (delta + " not supported");
    return " / " + delta.pad(21); // FIXME use "dynamic" padding
}

// global variable (to ensure "persistence")
shellHelper.previousDocumentCount = {};

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
        databaseNames = colorizeAll(databaseNames, mongo_hacker_config['colors']['databaseNames']);
        printPaddedColumns(databaseNames, collectionCounts);
        return "";
    }

    if (what == "documents" || what == "docs") {
        collectionNames = db.getCollectionNames().filter(function (collectionName) {
            // exclude "system" collections from "count" operation
            return !collectionName.startsWith('system.');
        });
        documentCounts = collectionNames.map(function (collectionName) {
            // retrieve the previous document count for this collection
            var previous = shellHelper.previousDocumentCount[collectionName];
            // determine the current document count for this collection
            var count = db.getCollection(collectionName).count();
            // update the stored document count for this collection
            shellHelper.previousDocumentCount[collectionName] = count;
            // format the current document count, incl. delta since last count
            return (count.commify() + " document(s)" + delta(count, previous));
        });
        collectionNames = colorizeAll(collectionNames, mongo_hacker_config['colors']['collectionNames']);
        printPaddedColumns(collectionNames, documentCounts);
        return "";
    }

    if (what == "index" || what == "indexes") {
        db.indexStats("", 1);
        return ""
    }

    throw "don't know how to count [" + what + "]";

}
