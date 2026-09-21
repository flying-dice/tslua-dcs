import type {
	l_Group,
	l_StaticObject,
	l_Unit,
} from "@flying-dice/tslua-dcs-mission-types";

let createdGroup: l_Group | undefined;

export function groupFixture(): l_Group {
	const previousFixture = Group.getByName("TsluaDcsExampleGroup");
	if (previousFixture?.isExist()) {
		createdGroup = previousFixture;
		return previousFixture;
	}
	for (const side of [coalition.side.BLUE, coalition.side.RED]) {
		for (const group of coalition.getGroups(side)) {
			if (group.getUnit(1)) return group;
		}
	}
	if (!createdGroup) {
		const base = Airbase.getByName("Batumi");
		if (!base) throw new Error("Batumi is required to create the test fixture");
		const point = base.getPoint();
		createdGroup = coalition.addGroup(2, Group.Category.GROUND, {
			name: "TsluaDcsExampleGroup",
			task: "Ground Nothing",
			visible: false,
			units: [
				{
					name: "TsluaDcsExampleUnit",
					type: "M-818",
					x: point.x + 500,
					y: point.z + 500,
					heading: 0,
					skill: "Excellent",
				},
			],
			x: point.x + 500,
			y: point.z + 500,
		});
	}
	return createdGroup;
}

export function unitFixture(): l_Unit {
	const unit = groupFixture().getUnit(1);
	if (!unit) throw new Error("The test group has no first unit");
	return unit;
}

export function staticFixture(): l_StaticObject | undefined {
	for (const side of [coalition.side.BLUE, coalition.side.RED]) {
		const objects = coalition.getStaticObjects(side);
		if (objects[0]) return objects[0];
	}
	return undefined;
}

export function cleanupFixtures(): void {
	if (createdGroup?.isExist()) createdGroup.destroy();
	createdGroup = undefined;
}
