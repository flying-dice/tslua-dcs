/** @noSelfInFile */

import type { ExportIndicator, ExportObject, l_Export } from "../../../src";
import { copy, type DoubleContext } from "../context";
import type { OwnshipFixture } from "../fixtures";
import { geoToLocal, heightAt, localToGeo } from "../geography";

/**
 * `Export` double. Global functions read `ctx.state()`. Ownship, sensor and cockpit functions
 * return `undefined` until a test sets `state.ownship` (see `ownshipFixture()`), as DCS does
 * without a player aircraft; permission checks follow `state.exportPermissions`.
 */
export function createExport(ctx: DoubleContext): l_Export {
	const s = () => ctx.state();
	/** Reads one ownship field (a copy), or `undefined` without an ownship or permission. */
	const own =
		<K extends keyof OwnshipFixture>(
			key: K,
			permission: "ownship" | "sensors" = "ownship",
		) =>
		(): OwnshipFixture[K] | undefined => {
			const ownship = s().ownship;
			if (ownship === undefined || !s().exportPermissions[permission])
				return undefined;
			return copy(ownship[key]);
		};
	const objectById = (objectId: number): ExportObject | undefined => {
		for (const [, objects] of pairs(s().worldObjects)) {
			const found = (objects as Record<number, ExportObject>)[objectId];
			if (found !== undefined) return copy(found);
		}
		return undefined;
	};

	return {
		// Time and simulation state
		LoGetModelTime: () => s().modelTime,
		LoGetMissionStartTime: () => s().missionStartTime,
		LoSimulationOnPause: () => s().paused,
		LoSimulationOnActivePause: () => s().paused && s().viewPaused,
		LoGetVersionInfo: () => ({
			ProductName: "DCS",
			FileVersion: [2, 9, 29, 27468],
			ProductVersion: [2, 9, 29, 27468],
		}),

		// Permissions
		LoIsObjectExportAllowed: () => s().exportPermissions.objects,
		LoIsSensorExportAllowed: () => s().exportPermissions.sensors,
		LoIsOwnshipExportAllowed: () => s().exportPermissions.ownship,

		// World and coordinates
		LoGetWorldObjects: (category = "units") =>
			s().exportPermissions.objects ? copy(s().worldObjects[category]) : {},
		LoGetObjectById: (objectId) =>
			s().exportPermissions.objects ? objectById(objectId) : undefined,
		LoGetAltitude: (x, z) => heightAt(x, z),
		LoGetHeightWithObjects: (x, z) => heightAt(x, z),
		LoGeoCoordinatesToLoCoordinates: (longitude, latitude) => {
			const [x, z] = geoToLocal(latitude, longitude);
			return { x, y: heightAt(x, z), z };
		},
		LoLoCoordinatesToGeoCoordinates: (x, z) => {
			const [latitude, longitude] = localToGeo(x, z);
			return { latitude, longitude };
		},
		LoGetWindAtPoint: (x, y, z, isRadioAltitude = false) => {
			const wind = s().wind;
			const ground = heightAt(x, z);
			// Wind grows with height above ground in the double's atmosphere.
			const above = isRadioAltitude ? y : y - ground;
			const factor = 1 + math.max(above, 0) / 1000;
			return $multi(wind.x * factor, wind.y * factor, wind.z * factor, ground);
		},
		LoGetNameByType: (level1, level2, level3, level4) =>
			s().typeNames[`${level1}.${level2}.${level3}.${level4}`],

		// Camera
		LoGetCameraPosition: () => copy(s().camera),
		LoSetCameraPosition: (position) => {
			s().camera = copy(position);
		},
		LoCreateCameraRequest: () => ({
			name: "CameraFree",
			id: 0,
			pos: copy(s().camera),
			fov: s().fov.current,
			valid_pos: true,
		}),
		LoForceCamera: (request) => {
			if (request.valid_pos) s().camera = copy(request.pos);
			if (request.fov !== -1) s().fov.current = request.fov;
		},
		LoSendForceCamera: (hostId, request) => {
			ctx.native("Export.LoSendForceCamera", [hostId, request]);
		},
		LoSetAllowRemoteForceCameraRequests: (allowed) => {
			s().remoteForceCameraAllowed = allowed;
		},
		LoGetUserBookmarks: () => copy(s().bookmarks),
		LoCreateUserBookmarkRequest: (name) => {
			for (const bookmark of s().bookmarks)
				if (bookmark.name === name)
					return {
						name: "CameraFree",
						id: 0,
						pos: copy(bookmark.pos),
						fov: bookmark.fov,
						valid_pos: true,
					};
			return undefined;
		},

		// Players
		LoGetLocalPlayer: () => copy(s().exportPlayers[0]),
		LoGetPlayers: () => copy(s().exportPlayers),

		// Commands
		LoSetCommand: (command, value) => {
			s().commands.push({ command, value });
		},
		LoGetAircraftDrawArgumentValue: (argument) =>
			s().drawArguments[argument] ?? 0,

		// Ownship
		LoGetSelfData: own("self"),
		LoGetPlayerPlaneId: own("unitId"),
		LoGetPlayerUnitId: own("unitId"),
		LoGetPilotName: own("pilotName"),
		LoGetAltitudeAboveSeaLevel: own("altitudeAboveSeaLevel"),
		LoGetAltitudeAboveGroundLevel: own("altitudeAboveGroundLevel"),
		LoGetRadarAltimeter: own("radarAltimeter"),
		LoGetIndicatedAirSpeed: own("indicatedAirSpeed"),
		LoGetTrueAirSpeed: own("trueAirSpeed"),
		LoGetMachNumber: own("machNumber"),
		LoGetVerticalVelocity: own("verticalVelocity"),
		LoGetAngleOfAttack: own("angleOfAttack"),
		LoGetAngleOfSideSlip: own("angleOfSideSlip"),
		LoGetSlipBallPosition: own("slipBallPosition"),
		LoGetMagneticYaw: own("magneticYaw"),
		LoGetGlideDeviation: own("glideDeviation"),
		LoGetSideDeviation: own("sideDeviation"),
		LoGetShakeAmplitude: own("shakeAmplitude"),
		LoGetBasicAtmospherePressure: own("basicAtmospherePressure"),
		LoGetADIPitchBankYaw: () => {
			const ownship = s().exportPermissions.ownship ? s().ownship : undefined;
			if (ownship === undefined) return $multi(undefined, undefined, undefined);
			const [pitch, bank, yaw] = ownship.pitchBankYaw;
			return $multi(pitch, bank, yaw);
		},
		LoGetAccelerationUnits: own("accelerationUnits"),
		LoGetAngularVelocity: own("angularVelocity"),
		LoGetVectorVelocity: own("vectorVelocity"),
		LoGetVectorWindVelocity: own("vectorWindVelocity"),
		LoGetInAir: () =>
			(s().ownship?.inAir ?? false) && s().exportPermissions.ownship,
		LoGetEngineInfo: own("engine"),
		LoGetMechInfo: own("mech"),
		LoGetNavigationInfo: own("navigation"),
		LoGetControlPanel_HSI: own("hsi"),
		LoGetRoute: own("route"),
		LoGetPayloadInfo: own("payload"),
		LoGetSnares: own("snares"),
		LoGetRadioBeaconsStatus: own("radioBeacons"),
		LoGetMCPState: own("mcpState"),
		LoGetFMData: own("fmData"),
		LoGetHelicopterFMData: own("helicopterFmData"),
		LoGetWingInfo: own("wingmen"),
		LoGetWingTargets: own("wingTargets", "sensors"),

		// Sensors
		LoGetTargetInformation: own("targets", "sensors"),
		LoGetLockedTargetInformation: own("lockedTargets", "sensors"),
		LoGetTWSInfo: own("tws", "sensors"),
		LoGetF15_TWS_Contacts: own("f15TwsContacts", "sensors"),
		LoGetSightingSystemInfo: own("sightingSystem", "sensors"),

		// Cockpit
		GetDevice: (deviceId) => {
			const device = s().ownship?.devices[deviceId];
			return device === undefined ? undefined : copy(device);
		},
		GetClickableElements: own("clickable"),
		GetIndicator: (indicatorId) => {
			const ownship = s().ownship;
			if (
				ownship === undefined ||
				ownship.indicatorIds.indexOf(indicatorId) < 0
			)
				return undefined;
			const indicator: ExportIndicator = {
				id: indicatorId,
				// A method of the indicator object: the declaration has no @noSelf, so it is
				// called with ':' and receives the indicator first.
				assign_dedicated_viewport(x, y, width, height) {
					ctx.native("ExportIndicator.assign_dedicated_viewport", [
						this,
						x,
						y,
						width,
						height,
					]);
				},
			};
			return indicator;
		},
	};
}
