import ChartVerifier from "./chartVerifier";
import { ExecResult } from "./types";

export async function verify(chartUri: string, verifyArgs: string[], kubeconfig: string): Promise<ExecResult> {
    const verifyOptions = ChartVerifier.getOptions({ kubeconfig, "write-to-file": "" });

    const execResult = ChartVerifier.exec(
        ChartVerifier.getChartVerifierExecutable(),
        [ ChartVerifier.Commands.Verify, ...verifyOptions, ...verifyArgs, chartUri ],
        { group: true }
    );
    return execResult;
}
