import * as ghCore from "@actions/core";
import { promises as fs } from "fs";
import * as utils from "./util/utils";
import ChartVerifier from "./chartVerifier";
import { Inputs, Outputs } from "./generated/inputs-outputs";
import { verify } from "./verify";
import { report } from "./report";

async function run(): Promise<void> {
    ghCore.debug(`Runner OS is ${utils.getOS()}`);
    ghCore.debug(`Node version is ${process.version}`);

    await ChartVerifier.exec(ChartVerifier.getChartVerifierExecutable(), [ ChartVerifier.Commands.Version ]);

    // Echo the usage of both commands, so users know what the inputs mean.
    const helpOption = ChartVerifier.getOptions({ help: "" });
    await ChartVerifier.exec(
        ChartVerifier.getChartVerifierExecutable(),
        [ ChartVerifier.Commands.Verify, ...helpOption ],
        { group: true }
    );

    await ChartVerifier.exec(
        ChartVerifier.getChartVerifierExecutable(),
        [ ChartVerifier.Commands.Report, ...helpOption ],
        { group: true }
    );

    const kubeconfig = process.env.KUBECONFIG;
    if (!kubeconfig) {
        throw new Error(`❌ KUBECONFIG must be set in the environment.`
        + `Please set KUBECONFIG to the path to your Kubernetes config file.`);
    }

    const chartUri = ghCore.getInput(Inputs.CHART_URI, { required: true });
    ghCore.info(`Chart URI to certify is "${chartUri}"`);

    const reportType = ghCore.getInput(Inputs.REPORT_TYPE) || "default";
    ghCore.info(`Report type is "${reportType}"`);

    const profileName = ghCore.getInput(Inputs.PROFILE_NAME);
    const profileArgs = [];
    if (profileName) {
        ghCore.info(`Using profile.vendortype "${profileName}"`);
        profileArgs.push("--set");
        profileArgs.push(`profile.vendortype=${profileName}`);
    }

    const profileVersion = ghCore.getInput(Inputs.PROFILE_VERSION);
    if (profileVersion) {
        ghCore.info(`Using profile.version "${profileVersion}"`);
        profileArgs.push("--set");
        profileArgs.push(`profile.version=${profileVersion}`);
    }

    const reportFileName = "chart-verifier-report.yaml";
    const resultsFileName = "results.json";

    const verifyExtraArgs = [];
    if (profileArgs.length > 0) {
        verifyExtraArgs.push(...profileArgs);
    }
    const verifyArgs = ghCore.getInput(Inputs.VERIFY_ARGS).split(" ");

    verifyExtraArgs.push(...verifyArgs);

    // Run verify
    const verifyExecResult = await verify(chartUri, verifyExtraArgs, kubeconfig);

    await fs.writeFile(reportFileName, verifyExecResult.stdout, "utf-8");

    const reportExecResult = await report(reportType, reportFileName);

    await fs.writeFile(resultsFileName, reportExecResult.stdout, "utf-8");

    const resultJsonData = JSON.parse(reportExecResult.stdout);
    const passed = resultJsonData.results.passed;
    const failed = resultJsonData.results.failed;

    ghCore.setOutput(Outputs.REPORT_FILENAME, reportFileName);
    ghCore.setOutput(Outputs.RESULTS_FILENAME, resultsFileName);
    ghCore.setOutput(Outputs.PASSED, passed);
    ghCore.setOutput(Outputs.FAILED, failed);

    if (passed === "0") {
        ghCore.info(`❌ ${passed} checks passed`);
    }
    else if (passed === "1") {
        ghCore.info(`✅ ${passed} check passed`);
    }
    else {
        ghCore.info(`✅ ${passed} checks passed`);
    }

    let exitStatus = 1;
    if (failed === "0") {
        ghCore.info(`✅ ${failed} checks failed`);
        exitStatus = 0;
    }
    else if (failed === "1") {
        // Print with colon for messages follow-up below
        ghCore.info(`❌ ${failed} check failed:`);
    }
    else {
        // Print with colon for messages follow-up below
        ghCore.info(`❌ ${failed} checks failed:`);
    }

    if (exitStatus === 1) {
        const messageFile = "messages.txt";
        await fs.writeFile(messageFile, JSON.stringify(resultJsonData.results.message), "utf-8");
        const messages = resultJsonData.results.message.toString().split(",");
        messages.forEach((message: string) => {
            ghCore.info(`- ${message}`);
        });

        const fail = ghCore.getInput(Inputs.FAIL) || "true";

        if (fail === "true") {
            throw new Error(`❌ Exiting with error code due to failed checks.`);
        }
        else {
            ghCore.info(`Input "${Inputs.FAIL}" is "${fail}", not exiting with an error code.`);
        }
    }
}

run()
    .then(() => {
        ghCore.info("Success.");
    })
    .catch((err) => {
        ghCore.setFailed(err.message);
    });
