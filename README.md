# MongoDB Shell Enhancements

## Warnings

* These enhancements are useful to me but they don't make sense for everyone. Feel free to tweak to your desire and please submit pull requests.
* Does not work in Windows (currently)
* Does not work with shells or db servers < 2.2 (currently)
* Updates called on existing cursors are new and experimental (see notes in API section)

## Installation

Install as a global module from npm:

```sh
npm install -g mongo-hacker
```

Or clone this repository and link `mongo_hacker.js` to `.mongorc.js` in your home directory:

```sh
rm -rf ~/.mongorc.js # may be needed as we don't force the link anymore
make
```

Note: This currently only works with the v2.2+ of shell (which you can use with earlier versions of the server safely)

## Enhancements

### Basic UX

  - Sort document keys by default
  - Highlight querytime if verboseShell is enabled
    - In **green** if querytime is at or below slowms
    - In **red** if query time is above slowms
  - IndexParanoia
    - Automatically show information about index use -- to disable: `setIndexParanoia(false)`
  - Default indent is 2 spaces instead of tab
    - Customizable by setting `__indent`
  - Verbose shell is enabled by default -- to disable: `setVerboseShell(false)`
  - Disable notfication of "Type 'it' for more"
  - Custom prompt: `hostname(process-version)[rs status] db>`
  - Always pretty print
  - Show DBs has aligned columns and shows less significant digits (in master for Mongo 2.5/2.6)
  - Nicer sh.status() output (remove lastmod, take up less space, colorize chunk's shard)

#### Colorization

Colorized query output

![Colorized Output](http://tylerbrock.github.com/mongo-hacker/screenshots/colorized_shell.png)

### API Additions

#### General

Filter for a collection of documents:

```js
db.collection.filter(<criteria>)
```

One for finding a single document:

```js
db.collection.find({ ... }).one() == db.collection.findOne({ ... })
```

Select for selecting fields to return (projection):

```js
db.collection.find({ ... }).select({ name: 1 })
```

Reverse for descending sort by insertion order (default) or arbitrary field:

```js
db.collection.find({ ... }).reverse()
db.collection.find({ ... }).reverse('createDate')
```

Last for finding last inserted document (default) or document last by given field:

```js
db.collection.find({ ... }).last()
db.collection.find({ ... }).last('createDate')
```

Update, Replace, Upsert and Remove can be called on a DBQuery Object:

```js
db.collection.find({ ... }).update({ ... })  // multi update
db.collection.find({ ... }).replace({ ... }) // single replacement
db.collection.find({ ... }).upsert({ ... })  // single upsert
db.collection.find({ ... }).remove()         // multi remove
```

Sort, limit, and skip through multi updates and removes:

```js
db.collection.find({ ... }).limit(7).update({ ... })
db.collection.find({ ... }).sort({ ... }).skip(1).limit(3).update({ ... })
db.collection.find({ ... }).limit(3).remove()
```

**Note**: *The performance of multi updates involving a skip or limit may be worse than those without those specifications due to there being absolutely no native support for this feature in MongoDB itself. It should be understood by the user of this software that use of this feature (by calling update on a cursor rather than a collection) is advanced and experimental. The option to do this sort of operation is purely additive to the MongoDB experience with MongoHacker and usage of it is in no way required. Furthermore, its inclusion in this enhancement does not effect the operation of updates invoked through collections and, in practice, is insanely useful.*


#### Aggregation Framework

The aggregation framework is now fluent as well. You can use it as currently documented or via the chainable methods.

Calling aggregate without an array of operations or $operations will make it a match.

```js
// matches every document
db.collection.aggregate()
db.collection.aggregate({})

// matches documents where the "a" is equal to 1
db.collection.aggregate({a: 1})

// matches documents where "a" is greater than 7
db.collection.aggregate({a: {$gt: 7}})
```

Additional methods can then be chained on top of the inital match in order to make more complicated aggregations.

```js
// Match and project
db.collection.aggregate(<querydoc>).project(<projection>)
db.collection.aggregate({a: 1}).project({a: 1, _id: 0})

// Match, group and sort
db.collection.aggregate({<match>}).group({<group>}).sort({<sort>})
db.test.aggregate().group({_id: '$a', 'sum': {'$sum': 1}}).sort({sum: -1})
```

#### Helpers

General Shell Helpers
  - `findCommand('search')` list commands that match the search string

Aggregation Framework Helpers -- on collections
  - Group and Count: `gcount(group_field, filter)`
  - Group and Sum: `gsum(group_field, sum_field, filter)`
  - Group and Average: `gavg(group_field, avg_field, filter)`

