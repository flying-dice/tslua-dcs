## DCS World TypeScript Type Definitions

This repository contains TypeScript type definitions for DCS World, enabling developers to use TypeScript’s powerful type system when scripting for DCS World. These type definitions are designed to be used with TypeScriptToLua to transpile TypeScript code into Lua, which is the scripting language used by DCS World.

### Installation

To use these type definitions in your project, you need to have Node.js and npm installed. You can then install the type definitions via npm with the command 

```shell
npm install @flying-dice/tslua-dcs-types
```

### Usage

> TBC

### Contribution

Contributions to this project are welcome. If you find an issue or have suggestions for improvements, please open an issue or submit a pull request.

There are various ways to datamine dcs and of course the docs are a great source of information.

This project has relied heavily on DCSFiddle and the explore window which can help with exploring tables.

#### Exports

To seed the initial interface data is mined from DCS using DCS Fiddle.

https://dcsfiddle.pages.dev/

Once DCS Fiddle is setup run 

```shell
npm run export
```

This will
1. Read the export script `packages/tslua-dcs-types/scripts/export.fiddle.lua`
2. This will connect to DCS fiddle, traverse the namespaces
3. Assemble a foundation typescript interface

From here you can extend the underlying interface and replace the typing information.

Updating the `packages/tslua-dcs-types/src/index.d.ts` with a variable where the type is of your extending interface will allow it to be used.

To add new namespaces to be exported update the `.exporttc.yaml` and run the `npm run export` again.

#### Useful Resources
- https://dcsfiddle.pages.dev/
- https://www.digitalcombatsimulator.com/en/support/faq/1249/
- https://wiki.hoggitworld.com/view/Simulator_Scripting_Engine_Documentation

### License

This project is licensed under the MIT License.

### Acknowledgments

- Thanks to the TypeScriptToLua team for their incredible tool.
- Special thanks to the DCS World community for their continuous support and contributions.

### Contact

For any inquiries or contributions, please open an issue on this repository.