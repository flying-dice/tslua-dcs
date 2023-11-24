# tslua-mizkit

## Description

tslua-mizkit is a DCS World Mission Kit, which utilizes `tslua-dcs` and `TypescriptToLua` for enhancing the mission development experience in DCS World. 

This project aims to provide a robust and efficient way to build DCS World scripts using typescript.

It aims to expose various utilities and functions to aid in the process of making DCS scripts.

It can be used directly in LUA (by importing the bundle) and accessing the functions under the namespace 'MK'
or it can be used by installing it as a typescript dependency and running the code producing your own mission bundle.

## Installation

To install this package, ensure you have Node.js installed, then run:

```bash
npm install @flying-dice/tslua-mizkit
```

## Usage

[See the Docs](https://flying-dice.github.io/tslua-dcs/modules/_flying_dice_tslua_dcs_mizkit.html)

## Building

To build the project, run:

```bash
npm run build
```

This will compile the TypeScript files to Lua and produce typescript definition files.

This will also bundle the project and all its dependencies into a single file in `bundle/dcs-mizkit.bundle.lua`

Run this bundle on mission start to get access to the functions.

## Development

- **Watch Mode**: Run `npm run build:watch` for development mode with hot reloading.
- **Documentation**: Generate documentation using `npm run build:docs`.
- **Testing**: Execute tests with `npm test`.

## Contributing

Contributions are welcome! Please read our contributing guidelines for more information.

## License

This project is ISC licensed. See the LICENSE file for details.
```

This README provides a basic overview of the project, including a description, installation and usage instructions, build commands, and other relevant information. You can tailor it to fit the specifics of your project, such as adding more detailed usage examples, contribution guidelines, and any other information you deem necessary.