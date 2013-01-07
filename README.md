# MongoDB Shell Enhancements for Hackers

## Warnings

* These enhancements are useful to me but they don't make sense for everyone. Feel free to tweak to your desire and please submit pull requests.
* Does not work in Windows (currently)
* Does not work with shells or db servers < 2.2 (currently)

## Usage

Link mongo_hacker.js to `.mongorc.js` in your home directory:

```
ln -sf <mongo-hacker-dir>/mongo_hacker.js ~/.mongorc.js
```

Note: This currently only works with the v2.2+ of shell (which you can use with earlier versions of the server safely)

## List of Enhancements

### Basic

Verbose shell is enabled by default -- to disable: `setVerboseShell(false)`

Disable notfication of "Type 'it' for more"

Custom prompt with `hostname(process-version) db>` formating

### Awesome

Colorized query output

![Colorized Output](http://tylerbrock.github.com/mongo-hacker/screenshots/colorized_shell.png)

- ObjectId: Green(underlined)
- null: Bright Red
- String: Green
- Number: Red
- Key: Yellow
- Boolean: Blue
- Date: Cyan

Highlight querytime if verboseShell is enabled
  - In **green** if querytime is at or below slowms
  - In **red** if query time is above slowms

IndexParanoia
- Automatically show information about index use -- to disable: `setIndexParanoia(false)`

Default indent is 2 spaces instead of tab
  - Customizable by setting `__indent`

Tabular query output with `.t()`
![Colorized Output](http://f.dollyfish.net.nz/92be3c)

- Call `.t()` on any cursor to get tabular output, e.g. `db.mycollection.find().t()`
- You can pass `.t()` a hash with the following keys:
  - limit: Limits the number of rows in the output (which defaults to 20)
  - maxlen: Values longer than this will be truncated to this length, to prevent stupidly long output (default 50)
  - undef: A string representing what should be shown when a value is undefined for a given document
- Observe that you can still pass useful things to `.find()`, for example to ditch columns from the output
  - `db.survey.find(null, {questions: 0}).t({maxlen: 200})  // would hide the questions column`

AutoMulti
- Automatically use multi updates -- to disable: `setAutoMulti(false)`

``` js
db.users.update({}, {$set: {awesome: true}})
Updated 4 existing record(s) in 1ms
```

Aggregation Framework Helpers -- on collections
- Group and Count: `gcount(group_field, filter)`
- Group and Sum: `gsum(group_field, sum_field, filter)`
- Group and Average: `gavg(group_field, avg_field, filter)`