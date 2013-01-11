var localSettingsFile = homeDir + "/.mongorc.settings.json";

var settingsFile = ls(homeDir).indexOf(localSettingsFile) != -1 ? localSettingsFile : homeDir + "/.mongo.rc/default_settings.json";
print("Load settings from '" + settingsFile + "'");

var settings = eval("(function() { return " + cat(settingsFile) + " })()");  // unsafe :(

setVerboseShell(settings.verboseShell);
setIndexParanoia(settings.indexParanoia);
__indent = settings.indent;
