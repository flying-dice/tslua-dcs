// Compiles the vendored LuaSocket C sources into a static library that is
// linked into the interpreter, so `socket.core` / `mime.core` are available
// without loading shared libraries (the binary is self-contained).
//
// The Lua 5.1.5 headers come from `mlua-sys` (vendored `lua-src`): it declares
// `links = "lua"` and publishes its include directory as `DEP_LUA_INCLUDE` to
// crates that depend on it directly — which is why `mlua-sys` is a direct
// dependency of this crate, not only a transitive one via `mlua`.
use std::env;
use std::path::PathBuf;

const SOCKET_SOURCES: &[&str] = &[
    "luasocket",
    "timeout",
    "buffer",
    "io",
    "auxiliar",
    "compat",
    "options",
    "inet",
    "except",
    "select",
    "tcp",
    "udp",
    "mime",
];

fn main() {
    let Some(lua_include) = env::var_os("DEP_LUA_INCLUDE") else {
        println!("cargo::error=DEP_LUA_INCLUDE not set: mlua-sys must be built with the `vendored` feature");
        return;
    };
    let manifest_dir = PathBuf::from(env::var_os("CARGO_MANIFEST_DIR").unwrap_or_default());
    let socket_src = manifest_dir.join("../../vendor/luasocket/src");
    let windows = env::var_os("CARGO_CFG_WINDOWS").is_some();

    let mut build = cc::Build::new();
    // Only the Lua headers go on the include path. LuaSocket's own headers are
    // reached through quoted includes relative to each source file; putting
    // its directory on `-I` would shadow system headers such as <io.h>.
    build
        .include(&lua_include)
        .define("LUASOCKET_NODEBUG", None)
        .define("LUASOCKET_API", Some(""))
        .warnings(false);

    if windows {
        build
            .define("_WIN32_WINNT", Some("0x0601"))
            .define("WINVER", Some("0x0601"))
            .define("_CRT_SECURE_NO_WARNINGS", None)
            .define("_WINSOCK_DEPRECATED_NO_WARNINGS", None);
    }

    for name in SOCKET_SOURCES {
        build.file(socket_src.join(format!("{name}.c")));
    }
    build.file(socket_src.join(if windows { "wsocket.c" } else { "usocket.c" }));
    build.compile("luasocket");

    if windows {
        println!("cargo::rustc-link-lib=ws2_32");
    }
    println!("cargo::rerun-if-changed={}", socket_src.display());
    println!("cargo::rerun-if-changed=build.rs");
}
