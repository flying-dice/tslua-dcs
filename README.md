[![Join Discord](https://img.shields.io/badge/Join-blue?logo=discord&label=Discord)](https://discord.gg/bT7BEHn5RD) 
[![Discord](https://img.shields.io/discord/738118932937834566?logo=discord&label=Discord)](https://discord.com/channels/738118932937834566/1178991295260278785) 
[![tslua-codebot](https://img.shields.io/badge/CodeBot-tslua%20dcs-blue?logo=openai)](https://chat.openai.com/g/g-6643nUbup-tslua-dcs-codebot)
[![patreon](https://img.shields.io/badge/Patreon-flyingdice-red?logo=patreon)](https://patreon.com/flyingdice)

## Overview

This repository contains a collection of TypeScript first libraries for DCS World.

This collection of packages uses Typescript to author the code and TypeScriptToLua to transpile TypeScript code into Lua.

The shared code libraries are published to NPM where they can be installed separately for authoring further projects using the same technique.

Some useful Docs include:
- **Getting started with TypescriptToLua:** https://typescripttolua.github.io/docs/publishing-modules
- **Sharing code and re-using modules with TypescriptToLua:** https://typescripttolua.github.io/docs/getting-started
- **Caveats to account for:** https://typescripttolua.github.io/docs/caveats

### Usage

Detailed usage instructions will be added soon.

### Updating

See the [UPDATING.md](UPDATING.md) file for instructions on updating the definitions.

### Updating Dependencies

To check the dependencies across all monorepo packages, run the following command:

```bash
ncu
lerna exec -- ncu
```

To Update them all, run:

```bash
ncu -u
lerna exec -- ncu -u
```

### Pros
- **Type Safety**: TypeScript provides static type-checking, which helps catch errors at compile time, leading to more robust and maintainable code.
- **Familiar Syntax**: TypeScript syntax is similar to JavaScript, making it easier for JavaScript developers to transition.
- **Modern Features**: TypeScript supports modern JavaScript features such as classes, modules, and async/await, which can be transpiled to Lua.
- **Tooling and IDE Support**: TypeScript has excellent tooling and IDE support, including autocompletion, refactoring, and debugging capabilities.

### Cons
- **Complexity**: The transpilation process can add complexity to the build and deployment pipeline, requiring additional tools and configuration.
- **Interoperability Issues**: Some Lua features and idioms may not map directly to TypeScript, potentially causing interoperability issues.
- **Learning Curve**: Developers unfamiliar with TypeScript may face a learning curve, especially with its type system and advanced features.
- **Debugging**: Debugging transpiled Lua code can be challenging, as the source maps may not always accurately represent the original TypeScript code.

Take note of this list:

https://github.com/TypeScriptToLua/TypeScriptToLua/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3A%22missing+feature%22

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
