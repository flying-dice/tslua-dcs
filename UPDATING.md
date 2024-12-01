# Updating Type Definitions for DCS World Mission Scripting

Type definitions act as a bridge between the scripting environment of DCS World and the typescript-to-lua transpiler. 

They enable features like code completion and error checking, making it easier to write scripts for DCS missions without having constant documentation of the entire LUA APIs.

This guide will help you regularly update these definitions, which is important because the scripting environment evolves over time. By keeping these files up-to-date, even those with minimal exposure can benefit from a smoother and more reliable scripting workflow.

This guide explains the step-by-step process to update type definition files for the DCS World scripting environment, leveraging the provided update script.

## Prerequisites

Before proceeding, ensure you have the following:

1. **Node.js and npm installed** on your system.
2. **DCS Fiddle Server** set up and running. Refer to the [DCS Fiddle documentation](https://dcsfiddle.pages.dev/) if needed.
3. The `dcs-fiddle-server.lua` script installed in your DCS Saved Games folder:
   ```
   %USERPROFILE%\Saved Games\DCS\Scripts\Hooks\dcs-fiddle-server.lua
   ```
4. The `require` and `package` modules de-sanitized in your DCS configuration.

## Updating Steps

Follow these steps to update the type definitions:

### Step 1: Start the DCS World with Fiddle Server

1. Open DCS and launch a new mission in the Mission Editor.
2. Confirm the server is running and listening both should reply with `{"result":"UP"}`
   ```shell
   curl http://127.0.0.1:12080/cmV0dXJuICJVUCI=?env=default
   curl http://127.0.0.1:12081/cmV0dXJuICJVUCI=?env=default
   ```
3. Verify an alert in DCS indicates that DCS Fiddle is active.

### Step 3: Run the Update Script

Run the update script to fetch and generate the definition files:

```bash
npm run export
```

### Step 4: Verify Output

Check the output directory for the newly generated definition files. These files provide type definitions for the DCS World mission scripting environment, enabling TypeScript-to-Lua transpilation.

```text
packages
 tslua-dcs-gui-types
  src
   exports
    DCS.export.ts
    ...
```

Each file contains the extracted type definitions for the DCS World scripting environment, which can be used in your TypeScript projects.

Ensure the version of the definitions matches the version of the DCS Fiddle server.

```text
/**
 * @version 2.9.9.2474 <<<< Should align to the DCS version
 * @noSelf
 **/
export interface _DCS {
	RCD_selectMenuItem(...args: any[]): unknown;
	exitProcess(...args: any[]): unknown;
```

## Additional Commands

To rebuild all project files after exporting:
```bash
npm run build:all
```

This ensures all docs and definitions are up-to-date and ready for use in projects.

---

For further questions or issues, open an issue on the repository: [https://github.com/flying-dice/tslua-dcs](https://github.com/flying-dice/tslua-dcs).

