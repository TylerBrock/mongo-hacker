function commify(number) {
    // http://stackoverflow.com/questions/2901102
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// "count documents", a bit akin to "show collections"
shellHelper.count = function (what) {
    assert(typeof what == "string");

    var args = what.split( /\s+/ );
    what = args[0]
    args = args.splice(1)

    if (what == "documents" || what == "docs") {
        var maxNameLength = maxLength(db.getCollectionNames());
        db.getCollectionNames().forEach(function (collectionName) {
          // exclude "system" collections from "count" operation
          if (collectionName.startsWith('system.')) { return ; }
          var count = db.getCollection(collectionName).count();

          print(
            colorize(collectionName.pad(maxNameLength, true), { color: 'green', bright: true })
            + "  " + commify(count) + " document(s)"
          );
        });
        return "";
    }

    throw "don't know how to count [" + what + "]";

}
