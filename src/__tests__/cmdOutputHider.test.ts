import { describe, it, expect, vi } from "vitest";
import { Writable } from "stream";
import CmdOutputHider from "../cmdOutputHider";

function createMockStream(): Writable {
    return new Writable({
        write(_chunk, _encoding, callback): void {
            callback();
        },
    });
}

describe("CmdOutputHider", () => {
    it("passes through the first chunk containing a newline", () => {
        const outStream = createMockStream();
        const writeSpy = vi.spyOn(outStream, "write");
        const hider = new CmdOutputHider(outStream, "");

        hider.write(Buffer.from("command line\n"));

        expect(writeSpy).toHaveBeenCalledTimes(2);
        expect(writeSpy.mock.calls[0][0].toString()).toBe("command line\n");
        expect(writeSpy.mock.calls[1][0]).toBe("*** Suppressing command output\n");
    });

    it("passes through chunks until a newline is seen", () => {
        const outStream = createMockStream();
        const writeSpy = vi.spyOn(outStream, "write");
        const hider = new CmdOutputHider(outStream, "");

        hider.write(Buffer.from("no newline yet"));
        expect(writeSpy).toHaveBeenCalledTimes(1);

        hider.write(Buffer.from(" still going\n"));
        expect(writeSpy).toHaveBeenCalledTimes(3);
    });

    it("suppresses output after the first newline", () => {
        const outStream = createMockStream();
        const writeSpy = vi.spyOn(outStream, "write");
        const hider = new CmdOutputHider(outStream, "");

        hider.write(Buffer.from("cmd\n"));
        writeSpy.mockClear();

        hider.write(Buffer.from("hidden output"));
        hider.write(Buffer.from("more hidden"));

        expect(writeSpy).not.toHaveBeenCalled();
    });

    it("captures suppressed output in getContents", () => {
        const hider = new CmdOutputHider(createMockStream(), "");

        hider.write(Buffer.from("cmd\n"));
        hider.write(Buffer.from("captured1"));
        hider.write(Buffer.from("captured2"));

        expect(hider.getContents()).toBe("captured1captured2");
    });

    it("preserves initial outContents value", () => {
        const hider = new CmdOutputHider(createMockStream(), "initial");

        hider.write(Buffer.from("cmd\n"));
        hider.write(Buffer.from(" appended"));

        expect(hider.getContents()).toBe("initial appended");
    });
});
