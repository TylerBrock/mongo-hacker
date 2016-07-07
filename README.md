
            ┌───────────────────────────────────────────────────────────────────────────────────┐
            │           __  ___                           __  __           __                   │
            │          /  |/  /___  ____  ____ _____     / / / /___ ______/ /_____  _____       │
            │         / /|_/ / __ \/ __ \/ __ `/ __ \   / /_/ / __ `/ ___/ //_/ _ \/ ___/       │
            │        / /  / / /_/ / / / / /_/ / /_/ /  / __  / /_/ / /__/ ,< /  __/ /           │
            │       /_/  /_/\____/_/ /_/\__, /\____/  /_/ /_/\__,_/\___/_/|_|\___/_/            │
            │                          /____/                                                   │
            └───────────────────────────────────────────────────────────────────────────────────┘

# MongoDB Shell Enhancements

## Warnings

* These enhancements are useful to me but they don't make sense for everyone. Feel free to tweak to your desire and please submit [feedback or pull requests](https://github.com/TylerBrock/mongo-hacker/issues).
* Does not work with `mongo` shell or MongoDB servers < 2.4
* Updates called on existing cursors are new and experimental (see notes in API section)

## Installation

```sh
npm install -g mongo-hacker
```

## Enhancements

#### Basic UX

  - Sort document keys by default
  - Highlight querytime if verboseShell is enabled
    - In **green** if querytime is at or below slowms
    - In **red** if query time is above slowms
  - Default indent is 2 spaces instead of tab
    - Customizable by setting `indent` key of config
  - Verbose shell is enabled by default -- to disable: `setVerboseShell(false)`
  - Disable notfication of "Type 'it' for more"
  - Custom prompt: `hostname(process-version)[rs_status:set_name] db>`
  - Always pretty print. You can still use default format by appending `.ugly()` to the end of db statement.
  - Show DBs has aligned columns, is sorted by database name and shows less significant digits (in master for Mongo 2.5/2.6)
  - Nicer `sh.status()` output (remove lastmod, take up less space, colorize chunk's shard)
  - Colorized query output for console/terminal windows supporting ANSI color codes.
    ![Colorized Output](http://tylerbrock.github.com/mongo-hacker/screenshots/colorized_shell.png)

#### Additional shell commands

The MongoDB shell offers various "shell commands" _(sometimes referred to as "shell helpers" as well)_ that make interactive use of the shell much more convenient than [proper, Javascript-only scripted use of the shell][interactive_versus_scripted].

To make interactive use of the MongoDB shell even more convenient, `mongo-hacker` adds the following shell commands:

* `count collections`/`count tables`: count the number of collections in each of the mongo server's databases - by [@pvdb][pvdb]
* `count documents`/`count docs`: count the number of documents in all _(non-`system`)_ collections in the database - by [@pvdb][pvdb]
* `count indexes`: list all collections and display the size of all indexes - by [@cog-g][cog-g]

Some of these commands have hidden features that can be enabled in the `mongo-hacker` config, to make the command output even more useful:

* by changing the `count_deltas` setting to `true` in `config.js`, the `count documents` command will also print out the change in the number of documents since the last count - by [@pvdb][pvdb]

[interactive_versus_scripted]: http://docs.mongodb.org/manual/tutorial/write-scripts-for-the-mongo-shell/#differences-between-interactive-and-scripted-mongo

[pvdb]: https://github.com/pvdb
[cog-g]: https://github.com/Cog-g

#### API Additions

##### Scripting

Get a list of database names: _(by [@pvdb][pvdb])_

```js
db.getMongo().getDatabaseNames()
```

_(note that this method is similar - functionality-wise and usage-wise - to the existing `db.getCollectionNames()` API method and allows for advanced, cross-database scripting in the MongoDB shell)_

##### General

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

#### Data Generation

For easy and simple random data generation you can utilise these methods below. You can use any of these functions in a loop. For example: 

```js
// Inserts 20 documents with random data. 
for (i=1; i<21; i++) { 
    db.collection.insert(
            {
             word: randomWord(), 
             number: randomNumber(), 
             date: randomDate() 
            }
    ); 
}
```

##### randomWord 

You can specify the length of each word, the number of words, and an optional seeded word in a sentence randomly. Use the optional `seed` parameter for testing text search.

`randomWord(length=5, words=1, seed=undefined)` 

```js
// Inserts a random sentence consisting of 5 letters per word, 5 words in total, 
// with a probability to insert the word 'needle' in the sentence
db.collection.insert( { words: randomWord(5, 5, 'needle') } )

// Inserts a random word consisting of 16 letters
db.collection.insert( { words: randomWord(16) } )
```

##### randomNumber

You can specify maximum number to be randomly generated (exclusive)

`randomNumber(max=100)`

```js
// Inserts a random number in the range of 0 or 1. 
db.collection.insert( { number: randomNumber(2) } )

// Inserts a random number in the range of 0 or 999. 
db.collection.insert( { number: randomNumber(1000) } )

```

##### randomDate 

You can specify start and end dates range to be randomly generated. (exclusive)

`randomDate(start= <2 years ago> , end=Date() )`

```js
// Inserts a random date object in the range of 1st January 2016 to 1st February 2016
db.collection.insert( { date: randomDate(ISODate("2016-01-01T00:00:00"), ISODate("2016-02-01T00:00:00")) })

// If today is 19th May 2016 and you specify only the start of the day, 
// this will generate random date object between 00:00:00 to current time.  
db.collection.insert( { date: randomDate(ISODate("2016-05-19T00:00:00")) })
```


#### Helpers

General Shell Helpers

  - `findCommand('search')` list commands that match the search string


Aggregation Framework Helpers -- on collections

  - Group and Count: `gcount(group_field, filter)`
  - Group and Sum: `gsum(group_field, sum_field, filter)`
  - Group and Average: `gavg(group_field, avg_field, filter)`

Run function on some/all databases

```js
runOnDbs(/db_names_regexp/, function(db) {
    // callback is ran for each database which name matches regular expression
    // db is that selected database
});
```
