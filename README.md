[![Join Discord](https://img.shields.io/badge/Join-blue?logo=discord&label=Discord)](https://discord.gg/bT7BEHn5RD) 
[![Discord](https://img.shields.io/discord/738118932937834566?logo=discord&label=Discord)](https://discord.com/channels/738118932937834566/1178991295260278785) 
[![tslua-codebot](https://img.shields.io/badge/CodeBot-tslua%20dcs-blue?logo=openai)](https://chat.openai.com/g/g-6643nUbup-tslua-dcs-codebot)

## Overview

This repository contains a collection of TypeScript first libraries for DCS World.

This collection of packages uses Typescript to author the code and TypeScriptToLua to transpile TypeScript code into Lua.

The shared code libraries are published to NPM where they can be installed separately for authoring further projects using the same technique.

Some useful Docs include:
- **Getting started with TypescriptToLua:** https://typescripttolua.github.io/docs/publishing-modules
- **Sharing code and re-using modules with TypescriptToLua:** https://typescripttolua.github.io/docs/getting-started
- **Caveats to account for:** https://typescripttolua.github.io/docs/caveats

### Usage

> TBC

### The Good

Using typescript over lua offers some great benefits:
- Intelligence and type safety
- JavaScript ecosystem of dev tools, jest, mocks, linters and formatters
- Great support for both functional and OOP patterns

You can also leverage the amazing power of dependencies with NPM as a package manager.

https://typescripttolua.github.io/docs/external-code

### The Bad
You are not writing JavaScript you can work like you’re inside the JS ecosystem. Don’t expect NPM libraries to just work. Remember you’re transpiling your TS to Lua. It’s not running on NodeJS. That said if you can find NPM modules that you can lift TS source code from you should be ok and just paste them in a lib folder as long as they don’t use NodeJS or Browser APIs.

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
