# MongoDB Shell Enhancements for Hackers

## Warnings

* These enhancements are useful to me but they don't make sense for everyone. Feel free to tweak to your desire and please submit pull requests.
* Does not work in Windows (currently)
* Does not work with shells or db servers < 2.2 (currently)

## Usage

Update mongorc.js and set $HOME to be your home directory, then link mongorc.js
to `.mongorc.js` in your home directory:

```
ln -sf <mongo-hacker-dir>/mongorc.js ~/.mongorc.js
```

Link the hacker modules like so:

```
ln -sf <mongo-hacker-dir>/mongorc ~/.mongorc
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

## Examples

### Insert some data

``` js
db.users.insert([
  {
    "age": 27,
    "first_name": "Tyler",
    "last_name": "Brock",
    "updated": new Date()
  },
  {
    "age": 30,
    "first_name": "Jessica",
    "last_name": "Fake",
    "updated": new Date()
  },
  {
    "age": 35,
    "first_name": "Tyler",
    "last_name": "Durden",
    "updated": new Date()
  }
])
```

### Group and count users by the first_name field

``` js
db.users.gcount("first_name")
{
  "result": [
    {
      "_id": "Jessica",
      "count": 1
    },
    {
      "_id": "Tyler",
      "count": 2
    }
  ],
  "ok": 1
}
```

### Group and count users having first_name of Tyler

``` js
db.users.gcount("first_name", {first_name: "Tyler"})
{
  "result": [
    {
      "_id": "Tyler",
      "count": 2
    }
  ],
  "ok": 1
}
```

### Group users by first name and sum the age field

```js
db.users.gsum("first_name", "age")
{
  "result": [
    {
      "_id": "Jessica",
      "sum": 30
    },
    {
      "_id": "Tyler",
      "sum": 62
    }
  ],
  "ok": 1
}
```

### Group users by first name and average the age field

```js
db.users.gavg("first_name", "age")
{
  "result": [
    {
      "_id": "Jessica",
      "avg": 30
    },
    {
      "_id": "Tyler",
      "avg": 31
    }
  ],
  "ok": 1
}
```
