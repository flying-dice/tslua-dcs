import { decodeUriComponent } from "../src";

// Standard encoding
assert(
	decodeUriComponent("Hello%20World") === "Hello World",
	"Spaces should be decoded correctly",
);
assert(
	decodeUriComponent("%23one") === "#one",
	"Hash symbols should be decoded correctly",
);

// Edge cases and special characters
assert(
	decodeUriComponent("%40email") === "@email",
	"At symbol should be decoded correctly",
);
assert(
	decodeUriComponent("%24price") === "$price",
	"Dollar symbol should be decoded correctly",
);
assert(
	decodeUriComponent("%26symbol") === "&symbol",
	"Ampersand should be decoded correctly",
);
assert(
	decodeUriComponent("%2Bplus") === "+plus",
	"Plus symbol should be decoded correctly",
);
assert(
	decodeUriComponent("%2Fslash") === "/slash",
	"Slash should be decoded correctly",
);
assert(
	decodeUriComponent("%3Acolon") === ":colon",
	"Colon should be decoded correctly",
);
assert(
	decodeUriComponent("%3Bsemicolon") === ";semicolon",
	"Semicolon should be decoded correctly",
);
assert(
	decodeUriComponent("%3Dequals") === "=equals",
	"Equals symbol should be decoded correctly",
);
assert(
	decodeUriComponent("%3Fquestion") === "?question",
	"Question mark should be decoded correctly",
);
assert(
	decodeUriComponent("%40at") === "@at",
	"At symbol should be decoded correctly",
);

// Encoding with multiple characters
assert(
	decodeUriComponent("Multi%20Word%20Test") === "Multi Word Test",
	"Multiple encoded spaces should be decoded correctly",
);

// Encoding with mixed characters
assert(
	decodeUriComponent("Mixed%23%40%2524Symbols") === "Mixed#@%24Symbols",
	"Mixed special characters should be decoded correctly",
);

// Empty string
assert(
	decodeUriComponent("") === "",
	"Empty string should return empty string",
);

// Numbers
assert(
	decodeUriComponent("123%20456") === "123 456",
	"Encoded spaces in a numeric string should be decoded correctly",
);

// Non-encoded string
assert(
	decodeUriComponent("NoEncoding") === "NoEncoding",
	"String without encoding should remain unchanged",
);

// Invalid encoding
try {
	decodeUriComponent("%ZZ");
	assert(false, "Invalid encoding should throw an error");
} catch (e) {
	assert(true, "Invalid encoding should throw an error");
}
