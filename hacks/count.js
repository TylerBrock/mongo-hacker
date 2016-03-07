// helper function to format delta counts
function delta(currentCount, previousCount) {
    var delta = Number(currentCount - previousCount);
    var formatted_delta;
    if (isNaN(delta)) {
      formatted_delta = colorize("(first count)", { color: 'blue' });
    } else if (delta == 0) {
      formatted_delta = colorize("(=)", { color: 'blue' });
    } else if (delta > 0) {
      formatted_delta = colorize("(+" + delta.commify() + ")", { color: 'green' });
    } else if (delta < 0) {
      formatted_delta = colorize("(" + delta.commify() + ")", { color: 'red' });
    } else {
      formatted_delta = (delta + " not supported");
    }
    return formatted_delta;
}

// global variable (to ensure "persistence" of document counts)
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
            var count = db.getCollection(collectionName).count();
            return (count.commify() + " document(s)");
        });
        deltaCounts = collectionNames.map(function (collectionName) {
            // retrieve the previous document count for this collection
            var previous = shellHelper.previousDocumentCount[collectionName];
            // determine the current document count for this collection
            var current = db.getCollection(collectionName).count();
            // update the stored document count for this collection
            shellHelper.previousDocumentCount[collectionName] = current;
            // format the delta since last count
            return delta(current, previous);
        });
        collectionNames = colorizeAll(collectionNames, mongo_hacker_config['colors']['collectionNames']);
        if (mongo_hacker_config['count_deltas']) {
            printPaddedColumns(collectionNames, documentCounts, deltaCounts);
        } else {
            printPaddedColumns(collectionNames, documentCounts);
        }

        return "";
    }

    if (what == "index" || what == "indexes") {
        db.indexStats("", 1);
        return ""
    }

    throw "don't know how to count [" + what + "]";

}
