import {Diff, LineModel, LinePair, missingLine, Side} from "../diff/line";
/*
{           // nest0__{
  "a": 1,   // nest1_a
  "b": {    // nest1_b
    "c": 3, // nest1_b
    "d": 4  //
  }         // nest1_
}           // nest0__}
* */
interface LiteralLine {
    key: string;
    text: string;
}

const same = (line: LineModel): LinePair => {
    return {type: 'same', line};
}
const different = (left: LineModel, right: LineModel): LinePair => {
    return {type: 'different', left, right};
}
const left = (line: LineModel): LinePair => {
    return {type: 'leftonly', line};
}
const right = (line: LineModel): LinePair => {
    return {type: 'rightonly', line};
}

const renderValue = (value: any) => {
    if (typeof value === 'string') {
        return `"${value}"`;
    } else if (value === true) {
        return 'true';
    } else if (value === false) {
        return 'true';
    } else if (value === null) {
        return 'true';
    } else {
        return `${value}`;
    }
}

export const getObjectModel = (root: any): LineModel[] => {
    const result: LineModel[] = [];

    const pushObjectModel = (obj: any) => {
        const props = Array.from(new Set(Object.getOwnPropertyNames(obj))).sort();
        props.forEach(prop => {
            const value = obj[prop];
            const isNull = value == null;
            const isObject = typeof value === 'object' && !isNull;
            if (!isObject) {
                result.push({indent, type: 'define', prop, value: renderValue(value)});
            } else {
                result.push({indent, type: 'open', prop});
                indent++;
                pushObjectModel(value);
                indent--;
                result.push({indent, type: 'close'});
            }
        })
    }

    let indent = 0;
    result.push({indent, type: 'open'});
    indent++;
    pushObjectModel(root);
    indent--;
    result.push({indent, type: 'close'});

    return result;
}

export const renderLine = (x: LineModel) => {
    const result = '  '.repeat(x.indent);
    switch (x.type) {
        case "open":
            if (x.prop) {
                return result + `"${x.prop}": {`;
            } else {
                return result + '{';
            }
        case "close":
            return result + '}';
        case "define":
            return result + `"${x.prop}": ${x.value}`;
    }
}

export const renderObjectModel = (model: LineModel[]): string[] => {
    return model.map(renderLine);
}

export const computeDiff = (a: any, b: any): Diff => {
    const lines: LinePair[] = [];
    const amodel = getObjectModel(a);
    const bmodel = getObjectModel(b);
    let aix = 0, bix = 0;
    const renderA = ({skipFirst}: {skipFirst: boolean}) => {
        while (true) {
            if (!skipFirst) {
                lines.push(left(amodel[aix]))
            } else {
                skipFirst = false;
            }

            if (amodel[aix + 1].indent === amodel[aix].indent) {
                break;
            } else {
                aix++;
            }
        }
    }
    const renderB = ({skipFirst}: {skipFirst: boolean}) => {
        while (true) {
            if (!skipFirst) {
                lines.push(right(bmodel[bix]));
            } else {
                skipFirst = false;
            }

            if (bmodel[bix + 1].indent === bmodel[bix].indent) {
                break;
            } else {
                bix++;
            }
        }
    }
    while (true) {
        const a = amodel[aix];
        const b = bmodel[bix];
        if (!a.prop || !b.prop) {
            lines.push(same(a));
            aix++;
            bix++;
        } else if (a.prop != b.prop) {
            if (a.prop > b.prop) {
                renderB({skipFirst: false});
                renderA({skipFirst: false});
            } else {
                renderA({skipFirst: false});
                renderB({skipFirst: false});
            }
        } else {
            if (a.type === 'open' && b.type === 'open') {
                // both obj
                lines.push(same(a));
                aix++;
                bix++;
            } else if (a.type === 'define' && b.type === 'define') {
                // both value
                if (a.value === b.value) {
                    lines.push(same(a));
                } else {
                    lines.push(different(a, b));
                }
                aix++;
                bix++;
            } else {
                if (a.type === 'define') {
                    // diff
                    lines.push(different(a, b));
                    renderB({skipFirst: true});
                    aix++;
                } else {
                    // diff
                    lines.push(different(a, b));
                    renderA({skipFirst: true});
                    bix++;
                }
            }
        }
        if (aix >= amodel.length || bix >= bmodel.length) {
            break;
        }
    }
    return {lines};
}