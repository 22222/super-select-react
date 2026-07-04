/**
 * An error thrown when an option source request fails.
 */
export class OptionSourceError extends Error implements OptionSourceErrorLike {
    /**
     * A message that can be shown to end users.
     */
    public readonly userMessage?: string;

    /**
     * The type of error that occurred.
     */
    public readonly code?: OptionSourceErrorCode;

    /**
     * An HTTP status code associated with the error.
     */
    public readonly httpStatus?: number;

    /**
     * Constructs an option source error.
     */
    public constructor(message: string, init?: Omit<OptionSourceErrorLike, "message">) {
        super(message, { cause: init?.cause });

        this.name = "OptionSourceError";
        this.userMessage = init?.userMessage;
        this.code = init?.code;
        this.httpStatus = init?.httpStatus;
        this.cause = init?.cause;
    }
}

/**
 * The properties describing an option source error.
 */
export interface OptionSourceErrorLike {
    /**
     * The internal message that describes the error.
     * This should not be shown to end users, but can be used for debugging or logging purposes.
     */
    message?: string;

    /**
     * A message that describes the error in a way that can be shown to an end-user.
     */
    userMessage?: string;

    /**
     * Indicates the type of error that occurred, if applicable.
     */
    code?: OptionSourceErrorCode;

    /**
     * An HTTP status code associated with the error, if applicable.
     */
    httpStatus?: number;

    /**
     * The original error or value that caused this error to be thrown, if available.
     */
    cause?: unknown;
}

/**
 * A code that indicates the type of error that occurred when fetching options from an OptionSource.
 */
export type OptionSourceErrorCode = "network" | "timeout" | "unauthorized" | "forbidden" | "not-found" | "rate-limited" | "server";

/**
 * Returns true if the given value has the properties of an OptionSourceErrorLike object, false otherwise.
 */
export function isOptionSourceErrorLike(error: unknown): error is OptionSourceErrorLike {
    if (error instanceof OptionSourceError) {
        return true;
    }

    if (!error || typeof error !== "object") {
        return false;
    }

    if ("message" in error && typeof error.message !== "string" && typeof error.message !== "undefined") {
        return false;
    }

    if ("userMessage" in error && typeof error.userMessage !== "string" && typeof error.userMessage !== "undefined") {
        return false;
    }

    if ("code" in error && typeof error.code !== "string" && typeof error.code !== "undefined") {
        return false;
    }

    if ("httpStatus" in error && typeof error.httpStatus !== "number" && typeof error.httpStatus !== "undefined") {
        return false;
    }

    return true;
}

const defaultMessage: string = "An error occurred fetching options";

/**
 * Converts an error-like value into an OptionSourceError or other supported error type (like an AbortError).
 * This may just return the original error if it is already an OptionSourceError or similar error.
 */
export function convertToOptionSourceError(error?: unknown): OptionSourceErrorLike & Error {
    if (error instanceof OptionSourceError) {
        return error;
    }
    if (!error) {
        return new OptionSourceError(defaultMessage);
    }
    if (typeof error === "string") {
        return new OptionSourceError(error);
    }
    if (typeof error !== "object") {
        return new OptionSourceError(defaultMessage);
    }
    if ("name" in error && error.name === "AbortError") {
        // Don't convert an AbortError
        return error as Error;
    }

    let message: string;
    if ("message" in error && typeof error.message === "string") {
        message = error.message ?? defaultMessage;
    } else {
        message = defaultMessage;
    }

    let errorInit: OptionSourceErrorLike;
    if (isOptionSourceErrorLike(error)) {
        errorInit = error;
    } else {
        errorInit = {};
        if ("userMessage" in error && typeof error.userMessage === "string") {
            errorInit.userMessage = error.userMessage;
        }
        if ("code" in error && typeof error.code === "string") {
            errorInit.code = error.code as OptionSourceErrorCode;
        }
        if ("httpStatus" in error && typeof error.httpStatus === "number") {
            errorInit.httpStatus = error.httpStatus;
        }
        if ("cause" in error) {
            errorInit.cause = error.cause;
        }
    }

    // If we have an httpStatus but no code, attempt to derive a code from the httpStatus.
    if (errorInit.httpStatus && !errorInit.code) {
        let code: OptionSourceErrorCode | undefined;
        if (errorInit.httpStatus === 401) {
            code = "unauthorized";
        } else if (errorInit.httpStatus === 403) {
            code = "forbidden";
        } else if (errorInit.httpStatus === 404) {
            code = "not-found";
        } else if (errorInit.httpStatus === 408) {
            code = "timeout";
        } else if (errorInit.httpStatus === 429) {
            code = "rate-limited";
        } else if (errorInit.httpStatus >= 500 && errorInit.httpStatus <= 599) {
            code = "server";
        }
        if (code) {
            errorInit = { ...errorInit, code };
        }
    }

    // If the original error value is an Error object, we can set it as our cause.
    if (error instanceof Error && (!errorInit.cause || error.cause === errorInit.cause)) {
        errorInit = { ...errorInit, cause: error };
    }

    return new OptionSourceError(message, errorInit);
}
