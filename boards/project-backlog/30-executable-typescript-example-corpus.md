---
column: done
labels:
  - docs
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Build an authoritative executable TypeScript example corpus

## Objective

Maintain ordinary checked-in TypeScript examples as the source of truth for the
TSDoc snippets. Compile the corpus with TypeScript-to-Lua, execute it against
deterministic DCS-shaped fixtures, and assert each example's expected result or
observable call.

The test must not scrape or extract TSDoc. Each TSDoc example remains readable
in place and links back to its corresponding authoritative corpus source.

## Acceptance criteria

- [x] Every public generated function has a handwritten signature or explicit documented TODO.
- [x] Every public generated function is referenced by its authoritative TypeScript corpus.
- [x] Both corpora compile with TypeScript-to-Lua as one Lua 5.1 bundle per environment.
- [x] Safe examples execute assertions; destructive/stateful functions are verified for export presence.
- [x] Mission and GUI bundles run through the repository `test:dcs` command.
- [x] Both type packages build, the strict coverage audit passes, and `git diff --check` passes.

## Mission corpus

- [x] `Airbase.ts`
- [x] `Controller.ts`
- [x] `Group.ts`
- [x] `Object.ts`
- [x] `StaticObject.ts`
- [x] `Unit.ts`
- [x] `Warehouse.ts`
- [x] `Weapon.ts`
- [x] `atmosphere.ts`
- [x] `coalition.ts`
- [x] `coord.ts`
- [x] `env.ts`
- [x] `land.ts`
- [x] `missionCommands.ts`
- [x] `timer.ts`
- [x] `trigger.ts`
- [x] `world.ts`

## GUI corpus

- [x] `DCS.ts`
- [x] `Export.ts`
- [x] `db.ts`
- [x] `lfs.ts`
- [x] `net.ts`
- [x] `terrain.ts`

## Notes

- The initial focused tests covered only corrected/high-risk signatures. They
  are being migrated into this corpus and do not count as full coverage.
- Generated `.test-examples` bundles remain ignored; the TypeScript corpus and
  Lua fixtures are committed.
- The corpus now lives in the separate `tslua-dcs-mission-types_test` and
  `tslua-dcs-gui-types_test` workspaces. Each workspace imports its authoritative
  type package and `tslua-luatest`, compiles one Lua bundle, and submits that
  bundle in one bridge `eval` request.
- Initial bridge runs exposed and corrected five type-surface issues:
  `l_terrain` had lost its name, `lfs`/`terrain` were missing from the GUI public
  exports, `l_timer` lacked `@noSelf`, `coalition.getRefPoints` can return nil,
  and dynamically added units can return string IDs from `Unit.getID`.
- Mission fixture `TsluaDcsExampleGroup` is destroyed after the bundle; a live
  post-run check confirmed `isExist() == false`.

## Full exported-surface baseline

AST inventory of callable members in the generated `src/exports` interfaces:

- Mission: 379 generated callables; 314 public functions are typed and corpus-
  referenced, while 65 inheritance/database implementation helpers are excluded.
- GUI: all 331 generated callables are typed and corpus-referenced.
- `npm run audit:dcs-types -- --strict` enforces both signature and corpus coverage.
- Each corpus compiles into one bundle and executes through one bridge request.

Generated implementation helpers such as `parentClass_`, `database_`, and
`tonumber` must be recorded as internal exclusions rather than mistaken for
mission/mod-maker APIs. Every other generated callable remains in scope until it
has a typed signature/TODO and a corresponding corpus case.
