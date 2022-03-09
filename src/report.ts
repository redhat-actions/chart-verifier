import ChartVerifier from "./chartVerifier";
import { ExecResult } from "./types";

export async function report(reportType: string, reportFilePath: string): Promise<ExecResult> {

    const reportOptions = ChartVerifier.getOptions({ output: "json", "write-to-file": "" });
    const execResult = await ChartVerifier.exec(
        ChartVerifier.getChartVerifierExecutable(),
        [ ChartVerifier.Commands.Report, reportType, reportFilePath, ...reportOptions ],
        { group: true }
    );
    return execResult;
}
