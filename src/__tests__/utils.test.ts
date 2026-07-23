import { describe, it, expect, vi, beforeEach } from "vitest";
import * as ghCore from "@actions/core";

vi.mock("@actions/core");

describe("getOS", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    async function getOSFresh(platform: string): Promise<string> {
        vi.stubGlobal("process", { ...process, platform });
        const { getOS } = await import("../util/utils");
        return getOS();
    }

    it("returns 'linux' for linux platform", async () => {
        expect(await getOSFresh("linux")).toBe("linux");
    });

    it("returns 'macos' for darwin platform", async () => {
        expect(await getOSFresh("darwin")).toBe("macos");
    });

    it("returns 'windows' for win32 platform", async () => {
        expect(await getOSFresh("win32")).toBe("windows");
    });

    it("returns 'linux' and warns for unknown platform", async () => {
        const result = await getOSFresh("freebsd");
        expect(result).toBe("linux");
        expect(ghCore.warning).toHaveBeenCalledWith('Unrecognized OS "freebsd"');
    });
});
