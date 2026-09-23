/**
 * Entry point of the DCS mission-environment doubles, bundled to `dist/dcs-mission-doubles.lua` and
 * installed with `lua51 --preload dist/dcs-mission-doubles.lua <script>`. It defines the globals the
 * mission scripting environment provides (see README.md) plus `dcsDoubles`, the control API.
 */
import type {
	l_AI,
	l_radio,
	l_Unit,
} from "@flying-dice/tslua-dcs-mission-types";
import { coalition, world, dispatchEvent } from "./world";
import { findMenuItem, missionCommands, net } from "./comms";
import {
	ai,
	modulation,
	objectCategory,
	weaponCategory,
	worldEvent,
} from "./constants";
import type { DcsDoubles } from "./control";
import { advanceTime, env, resetTimers, timer } from "./environment";
import { fixtureNames } from "./fixtures";
import { atmosphere, coord, land } from "./geo";
import {
	Airbase,
	Controller,
	DcsObject,
	Group,
	StaticObject,
	Unit,
	Warehouse,
	Weapon,
	weaponInstance,
} from "./objects";
import {
	callCount,
	type Double,
	idOf,
	resetCallCounts,
	setGlobal,
	strictNamespace,
	surfacePaths,
} from "./runtime";
import { addObject, resetState, state } from "./state";
import { effects, resetEffects, trigger } from "./trigger";

const AI = { ...ai } satisfies Double<l_AI>;
const radio = { modulation: { ...modulation } } satisfies Double<l_radio>;

const namespaces: Record<string, object> = {
	AI,
	atmosphere,
	coalition,
	coord,
	env,
	land,
	missionCommands,
	net,
	radio,
	timer,
	trigger,
	world,
};

for (const name of Object.keys(namespaces)) {
	strictNamespace(name, namespaces[name]);
	setGlobal(name, namespaces[name]);
}

setGlobal("Object", DcsObject);
setGlobal("Unit", Unit);
setGlobal("Group", Group);
setGlobal("StaticObject", StaticObject);
setGlobal("Airbase", Airbase);
setGlobal("Weapon", Weapon);
setGlobal("Controller", Controller);
setGlobal("Warehouse", Warehouse);
setGlobal("_APP_VERSION", fixtureNames.appVersion);
setGlobal("_ARCHITECTURE", "x86_64");

function reset(): void {
	resetState();
	resetTimers();
	resetEffects();
}

const control: DcsDoubles = {
	reset: () => reset(),
	advanceTime: (seconds) => advanceTime(seconds),
	setPaused: (paused) => {
		state.paused = paused;
	},
	dispatchEvent: (event) => dispatchEvent(event),
	selectMenuCommand: (path, scope) => {
		const item = findMenuItem(path, scope);
		if (!item || item.kind !== "command" || !item.callback)
			error(
				`dcsDoubles.selectMenuCommand: no F10 command at ${path.join(" > ")}`,
				2,
			);
		item.callback(item.argument);
	},
	menu: () =>
		state.menus.map((item) => ({
			path: [...item.path],
			scope: item.scope,
			kind: item.kind,
		})),
	launchWeapon: ({ typeName, launcher, target }) => {
		const shooter = state.objects.get(idOf(launcher));
		if (shooter === undefined || !shooter.exists)
			error("dcsDoubles.launchWeapon: the launcher does not exist", 2);
		const from = shooter as NonNullable<typeof shooter>;
		const record = addObject({
			kind: "weapon",
			name: `${typeName}#${state.nextId + 1}`,
			typeName,
			coalition: from.coalition,
			country: from.country,
			point: { ...from.point },
			velocity: { x: 600, y: 0, z: 0 },
			heading: from.heading,
			inAir: true,
			category: objectCategory.WEAPON,
			categoryEx: weaponCategory.MISSILE,
		});
		record.launcherId = from.id;
		record.targetId = target === undefined ? undefined : idOf(target);
		const weapon = weaponInstance(record);
		dispatchEvent({
			id: worldEvent.S_EVENT_SHOT,
			time: state.time,
			initiator: launcher,
			weapon,
		});
		return weapon;
	},
	setLife: (unit: l_Unit, life: number) => {
		const record = state.objects.get(idOf(unit));
		if (record !== undefined) record.life = life;
	},
	log: () => [...state.log],
	messages: () => [...state.messages],
	marks: () => [...state.marks],
	effects: () => [...effects],
	chat: () => [...state.chat],
	setPersistenceData: (name, value) => {
		state.persistenceData[name] = value;
	},
	setLogEcho: (enabled) => {
		state.echoLog = enabled;
	},
	surface: () => surfacePaths(),
	calls: (path) => callCount(path),
	resetCalls: () => resetCallCounts(),
};

setGlobal("dcsDoubles", control);
reset();
