# @flying-dice/tslua-base64

Base64 encoding and decoding ([RFC 4648](https://www.rfc-editor.org/rfc/rfc4648)) for
[TypeScriptToLua](https://typescripttolua.github.io/), written in TypeScript and compiled to Lua 5.1, so it runs
unchanged in DCS World.

- Standard (`+/`) and URL-safe (`-_`) alphabets, with or without `=` padding.
- Binary-safe: Lua strings are byte strings, so `\0` and bytes above 127 round-trip exactly.
- Strict decoding with precise errors (character and 1-based byte position), plus a non-throwing `tryDecode`.
- No bitwise operators, `bit32` or `utf8`, none of which Lua 5.1 has.
- Callable from plain Lua too: the module is compiled without an implicit `self`, so
  `base64.encode(s)` works from a DCS script.

## Installation

```shell
npm install @flying-dice/tslua-base64
```

## Usage

```typescript
import * as base64 from "@flying-dice/tslua-base64";

base64.encode("return 1 + 1"); // "cmV0dXJuIDEgKyAx"
base64.decode("cmV0dXJuIDEgKyAx"); // "return 1 + 1"

// URL-safe, unpadded (e.g. JWT segments)
base64.encode(string.char(0xfb, 0xff), { alphabet: "url", padding: false }); // "-_8"
base64.decode("-_8", { alphabet: "url" }); // string.char(0xfb, 0xff)

// Untrusted input
const bytes = base64.tryDecode(headerValue); // string | undefined
```

## API

| Function | Description |
| --- | --- |
| `encode(data, { alphabet?, padding? })` | Encodes bytes. `alphabet` is `"standard"` (default) or `"url"`; `padding` defaults to `true`. |
| `decode(text, { alphabet? })` | Decodes, throwing an `Error` on invalid input. |
| `tryDecode(text, { alphabet? })` | Decodes, returning `undefined` on invalid input. |

Decoding rules:

- Whitespace (space, tab, CR, LF) is ignored anywhere, so line-wrapped MIME and PEM input decodes.
- Padding is optional (`"Zg"` and `"Zg=="` both decode to `"f"`), but if present it must be correct and only
  at the end.
- Any character outside the selected alphabet is rejected, including `-`/`_` when decoding `"standard"` and `+`/`/`
  when decoding `"url"`.
- Unused low bits in the final character are ignored (`"Zh=="` decodes like `"Zg=="`), as most decoders do.

## Migrating from 0.33.x

Earlier versions wrapped the [lbase64](https://github.com/iskolbin/lbase64) Lua library. `encode(value)` and
`decode(text)` keep their names and results for valid padded input, but `decode` now:

- accepts unpadded input (previously a crash),
- throws on characters outside the alphabet (previously silently dropped) and on misplaced padding (previously
  decoded to garbage).

Use `tryDecode` where you previously relied on lenient decoding of untrusted input.

## Development

The Lua test suite runs on the repo-managed Lua 5.1.5 interpreter (`lua51`):

```shell
npm run test:lua --workspace=@flying-dice/tslua-base64
```

`tests/corpus.ts` holds 444 vectors whose expected values come from Node's `Buffer`; regenerate it with
`npm run generate:corpus --workspace=@flying-dice/tslua-base64`.
