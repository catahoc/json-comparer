export type LineModel = {
    indent: number;
    type: 'open'|'close'|'define'|'open_array'|'close_array';
    prop?: string;
    value?: string;
}
export type LinePair =
    | {type: 'same', line: LineModel}
    | {type: 'leftonly', line: LineModel}
    | {type: 'rightonly', line: LineModel}
    | {type: 'different', left: LineModel, right: LineModel};

export type Diff = {
    lines: LinePair[];
}

export const emptyDiff: Diff = {lines: []};