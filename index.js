const   _EMPTY_LINE = 0,
        _HASH_COMMENT = 1,
        _BREAK_COMMENT = 2,
        _SECTION = 3,
        _PAIR = 4,
        _GARBAGE = 5


class INIClass{
    constructor(str, {defaultSectionName = 'DEFAULT_SECTION!', eol = require('os').EOL, autoTrim = true} =  {defaultSectionName: 'DEFAULT_SECTION!', eol: require('os').EOL, autoTrim: true}) {
        this.origin = str
        this.autoTrim = autoTrim
        this.eol = eol
        this._defSecName = defaultSectionName
        this._typeScheme = [
            {'key': () => '', 'val': () => null},
            {'key': l => l, 'val': () => null},
            {'key': l => l, 'val': () => null},
            {'key': l => l, 'val': () => null},
            {'key': l => l.split('=')[0], 'val': l => l.split(/=(.+)/)[1]},
            {'key': l => l, 'val': () => null}
        ]
        this._lineGens = [   //line, trim ,clean(comment garbage)
            () => '',
            (l,t) => t ? l.key.trim() : l.key,
            (l,t) => t ? l.key.trim() : l.key,
            (l,t) => t ? l.key.trim() : l.key,
            (l,t) => t ? `${l.key.trim()}=${l.val.trim()}` : `${l.key}=${l.val}`,
            (l,t,c) => c ? `;${t ? l.key.trim() : l.key}` : `${t ? l.key.trim() : l.key}`
        ]
        this._types = [
            v => v.match(/^\s*$/) != null,              //     0: 'emptyLine',
            v => v.match(/^ *#/) != null,               //     1: 'hashcomment',
            v => v.match(/^ *;/) != null,               //     2: 'breakcomment',
            v => v.match(/^\s*\[.*\]$/) != null,        //     3: 'section',
            v => v.match(/^\s*([^#;]*\w+)=/) != null,   //     4: 'pair',
            v => v.match(/^([^=#;]+\w$)/) != null       //     5: 'garbage'
        ]
        this.iniData = this._createINIData(this.origin)
    }

    _secArr(sec) {return sec[Object.keys(sec)[0]]}

    _secName(sec) {return Object.keys(sec)[0]}

    _getSection(obj, i) {return obj[i][Object.keys(obj[i])[0]]}

    _findType(line) {for (let t in this._types) {if (this._types[t](line)) {return t}}}

    _addByType(obj, type, key = '', val = '') {
        if (type == _SECTION) {obj.push({[key]:[]})} else {
            this._getSection(obj, obj.length -1).push({type, key, val})
        }
    }

    _createINIData(string) {
        const iniData = []
        const lines = string.split(this.eol)
        if (this._findType(lines[0]) != _SECTION) {iniData.push({[this._defSecName]:[]}) }
        for (let l of lines) {
            if(this.autoTrim) {l = l.trim()}
            const lineType = this._findType(l)
            try{
                this._addByType(iniData, lineType, this._typeScheme[lineType].key(l), this._typeScheme[lineType].val(l))
            } catch (e) {
                console.log(l,e)
                throw e
            }
        }
        return iniData
    }

    createINIString({shouldTrim = false, shouldFix = false, cleanHashComments = false, cleanBreakComment = false, cleanEmptyLines = false, noEmptySections = false, noSections = false} =
        {shouldTrim: false, shouldFix: false, cleanHashComments: false, cleanBreakComment: false, cleanEmptyLines: false, noEmptySections: false, noSections: false}) {
        let output = '', curLine = ''
        for (const section of this.iniData) {
            let sectionString = '', contentString = ''
            const sName = this._secName(section)
            if (sName != this._defSecName && !noSections) {
                sectionString += cleanEmptyLines ? this.eol : ''
                sectionString += shouldTrim ? `${sName.trim()}${this.eol}` : `${sName}${this.eol}`
            }
            for(const l of this._secArr(section)) {
                curLine = this._lineGens[l.type](l, shouldTrim, shouldFix)
                if (cleanEmptyLines && this._findType(curLine) == _EMPTY_LINE) {continue}
                if (cleanHashComments && this._findType(curLine) == _HASH_COMMENT) {continue}
                if (cleanBreakComment && this._findType(curLine) == _BREAK_COMMENT) {continue}
                contentString += `${curLine}${this.eol}`
            }
            if (noEmptySections && contentString == '') {continue}
            output += sectionString + contentString
        }
        return output
    }

    getKeyIfExists(inputKey) {
        for (const sec of this.iniData) {
            for (let line of this._secArr(sec)) {
                if(line.type == _PAIR && line.key.trim() == inputKey.trim()) {
                    return line
                }
            }
        }
        return null
    }

    findAndChangeKeyIfExists(inputKey, inputValue = '') {
        const res = this.getKeyIfExists(inputKey)
        if (res) {
            res.val = inputValue
            return true
        }
        return false
    }

    findAndRemoveKeyIfExists(inputKey) {
        for (const sec of this.iniData) {
            for (const [index, line] of this._secArr(sec).entries()) {
                if (line.type == _PAIR && line.key.trim() == inputKey.trim()) {
                    this._secArr(sec).splice(index, 1)
                    return true
                }
            }
        }
        return false
    }

    findAndRemoveSectionIfExists(sectionName, partialMatch = false) {
        for (const [index, section] of this.iniData.entries()) {
            if (!partialMatch && this._secName(section) == sectionName ||
                partialMatch && this._secName(section).indexOf(sectionName) >= 0) {
                this.iniData.splice(index, 1)
                return true
            }
        }
        return false
    }

    putStringInSection(string, sectionName = this._defSecName) {
        let existingSec = false, valueAdded = false
        const stringType = this._findType(string)
        const stringObj = {
            type: stringType,
            key: this._typeScheme[stringType].key(string),
            val: this._typeScheme[stringType].val(string)
        }
        for (const sec of this.iniData) {
            const sName = this._secName(sec)
            if (sectionName == sName.trim()) {
                const lines = this._secArr(sec)
                for (const line of lines) {
                    if (line.key == stringObj.key && stringObj.type == _PAIR) {
                        line.val = stringObj.val
                        valueAdded = true
                        break
                    }
                }
                if (!valueAdded) {
                    lines.push(stringObj)
                    existingSec = true
                    break
                }
            }
        }
        if (!existingSec && !valueAdded) {
            this.iniData.push({[sectionName]:[]})
            return this.putStringInSection(string, sectionName)
        }
        return true
    }

    getLinesByMatch(token) {
        const resultLines = []
        for (const sec of this.iniData) {
            const sLines = this._secArr(sec)
            for (const line of sLines) {
                if(line.type == _PAIR) {
                    if (line.val.indexOf(token) >= 0 || line.key.indexOf(token) >= 0) {
                        resultLines.push(this._lineGens[line.type](line))
                        continue
                    }
                }
                if (line.key.indexOf(token) >= 0) {
                    resultLines.push(this._lineGens[line.type](line))
                    continue
                }
            }
        }
        return resultLines
    }

    removeLineByMatch(token, global = false, _done = false) {
        for (const sec of this.iniData) {
            const sLines = this._secArr(sec)
            for (const [index, line] of sLines.entries()) {
                if(line.type == _PAIR) {
                    if (line.val.indexOf(token) >= 0 || line.key.indexOf(token) >= 0) {
                        sLines.splice(index, 1)
                        if (global) {return this.removeLineByMatch(token, global, true)}
                        else {_done = true; break}
                    }
                }
                if (line.key.indexOf(token) >= 0) {
                    sLines.splice(index, 1)
                    if (global) {return this.removeLineByMatch(token, global, true)}
                    else {_done = true; break}
                }
            }
        }
        return _done
    }

    findAndReplace(token, value = '', global = false, _done = false) {
        for (const sec of this.iniData) {
            const sLines = this._secArr(sec)
            for (const line of sLines) {
                if(line.type == _PAIR) {
                    if (line.val.indexOf(token) >= 0) {
                        line.val = line.val.replace(token, value)
                        if (global) {return this.findAndReplace(token, value, global, true)}
                        else {_done = true; break}
                    }
                }
                if (line.key.indexOf(token) >= 0) {
                    line.key = line.key.replace(token, value)
                    if (global) {return this.findAndReplace(token, value, global, true)}
                    else {_done = true; break}
                }
            }
        }
        return _done
    }

    solveDuplicates(preferFirstOccurrence = false) {
        for (const sec of this.iniData) {
            const sLines = this._secArr(sec)
            for (const [index, line] of sLines.entries()) {
                if(line.type == _PAIR) {
                    if (preferFirstOccurrence) {
                        const tempKey = line.key
                        line.key = 'TeMpKeY'
                        while (this.findAndRemoveKeyIfExists(tempKey)) {}
                        line.key = tempKey
                    } else {
                        const tempKey = line.key
                        line.key = 'TeMpKeY'
                        if (this.getKeyIfExists(tempKey)) {
                            sLines.splice(index, 1)
                            return this.solveDuplicates(preferFirstOccurrence)
                        } else {
                            line.key = tempKey
                        }
                    }
                }
            }
        }
        return true
    }

    solveSelfReferences(prefix, suffix) {
        const refReg = new RegExp(`${prefix}(.*?)${suffix}`)
        let result = false
        for (const sec of this.iniData) {
            const sLines = this._secArr(sec)
            for (const line of sLines) {
                if (line.type == _PAIR) {
                    const matchRes = line.val.match(refReg)
                    if (matchRes && matchRes.length >= 2) {
                        const suspect = this.getKeyIfExists(matchRes[1])
                        if (suspect && suspect.val) {
                            line.val = line.val.replace(matchRes[0], suspect.val)
                            result = true
                        }
                    }
                } else {
                    const matchRes = line.key.match(refReg)
                    if (matchRes && matchRes.length >= 2) {
                        const suspect = this.getKeyIfExists(matchRes[1])
                        if (suspect && suspect.val) {
                            line.key = line.key.replace(matchRes[0], suspect.val)
                            result = true
                        }
                    }
                }
            }
        }
        if (result) {return this.solveSelfReferences(prefix, suffix)}
        return true
    }

    mergeWith(anotherINIObject, before = false) {
        const otherINIData = anotherINIObject.iniData
        let sectionFound
        for (const s2 of otherINIData) {
            sectionFound = false
            const s2Name = this._secName(s2), s2Lines = this._secArr(s2)
            for (const s of this.iniData) {
                const sName = this._secName(s), sLines = this._secArr(s)
                if (s2Name == sName) {
                    if (before) {sLines.unshift(...s2Lines.map(a => ({...a})))}
                    else {sLines.push(...s2Lines.map(a => ({...a})))}
                    sectionFound = true
                    break
                }
            }
            if (!sectionFound) {
                if (before) {
                    this.iniData.splice(1, 0, {[s2Name]:[]});
                    this.iniData[1][s2Name].push(...s2Lines.map(a => ({...a})))
                } else {
                    this.iniData.push({[s2Name]:[]})
                    this.iniData[this.iniData.length -1][s2Name].push(...s2Lines.map(a => ({...a})))
                }
            }
        }
        return true
    }
}
module.exports = INIClass