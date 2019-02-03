
# Easy-INI - a simple way to manipulate INI files content
### Table of Contents

- [Getting Started](#getting-started)
- [API](#class-methods)
- [Good to know](#good-to-know)
- [Use Cases](#use-case-examples)
- [Author](#author)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---
## Getting Started
why should you use this package?

1. You don't want to manipulate an object and just use stright and forward methods (you can if you insist)
2. You care about preserving comments
3. You want want easy formatting and cool logic like merge and replace

### basic example

```javascript
const INI = require('easy-ini')
const myINI = new INI('cool=awesome')
myINI.putStringInSection('; so important','[WOW]')
const giveItBack = myINI.createINIString()
```
---
## Class Methods:

**constructor(,{})**
*Create ini object*
- ``str``,
- *optional:* ``defSec`` = 'DEFAULT_SECTION!',
- *optional:* ``eol`` = require('os').EOL)
- *optional:* ``autoTrim`` = true
```javascript
// You can start with an empty INI
const myINI = new INI('')

// By default the EOL is the taken from the OS, set it if needed
const myINI = new INI('',{eol: '\r\n'})

// DebSec is needed to represent the first lines that may not be under a section
// By default it's: [DEFAULT_SECTION!] , if for some reason you actually use this name for a section, provide another to avoid unwanted behavior
const myINI = new INI('',{defSec: 'NEXT_LEVEL_DEFAULT_SECTION'})
```
<br>

**```createINIString```({})**
*Make an ini string from the object, every param is optional and do what it says*
- shouldTrim = false,
- shouldFix = false,
- cleanHashComments = false,
- cleanBreakComment = false,
- cleanEmptyLines = false,
- noEmptySections = false,
- noSections = false
```javascript
// To get true representation use without any parameter
const newINIString = myINI.createINIString()
```
<br>

**```getKeyIfExists```()**
*Get line object by referance {type, key, val}*
- inputKey
```javascript
// Changing the returned object will change the original
myINI.getKeyIfExists('cool').val = 'ouch'
// Returnes null if failed to find
```
<br>

**```findAndChangeKeyIfExists```()**
*finds a pair by key and replace value*
- inputKey,
- inputValue = ''
```javascript
// Same as using getKeyIfExists but without returning referance
myINI.findAndChangeKeyIfExists('cool','OUCH')
// Returnes true for success, otherwize false
```
<br>

**```findAndRemoveKeyIfExists```()**
*remove key value pair from object*
- inputKey
```javascript
// Remove a pair (key=value) by matching the key with input string
myINI.findAndRemoveKeyIfExists('cool')
// Returnes true for success, otherwize false
```
<br>

**```findAndRemoveSectionIfExists```()**
*remove entire section from object*
- sectionName
- partialMatch = false
```javascript
// Remove an entire section
myINI.findAndRemoveSectionIfExists('[DO_NOT_REMOVE]')
// Returnes true for success, otherwize false
```
<br>

**```putStringInSection```()**
*adds a line to the end of a section*
- string,
- sectionName = this.defSecName
```javascript
// If section does not exist, will create it at the end
myINI.putStringInSection('#comment','[BLAHBLAH]')
// If the input is a key=value pair, and key exists in section , will change its value
// Also true when no section is provided (will use default one)
```
<br>


**```getLinesByMatch```()**
*find all lines containing a string*
- token
```javascript
// Will return an array with with all matches across all sections
myINI.getLinesByMatch('#INCLUDE=')
```
<br>

**```removeLineByMatch```()**
*matches keys, values or comments*
- token,
- global = false,
- _done = false (internal use)
```javascript
// Will return true if at least one line was removed, else false
myINI.removeLineByMatch(';DUAH', true)
```
<br>

**```findAndReplace```()**
*searches for the token and replaces with the value if found*
- token,
- value = '',
- global = false,
- _done = false (internal use)
```javascript
// if global is false will change only the first occurrence
myINI.findAndReplace('<<BASE_DOMAIN>>', 'mashu-mashu-mashu.com', true)
// Will return true if at least one line was removed, else false
```
<br>

**```solveDuplicates```()**
*fixes ini object so and removes duplicate keys leaving first or last occurence*
- preferFirstOccurrence = false
```javascript
// Will remove duplicate keys across the entire ini object
myINI.solveDuplicates()
// Returnes true when finished
```
<br>

**```mergeWith```()**
*merges with another ini object*
- anotherINIObject
- before = false
```javascript
// If before is true will place new values at the beginning of each section
myINI.mergeWith(notMyINI)
```
<br>

---

## Good To Know:
1. the INI class accepets a string input for the constructor ( not a path to an ini file )
2. the default section is a representation for the first lines that are not under any section (could be the whole file)
3. considers text only lines as garbage
4. You can edit ```myINI.iniData``` directly
5. line types:
    - 0: empty line
    - 1: hash comment
    - 2: break comment
    - 3: section
    - 4: pair
    - 5: garbage

---

## Use Case Examples:

#### handling ini dependency
```javascript
const fs = require('fs')
const INI = require('easy-ini')
const productConfig = new INI(fs.readFileSync('./amazing_app_info.ini',{encoding: 'utf8'}))

let includes
while (includes = productConfig.getLinesByMatch("#INCLUDE")){
    if(includes.length == 0) {break}
    productConfig.removeLineByMatch('#INCLUDE', true)
    for (const include of includes.reverse()) {
        const includePath = include.split('=')[1]
        const tempINI = new INI(fs.readFileSync(includePath, {encoding: 'utf8'}))
        productConfig.mergeWith(tempINI, true)
    }
}
productConfig.solveDuplicates()
const finalConfig = productConfig.createINIString()
fs.writeFileSync("./final.ini", finalConfig)
```
<br>

---
## Author

* **[Gal Angel](gal0angel@gmail.com)**


## License

[GNU General Public License v3.0](/LICENCE.md)

## Acknowledgments

* stackOverflow
* coffee
* my cats