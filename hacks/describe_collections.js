function isObjectLiteral (element) {
  return Object.prototype.toString.call(element) === '[object Object]' ||
    Object.prototype.toString.call(element) === '[object BSON]';
}

function isObjectLiteralOrArray (element) {
  return Array.isArray(element) || isObjectLiteral(element);
}

function isArrayOfObjects (array) {
  if (array.length === 0) {
    return false;
  }

  for (let i = 0; i < array.length; i++) {
    let element = array[i];

    if (!isObjectLiteral(element)) {
      return false
    }
  }
  return true;
}

function checkTypesSetNames (element) {
  if (typeof element == 'object') {
    if (element === null) {
      return { hackerColorName: 'null', displayName: 'unknown' }
    } else if (element === undefined) {
      return { hackerColorName: 'undefined', displayName: 'undefined' }
    } else if (element instanceof ObjectId) {
      return { hackerColorName: 'objectid', displayName: 'Object Id' }
    } else if (element instanceof Date) {
      return { hackerColorName: 'date', displayName: 'Date' }
    } else if (Array.isArray(element)) {
      return { hackerColorName: 'function', displayName: 'Array' }
    } else {
      if (isObjectLiteral(element)) {
        return { hackerColorName: 'function', displayName: 'Object' }
      }

      return { hackerColorName: 'null', displayName: 'unknown' }
    }
  } else if (typeof element === 'boolean') {
    return { hackerColorName: 'boolean', displayName: 'Boolean' }
  } else if (typeof element === 'number') {
    return { hackerColorName: 'number', displayName: 'Number' }
  } else if (typeof element === 'string') {
    return { hackerColorName: 'string', displayName: 'String' }
  } else {
    return { hackerColorName: 'null', displayName: 'unknown' }
  }
}

function printWithIndentation (prop, renderedType, hackerType, levelsDeep) {
  const coloredProp = colorize(prop, mongo_hacker_config['colors']['key']);
  const coloredType = ': ' +
    colorize(
      renderedType,
      mongo_hacker_config['colors'][hackerType]
    );

  print('  '.repeat(levelsDeep) + coloredProp + coloredType );
}

/*
 * Updates a specific value in an object given an array of keys
 * representing the path to it.
 *
 * @param {object} obj - object to update.
 * @param {string[]} breadcrumbs - array of strings representing keys.
 * @param {any} newValue - new value to be set.
 */
function breadCrumbUpdate (obj, breadcrumbs, newValue) {
  for (let i = 0; i < breadcrumbs.length; i++) {
    let key = breadcrumbs[i];

    if (i === breadcrumbs.length - 1) {
      return obj[key] = newValue;
    }

    obj = obj[key];
  }
}

/*
 * Returns a specific value given an array of keys representing
 * the path to it.
 *
 * @param {object} obj - object or document to get the value from.
 * @param {string[]} breadcrumbs - array of strings representing keys.
 * @return {any}
 */
function getValueByBreadCrumb (obj, breadcrumbs) {
  return breadcrumbs.reduce(function (acc, key, index) {
    return acc[key]
  }, obj);
}

/*
 * The purpose of this function is to build the most complete example
 * of an object given an array of examples. Similar to Object.assign it keeps
 * adding new fields but only overriding if it encounters falsy values
 *
 * For array of objects it will create just one representation of all
 * elements in array.
 *
 * @param {objects[]} dataArray - Array of plain objects or mongo documents.
 * @return {object}
 */
function buildModelDoc (dataArray) {
  const finalObject = {};

  function traverse (element, breadcrumbs) {
    if (Array.isArray(element)) {
      if (isArrayOfObjects(element)) {
        const mergedObject = buildModelDoc(element);
        breadCrumbUpdate(finalObject, breadcrumbs, [mergedObject]);
      } else {
        breadCrumbUpdate(finalObject, breadcrumbs, element)
      }
    } else {
      Object.getOwnPropertyNames(element).forEach(function (key) {
        const value = element[key];
        const finalObjectAtLevel = getValueByBreadCrumb(finalObject, breadcrumbs);

        if (finalObjectAtLevel[key]) {
          if (
            finalObjectAtLevel[key] === null ||
            finalObjectAtLevel[key] === undefined
          ) {
            breadCrumbUpdate(finalObject, breadcrumbs.concat(key), value);
          }
        } else {
          breadCrumbUpdate(finalObject, breadcrumbs.concat(key), value);
        }

        if (isObjectLiteralOrArray(value)) {
          traverse(value, breadcrumbs.concat(key));
        }
      });
    }
  }

  dataArray.forEach(function (doc) {
    traverse(doc, []);
  });

  return finalObject;
}

//----------------------------------------------------------------------------
// Collections Descriptions
//----------------------------------------------------------------------------

// Since the nature of mongodb is to have schemaless documents, the best we can
// do is to infer the schema by taking a sample of the total documents in a given
// collection. Sample size can be set and it defaults to 100 documents
// or less if there are not as many.

/*
 * Prints infered schema from a sample of docuements in collection.
 * Space indentation is used to show deeper levels.
 *
 * @param {number} maxSamples - number of random documents to infer schema
 */
DBCollection.prototype.describe = function (maxSamples) {
  const sampleMaxSize = maxSamples || 100;
  const totalDocs = this.count();

  if (!totalDocs) {
    return print('\nNo documents to infer schema');
  }

  const randomSampleDocs = this.aggregate([
    {
      $sample: { size: sampleMaxSize }
    }
  ]);

  print(
    colorize(
      '\nInfered from ' +
      randomSampleDocs._batch.length +
      ' sample documents.',
      mongo_hacker_config['colors']['string']
    )
  );

  print(
    colorize(
      'Some fields may be missing...\n',
      mongo_hacker_config['colors']['string']
    )
  );

  const mergedSamples = buildModelDoc(randomSampleDocs);

  function traverse (doc, levelsDeep) {
    Object.getOwnPropertyNames(doc).forEach(function (prop) {
      const value = doc[prop];
      const type = checkTypesSetNames(value);

      if (Array.isArray(value)) {
        if (isArrayOfObjects(value)) {
          const mergedObjects = buildModelDoc(value);
          const displayName = 'Array of Objects';
          printWithIndentation(prop, displayName, 'function', levelsDeep);
          traverse(mergedObjects, levelsDeep + 1);
        } else {
          const typesSet = new Set();

          value.forEach(function (element) {
            typesSet.add(checkTypesSetNames(element).displayName + 's');
          });

          const typesArray = Array.from(typesSet);
          const displayName = 'Array' +
            (typesArray.length ? ( ' of ' + typesArray.join('|') ) : '');

          printWithIndentation(prop, displayName, 'function', levelsDeep);
        }
      } else {
        printWithIndentation(prop, type.displayName, type.hackerColorName, levelsDeep);

        if (type.displayName === 'Object') {
          traverse(value, levelsDeep + 1);
        }
      }
    });
  }

  traverse(mergedSamples, 1);
  print('\n');
}

