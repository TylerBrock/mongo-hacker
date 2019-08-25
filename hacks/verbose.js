setVerboseShell(mongo_hacker_config.verbose_shell);

DBQuery.prototype._prettyShell = true

// Display verbose information about the operation
DBCollection.prototype._printExtraInfo = function(action, startTime) {
    if (typeof _verboseShell === 'undefined' || !_verboseShell) {
        __callLastError = true;
        return;
    }

    var res;
    try {
        // getLastError isn't supported in transactions
        res = this._db.getLastErrorCmd(1);
    } catch (e) {
        // printjson(e);
    }

    if (res) {
        if (res.err != undefined && res.err != null) {
            if (res.errmsg && (res.errmsg !== "This command is not supported in transactions")) {
                print(res.err);
            }
            return;
        }

        var info = action + " ";
        // hack for inserted because res.n is 0
        info += action != "Inserted" ? res.n : 1;
        if (res.n > 0 && res.updatedExisting != undefined) {
            info += " " + (res.updatedExisting ? "existing" : "new");
        }
        info += " document(s) in ";
        var time = new Date().getTime() - startTime;
        var slowms = getSlowms();
        if (time > slowms) {
            info += colorize(time + "ms", { color: 'red', bright: true });
        } else {
            info += colorize(time + "ms", { color: 'green', bright: true });
        }
        print(info);
    }
};