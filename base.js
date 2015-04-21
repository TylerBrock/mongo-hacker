if (_isWindows() && mongo_hacker_config['windows_warning']) {
    print("\nMongoDB Shell Enhancements for Hackers does not support color highlighting in ");
    print("the default Windows Command Prompt. If you are using an alternative console ");
    print("such as ConEmu (https://github.com/Maximus5/ConEmu) you may wish to try enabling");
    print("highlighting in your mongo_hacker config by setting:");
    print("\n\tforce_color: true\n");
    print("You can hide this startup warning by setting:");
    print("\n\twindows_warning: false\n");
}

if (typeof db !== 'undefined') {
    var current_version = parseFloat(db.serverBuildInfo().version).toFixed(2)

    if (current_version < 2.4) {
        print("Sorry! MongoDB Shell Enhancements for Hackers is only compatible with Mongo 2.4+\n");
    }
}
