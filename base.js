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
    var shell_version = parseFloat(version()).toFixed(1);
    var server_version = parseFloat(db.serverBuildInfo().version).toFixed(1);

    if ((shell_version < 2.4) || (server_version < 2.4)) {
        print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        print("Sorry! MongoDB Shell Enhancements for Hackers is only compatible with MongoDB 2.4+");
        print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    } else if ((shell_version < 3.4) || (server_version < 3.4)) {
        print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        print("WARNING: Your shell version (" + shell_version + ") " +
              "or server version (" + server_version + ") of MongoDB is end of life\n");
        print("You should consider upgrading to a supported version (currently 3.4 or newer):");
        print("   https://docs.mongodb.com/manual/release-notes/");
        print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    }
}