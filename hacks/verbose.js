setVerboseShell(true);

DBQuery.prototype._prettyShell = true

DB.prototype._getExtraInfo = function(action) {
    if ( typeof _verboseShell === 'undefined' || !_verboseShell ) {
        __callLastError = true;
        return;
    }

    // explicit w:1 so that replset getLastErrorDefaults aren't used here which would be bad.
    var startTime = new Date().getTime();
    var res = this.getLastErrorCmd(1);
    if (res) {
        if (res.err !== undefined && res.err !== null) {
            // error occurred, display it
            print(res.err);
            return;
        }

        var info = action + " ";
        // hack for inserted because res.n is 0
        info += action != "Inserted" ? res.n : 1;
        if (res.n > 0 && res.updatedExisting !== undefined) info += " " + (res.updatedExisting ? "existing" : "new");
        info += " record(s) in ";
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
