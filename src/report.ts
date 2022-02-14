import ChartVerifier from "./chartVerifier";
import { ExecResult } from "./types";

export async function report(reportType: string, reportFileName: string): Promise<ExecResult> {

    // failonStdErr should be removed once issue
    // https://github.com/redhat-certification/chart-verifier/issues/208 is fixed.
    const execResult = await ChartVerifier.exec(
        ChartVerifier.getChartVerifierExecutable(),
        [ ChartVerifier.Commands.Report, reportType, reportFileName ],
        { group: true, failOnStdErr: false }
    );
    return execResult;
}
