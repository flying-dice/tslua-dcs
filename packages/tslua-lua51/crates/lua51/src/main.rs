//! `tslua-lua51` — the repository-managed Lua 5.1.5 interpreter.
//!
//! A drop-in for the stock `lua` executable (`lua [options] [script [args]]`)
//! built on `mlua` with vendored PUC Lua 5.1.5, so every script in the repo
//! runs on the same Lua regardless of what the host has installed.
//!
//! Differences from stock `lua`, all deliberate:
//! - `LuaSocket` (`socket`, `mime`, `ltn12`, `socket.*`) is compiled in and
//!   registered in `package.preload`; no shared libraries are ever loaded.
//! - `package.path` is pinned to `./?.lua;./?/init.lua` and `package.cpath`
//!   is empty. `LUA_PATH`, `LUA_CPATH` and `LUA_INIT` from the host are ignored.
//! - `--preload <file>` runs a Lua file in the same state before the main
//!   script. This is the seam for installing test doubles of DCS globals
//!   (`env`, `timer`, `trigger`, `world`, ...) ahead of the code under test.
//! - No interactive REPL: with no script, the chunk is read from stdin.

use std::ffi::c_int;
use std::io::{Read, Write};
use std::process::ExitCode;

use mlua::{Lua, MultiValue, Table};

// Exported by the vendored LuaSocket sources compiled in build.rs.
unsafe extern "C-unwind" {
    fn luaopen_socket_core(state: *mut mlua::lua_State) -> c_int;
    fn luaopen_mime_core(state: *mut mlua::lua_State) -> c_int;
}

/// `LuaSocket`'s Lua-side modules, embedded so the binary is self-contained.
const EMBEDDED_MODULES: &[(&str, &str)] = &[
    (
        "socket",
        include_str!("../../../vendor/luasocket/src/socket.lua"),
    ),
    (
        "ltn12",
        include_str!("../../../vendor/luasocket/src/ltn12.lua"),
    ),
    (
        "mime",
        include_str!("../../../vendor/luasocket/src/mime.lua"),
    ),
    (
        "socket.http",
        include_str!("../../../vendor/luasocket/src/http.lua"),
    ),
    (
        "socket.url",
        include_str!("../../../vendor/luasocket/src/url.lua"),
    ),
    (
        "socket.tp",
        include_str!("../../../vendor/luasocket/src/tp.lua"),
    ),
    (
        "socket.ftp",
        include_str!("../../../vendor/luasocket/src/ftp.lua"),
    ),
    (
        "socket.headers",
        include_str!("../../../vendor/luasocket/src/headers.lua"),
    ),
    (
        "socket.smtp",
        include_str!("../../../vendor/luasocket/src/smtp.lua"),
    ),
];

const USAGE: &str = "\
usage: lua51 [options] [script [args]]
Available options are:
  -e stat          execute string 'stat'
  -l name          require library 'name'
  --preload file   run 'file' before the script (e.g. to install DCS test doubles)
  -v               show version information
  --               stop handling options
  -                execute stdin and stop handling options
";

enum Action {
    Exec(String),
    Require(String),
    Preload(String),
}

struct Invocation {
    actions: Vec<Action>,
    show_version: bool,
    /// The script to run: `Some("-")` for stdin, `None` for none given.
    script: Option<String>,
    /// All of argv; `script_index` locates the script within it.
    argv: Vec<String>,
    script_index: usize,
}

fn parse_args(argv: Vec<String>) -> Result<Invocation, String> {
    let mut actions = Vec::new();
    let mut show_version = false;
    let mut index = 1;
    while let Some(current) = argv.get(index).map(String::as_str) {
        match current {
            "--" => {
                index += 1;
                break;
            }
            "-" => break,
            "-v" => show_version = true,
            "-e" | "-l" | "--preload" => {
                let Some(value) = argv.get(index + 1).cloned() else {
                    return Err(format!("'{current}' needs argument"));
                };
                actions.push(match current {
                    "-e" => Action::Exec(value),
                    "-l" => Action::Require(value),
                    _ => Action::Preload(value),
                });
                index += 1;
            }
            _ if current.starts_with("--") => {
                return Err(format!("unrecognized option '{current}'"));
            }
            _ if current.starts_with("-e") => {
                actions.push(Action::Exec(current["-e".len()..].to_owned()));
            }
            _ if current.starts_with("-l") => {
                actions.push(Action::Require(current["-l".len()..].to_owned()));
            }
            _ if current.starts_with('-') => {
                return Err(format!("unrecognized option '{current}'"));
            }
            _ => break,
        }
        index += 1;
    }
    Ok(Invocation {
        actions,
        show_version,
        script: argv.get(index).cloned(),
        argv,
        script_index: index,
    })
}

fn create_state() -> mlua::Result<Lua> {
    // SAFETY: the full standard library (including `debug`) is what the stock
    // interpreter and DCS expose; scripts run here are trusted repo code.
    let lua = unsafe { Lua::unsafe_new() };
    let package: Table = lua.globals().get("package")?;
    package.set("path", "./?.lua;./?/init.lua")?;
    package.set("cpath", "")?;

    let preload: Table = package.get("preload")?;
    // SAFETY: both are genuine `lua_CFunction`s from LuaSocket, compiled
    // against the same Lua 5.1 headers as the interpreter they are linked into.
    unsafe {
        preload.set("socket.core", lua.create_c_function(luaopen_socket_core)?)?;
        preload.set("mime.core", lua.create_c_function(luaopen_mime_core)?)?;
    }
    for (name, source) in EMBEDDED_MODULES {
        let loader = lua
            .load(*source)
            .set_name(format!("@[embedded]/{name}.lua"))
            .into_function()?;
        preload.set(*name, loader)?;
    }
    Ok(lua)
}

/// Mirrors `luaL_loadfile`: a leading `#` line (shebang) is skipped, keeping
/// the newline so reported line numbers still match the file.
fn strip_shebang(mut source: Vec<u8>) -> Vec<u8> {
    if source.first() == Some(&b'#') {
        let end = source
            .iter()
            .position(|&b| b == b'\n')
            .unwrap_or(source.len());
        source.drain(..end);
    }
    source
}

fn load_file(lua: &Lua, path: &str) -> mlua::Result<mlua::Function> {
    let source = std::fs::read(path)
        .map_err(|e| mlua::Error::runtime(format!("cannot open {path}: {e}")))?;
    lua.load(strip_shebang(source))
        .set_name(format!("@{path}"))
        .into_function()
}

fn load_stdin(lua: &Lua) -> mlua::Result<mlua::Function> {
    let mut source = Vec::new();
    std::io::stdin()
        .read_to_end(&mut source)
        .map_err(|e| mlua::Error::runtime(format!("cannot read stdin: {e}")))?;
    lua.load(strip_shebang(source))
        .set_name("=stdin")
        .into_function()
}

fn run(invocation: &Invocation) -> mlua::Result<()> {
    let lua = create_state()?;

    // The `arg` table, laid out exactly as stock lua does: the script at 0,
    // the interpreter and its options at negative indices, script args at 1..n.
    let arg = lua.create_table()?;
    let script_index = i64::try_from(invocation.script_index).unwrap_or(i64::MAX);
    for (position, value) in (0_i64..).zip(invocation.argv.iter()) {
        arg.raw_set(position - script_index, value.as_str())?;
    }
    lua.globals().set("arg", arg)?;

    if invocation.show_version {
        let mut stdout = std::io::stdout();
        let _ = writeln!(
            stdout,
            "Lua 5.1.5  Copyright (C) 1994-2012 Lua.org, PUC-Rio"
        );
    }

    for action in &invocation.actions {
        match action {
            Action::Exec(chunk) => lua
                .load(chunk.as_str())
                .set_name("=(command line)")
                .exec()?,
            Action::Require(name) => {
                let require: mlua::Function = lua.globals().get("require")?;
                require.call::<()>(name.as_str())?;
            }
            Action::Preload(path) => load_file(&lua, path)?.call::<()>(())?,
        }
    }

    let script_args = invocation
        .argv
        .iter()
        .skip(invocation.script_index + 1)
        .map(|value| lua.create_string(value).map(mlua::Value::String))
        .collect::<mlua::Result<MultiValue>>()?;

    match invocation.script.as_deref() {
        Some("-") => load_stdin(&lua)?.call::<()>(script_args),
        Some(path) => load_file(&lua, path)?.call::<()>(script_args),
        None if invocation.actions.is_empty() && !invocation.show_version => {
            load_stdin(&lua)?.call::<()>(script_args)
        }
        None => Ok(()),
    }
}

fn main() -> ExitCode {
    let mut stderr = std::io::stderr();
    let invocation = match parse_args(
        std::env::args_os()
            .map(|value| value.to_string_lossy().into_owned())
            .collect(),
    ) {
        Ok(invocation) => invocation,
        Err(message) => {
            let _ = write!(stderr, "lua51: {message}\n{USAGE}");
            return ExitCode::FAILURE;
        }
    };
    let result = run(&invocation);
    let _ = std::io::stdout().flush();
    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            let _ = writeln!(stderr, "lua51: {error}");
            ExitCode::FAILURE
        }
    }
}
