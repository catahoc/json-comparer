import {Diff, LineModel, LinePair} from "../diff/line";

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
        return 'false';
    } else if (value === null) {
        return 'null';
    } else {
        return `${value}`;
    }
}

export const getObjectModel = (root: any): LineModel[] => {
    const result: LineModel[] = [];
    let indent = 0;

    const pushValue = (value: any, last: boolean, prop?: string) => {
        const isNull = value == null;
        const isObject = typeof value === 'object' && !isNull;
        if (Array.isArray(value)) {
            pushArrayModel(value, last, prop);
        } else if (!isObject) {
            result.push({indent, type: 'define', value: renderValue(value), prop, last});
        } else {
            pushObjectModel(value, last, prop);
        }
    }

    const pushArrayModel = (arr: any[], last: boolean, prop?: string) => {
        result.push({indent, type: 'open_array', prop});
        indent++;
        arr.forEach((value, index) => pushValue(value, index === arr.length - 1));
        indent--;
        result.push({indent, type: 'close_array', last});
    }

    const pushObjectModel = (obj: any, last: boolean, prop?: string) => {
        result.push({indent, type: 'open', prop});
        indent++;
        const props = Array.from(new Set(Object.getOwnPropertyNames(obj))).sort();
        props.forEach((prop, index) => pushValue(obj[prop], index === props.length - 1, prop));
        indent--;
        result.push({indent, type: 'close', last});
    }

    pushValue(root, true);

    return result;
}

const renderContent = (x: LineModel) => {
    const prop = x.prop ? `"${x.prop}": ` : '';
    switch (x.type) {
        case "open":
            return prop + '{';
        case "close":
            return '}';
        case "open_array":
            return prop + '[';
        case "close_array":
            return ']';
        case "define":
            return prop + x.value;
    }
}

export const renderLine = (x: LineModel) => {
    const indentation = '  '.repeat(x.indent);
    const ending = x.last ? ',' : '';
    return indentation + renderContent(x) + ending;
}

export const renderObjectModel = (model: LineModel[]): string[] => {
    return model.map(renderLine);
}

export const computeDiff = (a: any, b: any): Diff => {
    const lines: LinePair[] = [];
    const createAdvancer = (obj: any) => {
        const model = getObjectModel(obj);
        let index = 0;
        const getLine = () => model[index];
        const advance = () => {
            return ++index < model.length;
        };
        const finished = () => {
            return index >= model.length;
        };
        const getOnlyLines = () => {
            const startLine = getLine();
            const startIndent = startLine.indent;
            const noClosing = startLine.type === 'define';
            if (noClosing) {
                let define = getLine();
                advance();
                return [define];
            }
            const result: LineModel[] = [];
            do {
                result.push(getLine());
            }
            while (advance() && getLine().indent !== startIndent);
            result.push(getLine());
            advance();
            return result;
        }
        return {
            getLine,
            advance,
            getOnlyLines,
            finished,
        }
    }

    const leftAdvancer = createAdvancer(a);
    const rightAdvancer = createAdvancer(b);
    const advanceBoth = () => {
        leftAdvancer.advance();
        rightAdvancer.advance();
    }

    while (true) {
        let aline = leftAdvancer.getLine();
        let bline = rightAdvancer.getLine();
        if (!aline.prop || !bline.prop) {
            lines.push(same(aline));
            advanceBoth();
        } else if (aline.prop !== bline.prop) {
            if (aline.prop > bline.prop) {
                rightAdvancer.getOnlyLines().forEach(x => lines.push(right(x)));
                leftAdvancer.getOnlyLines().forEach(x => lines.push(left(x)));
            } else {
                leftAdvancer.getOnlyLines().forEach(x => lines.push(left(x)));
                rightAdvancer.getOnlyLines().forEach(x => lines.push(right(x)));
            }
        } else {
            if (aline.type === 'open' && bline.type === 'open') {
                // both obj
                lines.push(same(aline));
                advanceBoth();
            } else if (aline.type === 'define' && bline.type === 'define') {
                // both value
                if (aline.value === bline.value) {
                    lines.push(same(aline));
                } else {
                    lines.push(different(aline, bline));
                }
                advanceBoth();
            } else {
                lines.push(different(aline, bline));
                if (aline.type === 'define') {
                    rightAdvancer.getOnlyLines().slice(1).forEach(x => lines.push(right(x)));
                    leftAdvancer.advance();
                } else {
                    leftAdvancer.getOnlyLines().slice(1).forEach(x => lines.push(left(x)));
                    rightAdvancer.advance();
                }
            }
        }
        if (leftAdvancer.finished() || rightAdvancer.finished()) {
            break;
        }
    }
    return {lines};
}