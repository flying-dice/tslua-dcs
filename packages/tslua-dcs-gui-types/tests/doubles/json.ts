/** @noSelfInFile */

/**
 * A small JSON codec standing in for DCS's native `net.lua2json` / `net.json2lua`.
 *
 * Encoding: `nil` is `null`, a table whose keys are exactly 1..n is an array, an empty table is `[]`
 * (as DCS encodes it), any other table is an object with its keys sorted (so output is
 * deterministic), and functions/userdata/threads raise an error. Decoding accepts standard JSON;
 * `null` becomes `nil`.
 */

const escapes: Record<string, string> = {
	'"': '\\"',
	"\\": "\\\\",
	"\b": "\\b",
	"\f": "\\f",
	"\n": "\\n",
	"\r": "\\r",
	"\t": "\\t",
};

function encodeString(value: string): string {
	const [escaped] = string.gsub(value, '[%c"\\]', (character: string) => {
		const known = escapes[character];
		return known ?? string.format("\\u%04x", string.byte(character));
	});
	return `"${escaped}"`;
}

function isArray(value: LuaTable): boolean {
	let count = 0;
	for (const [key] of pairs(value)) {
		if (type(key) !== "number") return false;
		count++;
	}
	for (let index = 1; index <= count; index++)
		if (value.get(index) === undefined) return false;
	return true;
}

function encodeValue(value: unknown, seen: LuaTable): string {
	const kind = type(value);
	if (value === undefined) return "null";
	if (kind === "boolean") return value ? "true" : "false";
	if (kind === "number") {
		const number = value as number;
		if (Number.isNaN(number) || math.abs(number) === math.huge)
			error("lua2json: cannot encode a non-finite number", 3);
		if (number === math.floor(number) && math.abs(number) < 1e15)
			return string.format("%d", number);
		return string.format("%.14g", number);
	}
	if (kind === "string") return encodeString(value as string);
	if (kind !== "table") error(`lua2json: cannot encode a ${kind}`, 3);
	const table = value as LuaTable;
	if (seen.get(table)) error("lua2json: cannot encode a cyclic table", 3);
	seen.set(table, true);
	const parts: string[] = [];
	let result: string;
	if (isArray(table)) {
		for (let index = 1; index <= table.length(); index++)
			parts.push(encodeValue(table.get(index), seen));
		result = `[${parts.join(",")}]`;
	} else {
		const entries: Array<[string, unknown]> = [];
		for (const [key, item] of pairs(table)) entries.push([tostring(key), item]);
		entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
		for (const [key, item] of entries)
			parts.push(`${encodeString(key)}:${encodeValue(item, seen)}`);
		result = `{${parts.join(",")}}`;
	}
	seen.set(table, undefined);
	return result;
}

export function encode(value: unknown): string {
	return encodeValue(value, new LuaTable());
}

class Decoder {
	private position = 1;

	constructor(private readonly text: string) {}

	fail(message: string): never {
		return error(`json2lua: ${message} at byte ${this.position}`, 0);
	}

	skip(): void {
		const [, finish] = string.find(this.text, "^[ \n\r\t]*", this.position);
		this.position = (finish ?? this.position - 1) + 1;
	}

	peek(): string {
		return string.sub(this.text, this.position, this.position);
	}

	literal(word: string, value: unknown): unknown {
		if (
			string.sub(this.text, this.position, this.position + word.length - 1) !==
			word
		)
			this.fail(`expected ${word}`);
		this.position += word.length;
		return value;
	}

	string(): string {
		this.position++; // opening quote
		let result = "";
		while (true) {
			const character = this.peek();
			if (character === "") this.fail("unterminated string");
			this.position++;
			if (character === '"') return result;
			if (character === "\\") {
				const code = this.peek();
				this.position++;
				if (code === "u") {
					const hex = string.sub(this.text, this.position, this.position + 3);
					const number = tonumber(hex, 16);
					if (number === undefined || hex.length !== 4)
						this.fail("bad unicode escape");
					this.position += 4;
					result += utf8Encode(number as number);
				} else {
					const map: Record<string, string> = {
						'"': '"',
						"\\": "\\",
						"/": "/",
						b: "\b",
						f: "\f",
						n: "\n",
						r: "\r",
						t: "\t",
					};
					const decoded = map[code];
					if (decoded === undefined) this.fail("bad escape");
					result += decoded;
				}
			} else result += character;
		}
	}

	number(): number {
		const [start, finish] = string.find(
			this.text,
			"^-?%d+%.?%d*[eE]?[-+]?%d*",
			this.position,
		);
		if (start === undefined || finish === undefined)
			return this.fail("bad number");
		const value = tonumber(string.sub(this.text, start, finish));
		if (value === undefined) this.fail("bad number");
		this.position = finish + 1;
		return value as number;
	}

	value(): unknown {
		this.skip();
		const character = this.peek();
		if (character === "{") return this.object();
		if (character === "[") return this.array();
		if (character === '"') return this.string();
		if (character === "t") return this.literal("true", true);
		if (character === "f") return this.literal("false", false);
		if (character === "n") return this.literal("null", undefined);
		if (character === "-" || string.find(character, "^%d")[0] !== undefined)
			return this.number();
		return this.fail("unexpected character");
	}

	array(): unknown[] {
		this.position++;
		const result = new LuaTable<number, unknown>();
		let index = 0;
		this.skip();
		if (this.peek() === "]") {
			this.position++;
			return result as unknown as unknown[];
		}
		while (true) {
			index++;
			result.set(index, this.value());
			this.skip();
			const separator = this.peek();
			this.position++;
			if (separator === "]") return result as unknown as unknown[];
			if (separator !== ",") this.fail("expected ',' or ']'");
		}
	}

	object(): Record<string, unknown> {
		this.position++;
		const result: Record<string, unknown> = {};
		this.skip();
		if (this.peek() === "}") {
			this.position++;
			return result;
		}
		while (true) {
			this.skip();
			if (this.peek() !== '"') this.fail("expected a key");
			const key = this.string();
			this.skip();
			if (this.peek() !== ":") this.fail("expected ':'");
			this.position++;
			result[key] = this.value();
			this.skip();
			const separator = this.peek();
			this.position++;
			if (separator === "}") return result;
			if (separator !== ",") this.fail("expected ',' or '}'");
		}
	}

	document(): unknown {
		const value = this.value();
		this.skip();
		if (this.position <= this.text.length) this.fail("trailing characters");
		return value;
	}
}

function utf8Encode(code: number): string {
	if (code < 0x80) return string.char(code);
	if (code < 0x800)
		return string.char(0xc0 + math.floor(code / 0x40), 0x80 + (code % 0x40));
	return string.char(
		0xe0 + math.floor(code / 0x1000),
		0x80 + (math.floor(code / 0x40) % 0x40),
		0x80 + (code % 0x40),
	);
}

export function decode(text: string): unknown {
	return new Decoder(text).document();
}
