/**
 * A small JSON codec for the `net.lua2json` / `net.json2lua` doubles. Objects are encoded with sorted
 * keys so output is deterministic; tables with keys 1..n (n > 0) are arrays; `null` decodes to `nil`.
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
		return (
			escapes[character] ?? string.format("\\u%04x", string.byte(character))
		);
	});
	return `"${escaped}"`;
}

function isArray(table: LuaTable<AnyNotNil, unknown>): boolean {
	let count = 0;
	for (const [key] of pairs(table)) {
		if (type(key) !== "number") return false;
		count += 1;
	}
	return count > 0 && count === (table as unknown as unknown[]).length;
}

export function encode(
	value: unknown,
	seen: LuaTable<object, boolean> = new LuaTable(),
): string {
	const kind = type(value);
	if (kind === "nil") return "null";
	if (kind === "boolean") return value ? "true" : "false";
	if (kind === "number") {
		const number = value as number;
		// biome-ignore lint/suspicious/noSelfCompare: NaN is the only value not equal to itself in Lua.
		if (number !== number || number === math.huge || number === -math.huge)
			error("net.lua2json: cannot encode NaN or infinity");
		if (math.floor(number) === number && math.abs(number) < 1e15)
			return string.format("%d", number);
		return string.format("%.14g", number);
	}
	if (kind === "string") return encodeString(value as string);
	if (kind !== "table") error(`net.lua2json: cannot encode a ${kind}`);
	const table = value as LuaTable<AnyNotNil, unknown>;
	if (seen.has(table)) error("net.lua2json: cannot encode a cyclic table");
	seen.set(table, true);
	let result: string;
	if (isArray(table)) {
		result = `[${(table as unknown as unknown[]).map((item) => encode(item, seen)).join(",")}]`;
	} else {
		const keys: string[] = [];
		for (const [key] of pairs(table)) keys.push(tostring(key));
		keys.sort();
		const parts: string[] = [];
		for (const key of keys) {
			const numeric = tonumber(key);
			const item =
				table.get(key) ??
				(numeric === undefined ? undefined : table.get(numeric));
			parts.push(`${encodeString(key)}:${encode(item, seen)}`);
		}
		result = `{${parts.join(",")}}`;
	}
	seen.delete(table);
	return result;
}

class Decoder {
	private position = 1;

	constructor(private readonly text: string) {}

	decode(): unknown {
		const value = this.value();
		this.skipWhitespace();
		if (this.position <= this.text.length) this.fail("trailing characters");
		return value;
	}

	private fail(reason: string): never {
		error(`net.json2lua: ${reason} at byte ${this.position}`, 0);
		throw reason;
	}

	private peek(): string {
		return string.sub(this.text, this.position, this.position);
	}

	private skipWhitespace(): void {
		const [, finish] = string.find(this.text, "^[ \t\r\n]*", this.position);
		this.position = (finish ?? this.position - 1) + 1;
	}

	private literal(word: string, value: unknown): unknown {
		if (
			string.sub(this.text, this.position, this.position + word.length - 1) !==
			word
		)
			this.fail("invalid literal");
		this.position += word.length;
		return value;
	}

	private value(): unknown {
		this.skipWhitespace();
		const character = this.peek();
		if (character === "{") return this.object();
		if (character === "[") return this.array();
		if (character === '"') return this.string();
		if (character === "t") return this.literal("true", true);
		if (character === "f") return this.literal("false", false);
		if (character === "n") return this.literal("null", undefined);
		return this.number();
	}

	private number(): number {
		const [start, finish] = string.find(
			this.text,
			"^-?%d+%.?%d*[eE]?[-+]?%d*",
			this.position,
		);
		if (start === undefined) this.fail("unexpected character");
		const number = tonumber(
			string.sub(this.text, start as number, finish as number),
		);
		if (number === undefined) this.fail("invalid number");
		this.position = (finish as number) + 1;
		return number as number;
	}

	private string(): string {
		this.position += 1;
		const parts: string[] = [];
		while (true) {
			const character = this.peek();
			if (character === "") this.fail("unterminated string");
			if (character === '"') {
				this.position += 1;
				return parts.join("");
			}
			if (character === "\\") {
				const escaped = string.sub(
					this.text,
					this.position + 1,
					this.position + 1,
				);
				const simple: Record<string, string> = {
					'"': '"',
					"\\": "\\",
					"/": "/",
					b: "\b",
					f: "\f",
					n: "\n",
					r: "\r",
					t: "\t",
				};
				if (simple[escaped] !== undefined) {
					parts.push(simple[escaped]);
					this.position += 2;
				} else if (escaped === "u") {
					const code = tonumber(
						string.sub(this.text, this.position + 2, this.position + 5),
						16,
					);
					if (code === undefined) this.fail("invalid unicode escape");
					parts.push(code < 128 ? string.char(code) : "?");
					this.position += 6;
				} else this.fail("invalid escape");
			} else {
				parts.push(character);
				this.position += 1;
			}
		}
	}

	private array(): unknown[] {
		this.position += 1;
		const result: unknown[] = [];
		this.skipWhitespace();
		if (this.peek() === "]") {
			this.position += 1;
			return result;
		}
		let index = 0;
		while (true) {
			index += 1;
			(result as unknown as LuaTable<number, unknown>).set(index, this.value());
			this.skipWhitespace();
			const character = this.peek();
			this.position += 1;
			if (character === "]") return result;
			if (character !== ",") this.fail("expected ',' or ']'");
		}
	}

	private object(): Record<string, unknown> {
		this.position += 1;
		const result: Record<string, unknown> = {};
		this.skipWhitespace();
		if (this.peek() === "}") {
			this.position += 1;
			return result;
		}
		while (true) {
			this.skipWhitespace();
			if (this.peek() !== '"') this.fail("expected a string key");
			const key = this.string();
			this.skipWhitespace();
			if (this.peek() !== ":") this.fail("expected ':'");
			this.position += 1;
			result[key] = this.value();
			this.skipWhitespace();
			const character = this.peek();
			this.position += 1;
			if (character === "}") return result;
			if (character !== ",") this.fail("expected ',' or '}'");
		}
	}
}

export function decode(text: string): unknown {
	return new Decoder(text).decode();
}
