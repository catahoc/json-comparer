import { Diff } from "../diff/line";
import {
  computeDiff,
  getObjectModel,
  renderLine,
  renderObjectModel,
} from "./compute-diff";

describe("compute diff", () => {
  const toReadable = (diff: Diff): string[] => {
    let lines = diff.lines.map((x) => {
      switch (x.type) {
        case "rightonly":
          return `${"X".repeat(20)}${renderLine(x.line).padEnd(20)}`;
        case "leftonly":
          return `${renderLine(x.line).padEnd(20)}${"X".repeat(20)}`;
        case "same":
          return `${renderLine(x.line).padEnd(20)}${renderLine(x.line).padEnd(
            20
          )}`;
        case "different":
          return `${renderLine(x.left).padEnd(19)}*${renderLine(x.right).padEnd(
            20
          )}`;
      }
    });
    console.log(lines.join("\r\n"));
    return lines;
  };

  it("Should get object model", () => {
    const a = { a: 1, b: 2, d: {}, c: { e: [1, "abc", { f: 3 }, [], [2.3]] } };
    const model = getObjectModel(a);

    const readable = renderObjectModel(model);
    console.log(readable.join("\r\n"));
    expect(readable).toMatchInlineSnapshot(`
      Array [
        "{",
        "  \\"a\\": 1,",
        "  \\"b\\": 2,",
        "  \\"c\\": {",
        "    \\"e\\": [",
        "      1,",
        "      \\"abc\\",",
        "      {",
        "        \\"f\\": 3",
        "      },",
        "      [",
        "      ],",
        "      [",
        "        2.3",
        "      ]",
        "    ]",
        "  },",
        "  \\"d\\": {",
        "  }",
        "}",
      ]
    `);
  });

  it("Should compare same objects", () => {
    const a = { a: 1, b: 2, d: {}, c: { e: 3 } };
    const b = { d: {}, a: 1, b: 2, c: { e: 3 } };
    const diff = computeDiff(a, b);

    const readable = toReadable(diff);
    expect(readable).toMatchInlineSnapshot(`
      Array [
        "{                   {                   ",
        "  \\"a\\": 1,             \\"a\\": 1,           ",
        "  \\"b\\": 2,             \\"b\\": 2,           ",
        "  \\"c\\": {              \\"c\\": {            ",
        "    \\"e\\": 3              \\"e\\": 3          ",
        "  },                  },                ",
        "  \\"d\\": {              \\"d\\": {            ",
        "  }                   }                 ",
        "}                   }                   ",
      ]
    `);
  });

  it("Should compare values", () => {
    const a = { a: 1 };
    const b = { a: 2 };
    const diff = computeDiff(a, b);

    const readable = toReadable(diff);
    expect(readable).toMatchInlineSnapshot(`
      Array [
        "{                   {                   ",
        "  \\"a\\": 1           *  \\"a\\": 2            ",
        "}                   }                   ",
      ]
    `);
  });

  it("Should compare same objects", () => {
    const a = { a: { b: 1 } };
    const b = { a: { b: 2 } };
    const diff = computeDiff(a, b);

    const readable = toReadable(diff);
    expect(readable).toMatchInlineSnapshot(`
      Array [
        "{                   {                   ",
        "  \\"a\\": {              \\"a\\": {            ",
        "    \\"b\\": 1         *    \\"b\\": 2          ",
        "  }                   }                 ",
        "}                   }                   ",
      ]
    `);
  });

  it("Should compare different objects", () => {
    const a = { a: { b: 1 } };
    const b = { b: { b: 1 } };
    const diff = computeDiff(a, b);

    const readable = toReadable(diff);
    expect(readable).toMatchInlineSnapshot(`
      Array [
        "{                   {                   ",
        "  \\"a\\": {            XXXXXXXXXXXXXXXXXXXX",
        "    \\"b\\": 1          XXXXXXXXXXXXXXXXXXXX",
        "  }                 XXXXXXXXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXXXXXXX  \\"b\\": {            ",
        "XXXXXXXXXXXXXXXXXXXX    \\"b\\": 1          ",
        "XXXXXXXXXXXXXXXXXXXX  }                 ",
        "}                   }                   ",
      ]
    `);
  });

  it("Should compare object vs primitive", () => {
    const a = { a: { b: 1 } };
    const b = { b: 1 };
    const diff = computeDiff(a, b);

    const readable = toReadable(diff);
    expect(readable).toMatchInlineSnapshot(`
      Array [
        "{                   {                   ",
        "  \\"a\\": {            XXXXXXXXXXXXXXXXXXXX",
        "    \\"b\\": 1          XXXXXXXXXXXXXXXXXXXX",
        "  }                 XXXXXXXXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXXXXXXX  \\"b\\": 1            ",
        "}                   }                   ",
      ]
    `);
  });

  it("Should compare primitive vs object", () => {
    const a = { a: 2 };
    const b = { b: { b: 1 } };
    const diff = computeDiff(a, b);

    const readable = toReadable(diff);
    expect(readable).toMatchInlineSnapshot(`
      Array [
        "{                   {                   ",
        "  \\"a\\": 2            XXXXXXXXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXXXXXXX  \\"b\\": {            ",
        "XXXXXXXXXXXXXXXXXXXX    \\"b\\": 1          ",
        "XXXXXXXXXXXXXXXXXXXX  }                 ",
        "}                   }                   ",
      ]
    `);
  });

  it("Should compare object vs primitive of the same name", () => {
    const a = { b: { b: 1 } };
    const b = { b: 1 };
    const diff = computeDiff(a, b);

    const readable = toReadable(diff);
    expect(readable).toMatchInlineSnapshot(`
      Array [
        "{                   {                   ",
        "  \\"b\\": {           *  \\"b\\": 1            ",
        "    \\"b\\": 1          XXXXXXXXXXXXXXXXXXXX",
        "  }                 XXXXXXXXXXXXXXXXXXXX",
        "}                   }                   ",
      ]
    `);
  });

  it("Should compare primitive vs object of the same name", () => {
    const a = { b: 2 };
    const b = { b: { b: 1 } };
    const diff = computeDiff(a, b);

    const readable = toReadable(diff);
    expect(readable).toMatchInlineSnapshot(`
      Array [
        "{                   {                   ",
        "  \\"b\\": 2           *  \\"b\\": {            ",
        "XXXXXXXXXXXXXXXXXXXX    \\"b\\": 1          ",
        "XXXXXXXXXXXXXXXXXXXX  }                 ",
        "}                   }                   ",
      ]
    `);
  });

  it("Should compare different primitives", () => {
    const a = { a: 1, b: 2, c: null, d: true, e: false, f: 1.2, g: "xyz" };
    const b = { a: 2, b: 3, c: true, d: false, e: null, f: 1.2, g: "abc" };
    const diff = computeDiff(a, b);

    const readable = toReadable(diff);
    expect(readable).toMatchInlineSnapshot(`
      Array [
        "{                   {                   ",
        "  \\"a\\": 1,          *  \\"a\\": 2,           ",
        "  \\"b\\": 2,          *  \\"b\\": 3,           ",
        "  \\"c\\": null,       *  \\"c\\": true,        ",
        "  \\"d\\": true,       *  \\"d\\": false,       ",
        "  \\"e\\": false,      *  \\"e\\": null,        ",
        "  \\"f\\": 1.2,           \\"f\\": 1.2,         ",
        "  \\"g\\": \\"xyz\\"       *  \\"g\\": \\"abc\\"        ",
        "}                   }                   ",
      ]
    `);
  });
});
