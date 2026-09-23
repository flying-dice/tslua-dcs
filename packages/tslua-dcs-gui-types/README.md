## DCS World TypeScript Type Definitions

This repository contains TypeScript type definitions for DCS Worlds GUI Environment, enabling developers to use TypeScript’s powerful type system when scripting for DCS World. These type definitions are designed to be used with TypeScriptToLua to transpile TypeScript code into Lua, which is the scripting language used by DCS World.

### Installation

To use these type definitions in your project, you need to have Node.js and npm installed. You can then install the type definitions via npm with the command 

```shell
npm install @flying-dice/tslua-dcs-gui-types
```

### Usage

> TBC

### Contribution

Contributions to this project are welcome. If you find an issue or have suggestions for improvements, please open an issue or submit a pull request.

Exports use DCS Studio's GUI bridge. Follow the canonical [update guide](../../UPDATING.md), start DCS at the main menu, and run `npm run export`.

#### Exports

To refresh generated interface data, run

```shell
npm run export
```

This will
1. Read `scripts/export.bridge.lua`
2. Connect to the installed DCS Studio GUI bridge and traverse configured namespaces
3. Assemble a foundation typescript interface

From here you can extend the underlying interface and replace the typing information.

Updating the `packages/tslua-dcs-gui-types/src/index.d.ts` with a variable where the type is of your extending interface will allow it to be used.

To add namespaces, update `scripts/config.ts` and run `npm run export` again.

#### Testing

Everything runs offline on the repository's `lua51` interpreter with `@flying-dice/tslua-luatest`:

```shell
npm test --workspace=@flying-dice/tslua-dcs-gui-types        # declarations, doubles and export generator
npm test --workspace=@flying-dice/tslua-dcs-gui-types-test   # the executable examples, offline
npm run test:dcs:gui                                          # the same examples inside DCS (DCS Studio bridge)
```

- `tests/doubles/` holds the DCS GUI test doubles (`DCS`, `Export`, `net`, `lfs`, `log`, `terrain`,
  `coalition`, `db`), typed against these declarations and preloaded with `lua51 --preload`. See
  [tests/doubles/README.md](tests/doubles/README.md) for what they model and how to extend them.
- `tests/call-shapes.ts` calls every declared function once through a spy, checking that it compiles
  to a dot call with the declared arguments. `tests/lua-shapes.ts` covers multiple return values,
  callbacks DCS invokes (`DCS.setUserCallbacks`), iterators, overloads and object methods.
- `tests/surface.ts` checks that the doubles expose exactly the members of `src/exports/*.export.ts`.
- `npm run test:export` type-checks `scripts/` and tests `scripts/export.bridge.lua` against fixtures.

#### Useful Resources
- https://wiki.hoggitworld.com/view/DCS_server_gameGUI
- C:\Program Files\Eagle Dynamics\DCS World OpenBeta\API\DCS_ControlAPI.html

### License

This project is licensed under the MIT License.

### Acknowledgments

- Thanks to the TypeScriptToLua team for their incredible tool.
- Special thanks to the DCS World community for their continuous support and contributions.

### Contact

For any inquiries or contributions, please open an issue on this repository.
