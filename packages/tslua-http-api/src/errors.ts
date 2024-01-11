import { HttpStatus } from "@flying-dice/tslua-http";

export class HttpError extends Error {
    constructor(
        public readonly status: HttpStatus,
        public readonly message: string,
    ) {
        super(message);
    }
}
