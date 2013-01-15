# MongoDB Shell Enhancements for Hackers

## Warnings

* These enhancements are useful to me but they don't make sense for everyone. Feel free to tweak to your desire and please submit pull requests.
* Does not work in Windows (currently)
* Does not work with shells or db servers < 2.2 (currently)

## Installation

Link mongo_hacker.js to `.mongorc.js` in your home directory:

```
ln -sf <mongo-hacker-dir>/mongo_hacker.js ~/.mongorc.js
```

Note: This currently only works with the v2.2+ of shell (which you can use with earlier versions of the server safely)

## Enhancements

### Basic UX

Highlight querytime if verboseShell is enabled
  - In **green** if querytime is at or below slowms
  - In **red** if query time is above slowms

IndexParanoia
- Automatically show information about index use -- to disable: `setIndexParanoia(false)`

Default indent is 2 spaces instead of tab
  - Customizable by setting `__indent`

Verbose shell is enabled by default -- to disable: `setVerboseShell(false)`

Disable notfication of "Type 'it' for more"

Custom prompt with `hostname(process-version)[rs status] db>` formating

### API

Filter for filtering a collection of documents
- `db.collection.filter(<criteria>)` -- accepts less parameters than find, simply matches

One for finding a single document:
- `db.collection.filter({ ... }).one()` == `db.collection.findOne({ ... })`

Select for selecting fields to return (projection):
- `db.collection.filter({ ... }).select({ name: 1 })` -- only returns the name and _id fields

Reverse for descending sort by insertion order (default) or arbitrary field:
- `db.collection.filter({ ... }).reverse()`
- `db.collection.filter({ ... }).reverse('createDate')`

Last for finding last inserted document (default) or document last by given field:
- `db.collection.filter({ ... }).last()`            -- return one doc only
- `db.collection.filter({ ... }).last('createDate')`

Update, Replace, Upsert and Remove can be called on a DBQuery Object
- `db.collection.filter({ ... }).update({ ... })`  -- multi update
- `db.collection.filter({ ... }).replace({ ... })` -- single replacement
- `db.collection.filter({ ... }).upsert({ ... })`  -- single upsert
- `db.collection.filter({ ... }).remove()`         -- multi remove

Sort, limit, and skip through multi updates and removes
- `db.collection.filter({ ... }).limit(7).update({ ... })`
- `db.collection.filter({ ... }).sort({ ... }).skip(1).limit(3).update({ ... })`
- `db.collection.filter({ ... }).limit(3).remove()`

Aggregation Framework Helpers -- on collections
- Group and Count: `gcount(group_field, filter)`
- Group and Sum: `gsum(group_field, sum_field, filter)`
- Group and Average: `gavg(group_field, avg_field, filter)`

### Colorization

Colorized query output

![Colorized Output](http://tylerbrock.github.com/mongo-hacker/screenshots/colorized_shell.png)

- ObjectId: Green(underlined)
- null: Bright Red
- String: Green
- Number: Red
- Key: Yellow
- Boolean: Blue
- Date: Cyan

