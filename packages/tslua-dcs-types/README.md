## DCS World TypeScript Type Definitions

This repository contains TypeScript type definitions for DCS World, enabling developers to use TypeScript’s powerful type system when scripting for DCS World. These type definitions are designed to be used with TypeScriptToLua to transpile TypeScript code into Lua, which is the scripting language used by DCS World.

### Installation

To use these type definitions in your project, you need to have Node.js and npm installed. You can then install the type definitions via npm with the command 

```shell
npm install @flying-dice/tslua-dcs-types
```

### Usage

After installation, include these types in your TypeScript project to get type checking and IntelliSense for DCS World’s API.

1.	Set up your TypeScript project to transpile to Lua. See TypeScriptToLua’s Getting Started Guide for more information.
2.	Import the DCS World types into your TypeScript files as needed with the appropriate import statement.
3.	Use the DCS World API with TypeScript’s type checking.

### The Good

Using typescript over lua offers some great benefits:
- Intelligence and type safety
- JavaScript ecosystem of dev tools, jest, mocks, linters and for matters
- Great support for both functional and OOP patterns

You can also leverage the amazing power of dependencies with NPM as a package manager. 

https://typescripttolua.github.io/docs/external-code

### The Bad 
You are not writing JavaScript you can work like you’re inside the JS ecosystem. Don’t expect NPM libraries to just work. Remember you’re transpiling your TS to Lua. It’s not running on NodeJS. That said if you can find NPM modules that you can lift TS source code from you should be ok and just paste them in a lib folder as long as they don’t use NodeJS or Browser APIs. 

Take note of this list:
https://github.com/TypeScriptToLua/TypeScriptToLua/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3A%22missing+feature%22

### Features

- Comprehensive type definitions for the DCS World scripting API.
- Includes types for commonly used modules, functions, and objects in DCS World.
- Regular updates to keep up with the latest DCS World API changes.

### Contribution

Contributions to this project are welcome. If you find an issue or have suggestions for improvements, please open an issue or submit a pull request.

There are various ways to datamine dcs and of course the docs are a great source of information.

This project has relied heavily on DCSFiddle and the explore window which can help with exploring tables. 

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