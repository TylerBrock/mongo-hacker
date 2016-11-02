// Better show dbs
shellHelper.show = function () {
    var show = shellHelper.show;
    return function (what) {
        assert(typeof what == "string");

        if (what == "collections" || what == "tables") {
            var collectionNames = db.getCollectionNames();
            var collectionStats = collectionNames.map(function (name) {
                var stats = db.getCollection(name).stats();
                if (stats.ok) {
                var size = (stats.size / 1024 / 1024).toFixed(3);
                return (size + "MB");
                } else if (stats.code === 166) {
                return "VIEW";
                } else {
                return "ERR:" + stats.code;
                }
            });
            var collectionStorageSizes = collectionNames.map(function (name) {
                var stats = db.getCollection(name).stats();
                if (stats.ok) {
                var storageSize = (stats.storageSize / 1024 / 1024).toFixed(3);
                return (storageSize + "MB");
                }
                return "";
            });
            collectionNames = colorizeAll(collectionNames, mongo_hacker_config['colors']['collectionNames']);
            printPaddedColumns(collectionNames, collectionStats, collectionStorageSizes);
            return "";
        }

        if (what == "dbs" || what == "databases") {
            var databases = db.getMongo().getDBs().databases.sort(function(a, b) { return a.name.localeCompare(b.name) });
            var databaseNames = databases.map(function(db) {
                return db.name;
            });
            var databaseSizes = databases.map(function(db) {
                var sizeInGigaBytes = (db.sizeOnDisk / 1024 / 1024 / 1024).toFixed(3);
                return (db.sizeOnDisk > 1) ? (sizeInGigaBytes + "GB") : "(empty)";
            });
            databaseNames = colorizeAll(databaseNames, mongo_hacker_config['colors']['databaseNames']);
            printPaddedColumns(databaseNames, databaseSizes);
            return "";
        }

        return show(what);
    }
}();
