import { Diff } from "../diff/line";
import {
  computeDiff,
  getObjectModel,
  renderLine,
  renderObjectModel,
} from "./compute-diff";

describe("compute diff", () => {
  const toReadable = (diff: Diff): string[] => {
    return diff.lines
      .map((x) => {
        switch (x.type) {
          case "rightonly":
            return [`RR: ${renderLine(x.line)}`];
          case "leftonly":
            return [`LL: ${renderLine(x.line)}`];
          case "same":
            return [`RL: ${renderLine(x.line)}`];
          case "different":
            return [`L[: ${renderLine(x.left)}`, `]R: ${renderLine(x.right)}`];
        }
      })
      .flat();
  };

  it("Should get object model", () => {
    const a = { a: 1, b: 2, d: {}, c: { e: 3 } };
    const model = getObjectModel(a);

    const readable = renderObjectModel(model);
    expect(readable).toEqual([
      "{",
      '  "a": 1',
      '  "b": 2',
      '  "c": {',
      '    "e": 3',
      "  }",
      '  "d": {',
      "  }",
      "}",
    ]);
  });

  it("Should compare same objects", () => {
    const a = { a: 1, b: 2, d: {}, c: { e: 3 } };
    const diff = computeDiff(a, a);

    const readable = toReadable(diff);
    expect(readable).toMatchInlineSnapshot(`
      Array [
        "RL: {",
        "RL:   \\"a\\": 1",
        "RL:   \\"b\\": 2",
        "RL:   \\"c\\": {",
        "RL:     \\"e\\": 3",
        "RL:   }",
        "RL:   \\"d\\": {",
        "RL:   }",
        "RL: }",
      ]
    `);
  });
});
