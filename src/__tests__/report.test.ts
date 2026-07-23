import { describe, it, expect, vi, beforeEach } from "vitest";
import ChartVerifier from "../chartVerifier";
import { report } from "../report";

vi.mock("@actions/exec");
vi.mock("@actions/core");

vi.mock("../chartVerifier", async (importOriginal) => {
    const original = await importOriginal<typeof import("../chartVerifier")>();
    return {
        default: {
            ...original.default,
            exec: vi.fn().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" }),
            getOptions: original.default.getOptions,
            Commands: original.default.Commands,
        },
    };
});

describe("report", () => {
    const execMock = vi.mocked(ChartVerifier.exec);

    beforeEach(() => {
        execMock.mockClear();
    });

    it("passes report command, type, and file path in correct order", async () => {
        await report("results", "/path/to/report.yaml");

        const args = execMock.mock.calls[0][1];
        expect(args[0]).toBe(ChartVerifier.Commands.Report);
        expect(args[1]).toBe("results");
        expect(args[2]).toBe("/path/to/report.yaml");
    });

    it("includes --output=json and --write-to-file flags", async () => {
        await report("results", "/path/to/report.yaml");

        const args = execMock.mock.calls[0][1];
        expect(args).toContain("--output=json");
        expect(args).toContain("--write-to-file");
    });

    it("runs with group option", async () => {
        await report("results", "/path/to/report.yaml");

        const options = execMock.mock.calls[0][2];
        expect(options).toEqual({ group: true });
    });
});
