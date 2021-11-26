import ChartVerifier from "./chartVerifier";
import { ExecResult } from "./types";

export async function verify(chartUri: string, verifyArgs: string[], kubeconfig: string): Promise<ExecResult> {
    const verifyOptions = ChartVerifier.getOptions({ kubeconfig });

    // failonStdErr should be removed once issue
    // https://github.com/redhat-certification/chart-verifier/issues/208 is fixed.
    const execResult = ChartVerifier.exec(
        ChartVerifier.getChartVerifierExecutable(),
        [ ChartVerifier.Commands.Verify, ...verifyOptions, ...verifyArgs, chartUri ],
        { group: true, failOnStdErr: false }
    );
    return execResult;
}
