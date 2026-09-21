import type { l_Export } from "@flying-dice/tslua-dcs-gui-types";
import { describe, expect, test } from "@flying-dice/tslua-luatest";

const checkedExport: l_Export = Export;

describe("Export examples", () => {
	test("coordinate conversions return documented shapes", () => {
		const local = checkedExport.LoGeoCoordinatesToLoCoordinates(
			41.5997,
			41.6103,
		);
		expect(type(local.x)).toBe("number");
		expect(type(local.y)).toBe("number");
		expect(type(local.z)).toBe("number");
		const geographic = checkedExport.LoLoCoordinatesToGeoCoordinates(
			local.x,
			local.z,
		);
		expect(type(geographic.latitude)).toBe("number");
		expect(type(geographic.longitude)).toBe("number");
	});

	test("LoGetWindAtPoint returns four numbers", () => {
		const [windX, windY, windZ, terrainHeight] = checkedExport.LoGetWindAtPoint(
			0,
			1000,
			0,
			false,
		);
		expect(type(windX)).toBe("number");
		expect(type(windY)).toBe("number");
		expect(type(windZ)).toBe("number");
		expect(type(terrainHeight)).toBe("number");
	});

	test("safe global getters return documented values", () => {
		expect(type(checkedExport.LoGetModelTime())).toBe("number");
		expect(type(checkedExport.LoGetMissionStartTime())).toBe("number");
		expect(type(checkedExport.LoGetAltitude(0, 0))).toBe("number");
		expect(type(checkedExport.LoGetWorldObjects())).toBe("table");
		expect(type(checkedExport.LoIsObjectExportAllowed())).toBe("boolean");
		expect(type(checkedExport.LoIsSensorExportAllowed())).toBe("boolean");
		expect(type(checkedExport.LoIsOwnshipExportAllowed())).toBe("boolean");
	});

	test("ownship values may be absent without a player aircraft", () => {
		const ownship = checkedExport.LoGetSelfData();
		expect(ownship === undefined || type(ownship) === "table").toBe(true);
		const payload = checkedExport.LoGetPayloadInfo();
		expect(payload === undefined || type(payload) === "table").toBe(true);
	});

	test("aircraft-dependent and state-changing exports are present", () => {
		for (const value of [
			checkedExport.GetClickableElements,
			checkedExport.GetDevice,
			checkedExport.GetIndicator,
			checkedExport.LoCreateCameraRequest,
			checkedExport.LoCreateUserBookmarkRequest,
			checkedExport.LoForceCamera,
			checkedExport.LoGetADIPitchBankYaw,
			checkedExport.LoGetAccelerationUnits,
			checkedExport.LoGetAircraftDrawArgumentValue,
			checkedExport.LoGetAltitudeAboveGroundLevel,
			checkedExport.LoGetAltitudeAboveSeaLevel,
			checkedExport.LoGetAngleOfAttack,
			checkedExport.LoGetAngleOfSideSlip,
			checkedExport.LoGetAngularVelocity,
			checkedExport.LoGetBasicAtmospherePressure,
			checkedExport.LoGetCameraPosition,
			checkedExport.LoGetControlPanel_HSI,
			checkedExport.LoGetEngineInfo,
			checkedExport.LoGetF15_TWS_Contacts,
			checkedExport.LoGetFMData,
			checkedExport.LoGetGlideDeviation,
			checkedExport.LoGetHeightWithObjects,
			checkedExport.LoGetHelicopterFMData,
			checkedExport.LoGetInAir,
			checkedExport.LoGetIndicatedAirSpeed,
			checkedExport.LoGetLocalPlayer,
			checkedExport.LoGetLockedTargetInformation,
			checkedExport.LoGetMCPState,
			checkedExport.LoGetMachNumber,
			checkedExport.LoGetMagneticYaw,
			checkedExport.LoGetMechInfo,
			checkedExport.LoGetNameByType,
			checkedExport.LoGetNavigationInfo,
			checkedExport.LoGetObjectById,
			checkedExport.LoGetPilotName,
			checkedExport.LoGetPlayerPlaneId,
			checkedExport.LoGetPlayerUnitId,
			checkedExport.LoGetPlayers,
			checkedExport.LoGetRadarAltimeter,
			checkedExport.LoGetRadioBeaconsStatus,
			checkedExport.LoGetRoute,
			checkedExport.LoGetShakeAmplitude,
			checkedExport.LoGetSideDeviation,
			checkedExport.LoGetSightingSystemInfo,
			checkedExport.LoGetSlipBallPosition,
			checkedExport.LoGetSnares,
			checkedExport.LoGetTWSInfo,
			checkedExport.LoGetTargetInformation,
			checkedExport.LoGetTrueAirSpeed,
			checkedExport.LoGetUserBookmarks,
			checkedExport.LoGetVectorVelocity,
			checkedExport.LoGetVectorWindVelocity,
			checkedExport.LoGetVersionInfo,
			checkedExport.LoGetVerticalVelocity,
			checkedExport.LoGetWingInfo,
			checkedExport.LoGetWingTargets,
			checkedExport.LoSendForceCamera,
			checkedExport.LoSetAllowRemoteForceCameraRequests,
			checkedExport.LoSetCameraPosition,
			checkedExport.LoSetCommand,
			checkedExport.LoSimulationOnActivePause,
			checkedExport.LoSimulationOnPause,
		])
			expect(type(value)).toBe("function");
	});
});
