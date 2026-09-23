# tslua-lua51

The repository-managed Lua 5.1.5 interpreter. Every Lua script in this monorepo launches through it, so
nothing depends on a Lua, LuaRocks or LuaSocket installed on the host. Private: never published.

## What it is

`tslua-lua51` is a Rust CLI (`crates/lua51`) built on [mlua](https://github.com/mlua-rs/mlua) with the
`lua51` + `vendored` features, so PUC Lua 5.1.5 (the Lua DCS World embeds) is compiled from the checksummed
`lua-src` crate. [LuaSocket 3.1.0](https://github.com/lunarmodules/luasocket) is vendored under
`vendor/luasocket` (MIT, see its `LICENSE`), compiled by `build.rs` and linked statically; its Lua modules are
embedded in the binary.

The layout mirrors the [dcs-studio bridge](https://github.com/flying-dice/dcs-studio/tree/main/bridge): a
Cargo workspace with a pinned `rust-toolchain.toml` and a workspace lint policy that denies panic paths.

## Usage

The `lua51` npm bin builds the interpreter if needed (a no-op when up to date), then runs it:

```shell
lua51 [options] [script [args]]
  -e stat          execute string 'stat'
  -l name          require library 'name'
  --preload file   run 'file' before the script
  -v               show version information
  --               stop handling options
  -                execute stdin and stop handling options
lua51 --setup      build only and print the binary path
```

It behaves like stock `lua` with these deliberate differences:

- `package.path` is pinned to `./?.lua;./?/init.lua` and `package.cpath` is empty; host `LUA_PATH`,
  `LUA_CPATH` and `LUA_INIT` are ignored.
- `socket`, `socket.*`, `mime` and `ltn12` resolve from `package.preload`; no shared libraries load.
- There is no interactive REPL. With no script (and no `-e` or `-v`) the chunk is read from stdin, also after
  `-l` or `--preload`, as stock `lua` does.

## DCS test doubles

`--preload` runs a file in the same Lua state before the script under test. Use it to install test
doubles of the DCS environment (`env`, `timer`, `trigger`, `world`, `coalition`, ...) so Lua unit tests can
exercise code that calls DCS functions:

```shell
lua51 --preload tests/dcs-doubles.lua .test/tests.lua
```

See `tests/dcs-doubles.lua` for a minimal example.

## Development

```shell
npm test --workspace=@flying-dice/tslua-lua51   # rustfmt, clippy (-D warnings) and the smoke tests
```

Raise the toolchain in `rust-toolchain.toml` deliberately, and keep the version in
`.github/workflows/npm-publish.yml` in step with it.
