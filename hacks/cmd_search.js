shellHelper.find = function (query) {
    assert(typeof query == "string");

    var args = query.split( /\s+/ );
    query = args[0];
    args = args.splice(1);

    if (query !== "") {
        var regexp = new RegExp(query, "i");
        var result = db.runCommand("listCommands");
        for (var command in result.commands) {
            var commandObj = result.commands[command];
            var help = commandObj.help;
            if (commandObj.help.indexOf('\n') != -1 ) {
                help = commandObj.help.substring(0, commandObj.help.lastIndexOf('\n'));
            }
            if (regexp.test(command) || regexp.test(help)) {
                var numSpaces = 30 - command.length;
                print(colorize(command, {color: 'green'}), Array(numSpaces).join(" "), "-", help);
            }
        }
    }
};

