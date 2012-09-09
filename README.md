# MongoDB Shell Enhancements for Hackers

## Warning

These enhancements are useful to me but they don't make sense for everyone. Feel free to tweak to your desire and please submit pull requests.

## Usage

Link mongo_hacker.js to `.mongorc.js` in your home directory:

```
ln -sf <mongo-hacker-dir>/mongo_hacker.js ~/.mongorc.js
```

## List of Enhancements

### Basic

Verbose shell is enabled by default -- to disable: `setVerboseShell(false)`

Disable notfication of "Type 'it' for more"

Custom prompt with `hostname(process-version)>` formating

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

![Colorized Quertime](http://tylerbrock.github.com/mongo-hacker/screenshots/querytime.png)

IndexParanoia
- Automatically show information about index use -- to disable: `setIndexParanoia(false)`

![Index Paranoia](http://tylerbrock.github.com/mongo-hacker/screenshots/index_paranoia.png)

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
      "_id": null,
      "count": 1
    },
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