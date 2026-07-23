import { describe, it, expect, vi, beforeEach } from "vitest";
import * as ghExec from "@actions/exec";
import * as ghCore from "@actions/core";
import ChartVerifier from "../chartVerifier";

vi.mock("@actions/exec");
vi.mock("@actions/core");

describe("getOptions", () => {
    it("returns empty array for empty options", () => {
        expect(ChartVerifier.getOptions({})).toEqual([]);
    });

    it("formats a flag with empty value as bare --flag", () => {
        expect(ChartVerifier.getOptions({ help: "" })).toEqual(["--help"]);
    });

    it("formats a flag with value as --flag=value", () => {
        expect(ChartVerifier.getOptions({ kubeconfig: "/path" })).toEqual([
            "--kubeconfig=/path",
        ]);
    });

    it("skips null and undefined values", () => {
        expect(ChartVerifier.getOptions({ help: "", kubeconfig: undefined })).toEqual(["--help"]);
    });

    it("handles multiple flags", () => {
        const result = ChartVerifier.getOptions({ "write-to-file": "", output: "json" });
        expect(result).toContain("--write-to-file");
        expect(result).toContain("--output=json");
        expect(result).toHaveLength(2);
    });
});

describe("exec", () => {
    beforeEach(() => {
        vi.mocked(ghExec.exec).mockResolvedValue(0);
    });

    it("returns exit code, stdout, and stderr on success", async () => {
        vi.mocked(ghExec.exec).mockImplementation((_cmd, _args, options) => {
            options?.listeners?.stdout?.(Buffer.from("output"));
            options?.listeners?.stderr?.(Buffer.from("err"));
            return Promise.resolve(0);
        });

        const result = await ChartVerifier.exec("some-tool", ["arg1"]);
        expect(result).toEqual({ exitCode: 0, stdout: "output", stderr: "err" });
    });

    it("throws on non-zero exit code for non-chart-verifier executable", async () => {
        vi.mocked(ghExec.exec).mockResolvedValue(1);
        await expect(ChartVerifier.exec("other-tool", [])).rejects.toThrow("other-tool exited with code 1");
    });

    it("includes stderr in error message", async () => {
        vi.mocked(ghExec.exec).mockImplementation((_cmd, _args, options) => {
            options?.listeners?.stderr?.(Buffer.from("something went wrong"));
            return Promise.resolve(1);
        });

        await expect(ChartVerifier.exec("other-tool", [])).rejects.toThrow("something went wrong");
    });

    it("allows exit code 2 for chart-verifier executable", async () => {
        vi.mocked(ghExec.exec).mockResolvedValue(2);
        const result = await ChartVerifier.exec(ChartVerifier.getChartVerifierExecutable(), []);
        expect(result.exitCode).toBe(2);
    });

    it("throws on exit code 1 for chart-verifier executable", async () => {
        vi.mocked(ghExec.exec).mockResolvedValue(1);
        await expect(
            ChartVerifier.exec(ChartVerifier.getChartVerifierExecutable(), [])
        ).rejects.toThrow("chart-verifier exited with code 1");
    });

    it("does not throw when ignoreReturnCode is set", async () => {
        vi.mocked(ghExec.exec).mockResolvedValue(1);
        const result = await ChartVerifier.exec("other-tool", [], { ignoreReturnCode: true });
        expect(result.exitCode).toBe(1);
    });

    it("calls startGroup and endGroup when group option is set", async () => {
        await ChartVerifier.exec("tool", ["arg"], { group: true });
        expect(ghCore.startGroup).toHaveBeenCalledWith("tool arg");
        expect(ghCore.endGroup).toHaveBeenCalled();
    });

    it("calls endGroup even when exec throws", async () => {
        vi.mocked(ghExec.exec).mockResolvedValue(1);
        await expect(ChartVerifier.exec("tool", [], { group: true })).rejects.toThrow();
        expect(ghCore.endGroup).toHaveBeenCalled();
    });
});
