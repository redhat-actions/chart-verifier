import { describe, it, expect, vi, beforeEach } from "vitest";
import ChartVerifier from "../chartVerifier";
import { verify } from "../verify";

vi.mock("@actions/exec");
vi.mock("@actions/core");

vi.mock("../chartVerifier", async (importOriginal) => {
    const original = await importOriginal<typeof import("../chartVerifier")>();
    return {
        default: {
            ...original.default,
            exec: vi.fn().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" }),
            getChartVerifierExecutable: original.default.getChartVerifierExecutable,
            getOptions: original.default.getOptions,
            Commands: original.default.Commands,
        },
    };
});

describe("verify", () => {
    const execMock = vi.mocked(ChartVerifier.exec);

    beforeEach(() => {
        execMock.mockClear();
    });

    it("passes chart URI as the last argument", async () => {
        await verify("https://example.com/chart.tgz", []);

        const args = execMock.mock.calls[0][1];
        expect(args[0]).toBe(ChartVerifier.Commands.Verify);
        expect(args[args.length - 1]).toBe("https://example.com/chart.tgz");
    });

    it("includes --write-to-file flag", async () => {
        await verify("chart.tgz", []);

        const args = execMock.mock.calls[0][1];
        expect(args).toContain("--write-to-file");
    });

    it("includes --kubeconfig when provided", async () => {
        await verify("chart.tgz", [], "/path/to/kubeconfig");

        const args = execMock.mock.calls[0][1];
        expect(args).toContain("--kubeconfig=/path/to/kubeconfig");
    });

    it("omits --kubeconfig when not provided", async () => {
        await verify("chart.tgz", []);

        const args = execMock.mock.calls[0][1];
        const kubeconfigArgs = args.filter((a: string) => a.includes("kubeconfig"));
        expect(kubeconfigArgs).toHaveLength(0);
    });

    it("passes extra verify args before chart URI", async () => {
        await verify("chart.tgz", ["--set", "key=value"]);

        const args = execMock.mock.calls[0][1];
        const setIndex = args.indexOf("--set");
        const chartIndex = args.indexOf("chart.tgz");
        expect(setIndex).toBeGreaterThan(-1);
        expect(setIndex).toBeLessThan(chartIndex);
    });

    it("runs with group option", async () => {
        await verify("chart.tgz", []);

        const options = execMock.mock.calls[0][2];
        expect(options).toEqual({ group: true });
    });
});
