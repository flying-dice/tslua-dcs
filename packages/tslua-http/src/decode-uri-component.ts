export function decodeUriComponent(encodedString: string) {
	const [decodedString] = string.gsub(encodedString, "+", " ");
	const [fullyDecodedString] = string.gsub(decodedString, "%%(%x%x)", (h) => {
		const charNum = tonumber(h, 16);
		if (!charNum) throw new Error(`Invalid hex code for ${h}`);
		return string.char(charNum);
	});
	return fullyDecodedString;
}
