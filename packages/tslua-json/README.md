# @flying-dice/tslua-json

JSON ([RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)) encoding and decoding for
[TypeScriptToLua](https://typescripttolua.github.io/), written in TypeScript and compiled to Lua 5.1, so it runs
unchanged in DCS World. It replaces `@flying-dice/tslua-rxi-json`.

- **Exact numbers:** they are written exactly as JavaScript's `JSON.stringify` writes them, using the shortest
  form that round-trips. `0.1 + 0.2` stays `0.30000000000000004` and `2^53` stays `9007199254740992`.
- **Strict parser:** errors give the line and column. Deep nesting is capped, so it can't overflow the stack.
- **Clear encode errors:** functions, NaN, infinity, cycles and unsupported keys fail with a path to the bad value,
  for example `$.handlers[2]`.
- **Lua's single table type is handled explicitly:** see [Lua tables and JSON](#lua-tables-and-json).
- **Callable from plain Lua:** `json.encode(t)` works in a DCS script.

## Installation

```shell
npm install @flying-dice/tslua-json
```

## Usage

```typescript
import * as json from "@flying-dice/tslua-json";

json.encode({ unit: "F-16C", alt: 7620.5 }); // {"unit":"F-16C","alt":7620.5} (key order follows pairs)
json.encode({ b: 1, a: [1, 2] }, { sortKeys: true, indent: 2 });

const payload = json.decode<{ unit: string; alt: number }>(body);
```

## API

| Export | Description |
| --- | --- |
| `encode(value, options?)` | Encodes a value. Options: `indent` (number or string, as in `JSON.stringify`), `sortKeys`, `emptyTable` (`"array"` by default, or `"object"`), and `maxDepth` (512 by default). |
| `decode<T>(text, options?)` | Parses JSON text. Options: `nullValue` (what `null` becomes, `undefined` by default) and `maxDepth` (512 by default). `T` isn't checked at runtime. |
| `NULL` | A sentinel for JSON `null`. It encodes as `null`, and `decode` returns it when you pass it as `nullValue`. |
| `isNull(value)` | Checks whether a value is `NULL`. |
| `asArray(table)`, `asObject(table)` | Marks a table so it always encodes as an array or an object, even when empty. |

Both `encode` and `decode` throw an `Error` whose message starts with `json.encode:` or `json.decode:`.

## Lua tables and JSON

Lua has one table type and no `null`, so the conversion follows these rules:

| Situation | Behaviour |
| --- | --- |
| `null` when decoding | Becomes `undefined` (nil) by default, so object keys disappear and arrays get holes. Pass `{ nullValue: json.NULL }` to keep every `null`; the result also encodes back exactly. |
| `[]` and `{}` when decoding | Decoded tables remember whether they were an array or an object, so they re-encode as the same kind even when empty. |
| A table you build yourself | Keys `1..n` make an array, and holes encode as `null`, as in JavaScript. String keys make an object; any positive integer keys beside them become strings, as with `JSON.stringify({ 1: "a", b: 2 })`. |
| An empty table you build yourself | Encodes as `[]` unless you mark it with `asObject` or pass `emptyTable: "object"`. |
| Class instances | Encode their own fields, not their methods. Implement `toJSON()` to choose the shape, as in JavaScript. |
| Keys that are not strings or positive integers, NaN, infinity, functions, cycles, and arrays sparser than about 2:1 | These are errors. |
| Strings | Treated as UTF-8 bytes. `\uXXXX` escapes are decoded to UTF-8, and an unpaired surrogate becomes U+FFFD. Invalid UTF-8 passes through unchanged. |

## Migrating from `@flying-dice/tslua-rxi-json`

Replace the import. `encode` and `decode` keep their names. The differences you may notice:

- Numbers keep their full precision, so outputs such as `0.30000000000000004` or `9007199254740992` appear where
  rxi wrote `0.3` or `9.007199254741e+15`.
- Empty objects decoded from JSON now re-encode as `{}`. rxi turned them into `[]`.
- Decoding is strict: `0x10`, `01`, `1.` and trailing commas are now errors. A string key beside integer keys,
  as in `{1: "a", b: 2}`, now encodes as an object instead of throwing.
- Error messages start with `json.encode:` or `json.decode:` and give a path, or a line and column.

## Development

The Lua test suite runs on the repo-managed Lua 5.1.5 interpreter (`lua51`):

```shell
npm run test:lua --workspace=@flying-dice/tslua-json
```

`tests/corpus.ts` holds expected values produced by Node's `JSON.parse` and `JSON.stringify`:

- 50 documents that must parse and 63 that must be rejected, each classification checked against Node;
- 250 seeded random documents;
- 3,000 numbers, including subnormals and arbitrary bit patterns.

Regenerate it with `npm run generate:corpus --workspace=@flying-dice/tslua-json`.
