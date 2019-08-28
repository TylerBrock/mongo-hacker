Changes to Mongo Hacker
=======================

#### v0.1.0 / 2019-08-29
 - Add support disclaimer and link to new CHANGELOG.md
 - Remove sharding customisations: these have diverged too far from the upstream source.
 - Fix #161: TypeError: this._db._initExtraInfo is not a function
 - Fix #199: Edit function has ASCII color codes
 - Fix #114: additional setting to turn off colorization
 - Fix #195: profile command failing on .find() operation
 - Fix #196: filter is not a function
 - Fix #193: avoid calling `profile` command to get `slowms` on 4.0+ as this  may block with pending transactions
 - Handle exceptions for GLE (not supported in 4.0+ transactions)
 - Improved manual install:
   - Change default "make install" target to copy to ~/.mongorc.js
   - Backup  ~/.mongorc.js using current unixtime in filename
   - Add "make develop" target to symlink to ~/.mongorc.js
 - Add notice for EOL shell/server versions
 - Refer to document(s) instead of record(s) and pluralise appropriately
 - Add GitHub issue & PR templates

#### v0.0.16 / 2018-10-28
 - Updated the code to work in older mongo shells (@vaelen)
 - Adding support for view to show (@jmatth)
 - Changing column print to work better with views and errors (@jmatth)
 - Adding automationNotice support to show (@jmatth)
 - Simplifying show by wrapping built in function (@jmatth)
 - Updated the ps command to be much more powerful (@vaelen)
 - Added appName field (@vaelen)
 - Make setVerboseShell command use config parameter (@lebedev)
 - Added section to README.md file for install from source (@quirinux)
 - Remove extra parenthesis from UUID formatting (@salty-horse)
 - Fixed #182: "The 'cursor' option is required" (@WoLpH)

#### v0.0.15 / 2016-10-28
 - Add simple methods to help generate random data (@sindbach)
 - Added 'ps' and 'kill' shell helpers (@vaelen)
 - Added license (@vaelen)

#### v0.0.14 / 2016-08-20
 - Added runOnDBs() to run function on some/all databases (@malarzm)
 - Reverted Fix #13 which interferes with ReplSetTest() command (@kevinadi)

#### v0.0.13 / 2016-03-07
 - Feature: delta counts for "count documents" cmd (@pvdb)
 - Refactor coloring database/collection names (@pvdb)
 - Handle printing multiple (ie. more than 2) padded columns (@pvdb)

#### v0.0.12 / 2016-01-28
 - Hot new ASCII logo
 - Sort databases by name (@malarzm)
 - Better DBRef support (@malarzm)

#### v0.0.11 / 2015-12-09
 - Make index paranoia ready for MongoDB 3.0+ (@const-g)
 - Add a helper "count indexes" to display index stats (@const-g)

#### v0.0.10 / 2015-12-03
 - Added `<database>.getIndexes()`

#### v0.0.9 / 2015-11-20
 - Bugfix for colors polluting edit mode (@stennie)

#### v0.0.8 / 2015-05-12
 - Bump minimum MongoDB version to 2.4 (@stennie)
 - New `db.getMongo().getDatabaseNames()` method (@pvdb)
 - New `count doc(ument)s` shell helper/shell command (@pvdb)
 - Include balancer state in sh.status() as per 3.0 shell #122 (@gianpaj)
 - Fix #117: "show users" doesn't work for 2.6+ per-database users (@stennie)

Special thanks to @stennie and @pvdb for updates and new hacks

#### v0.0.5 / 2015-03-17
 - Bug fixes and improvements
 - Support for MongoDB 3.0

#### v0.0.4 / 2015-01-03
 - Bug fixes and improvements

#### v0.0.3 / 2013-11-05
 - Initial release to NPM
 