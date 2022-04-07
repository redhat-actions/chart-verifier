import * as ghCore from "@actions/core";
import { promises as fs } from "fs";
import * as path from "path";
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

    const reportFileName = "report.yaml";
    const reportInfoFileName = "report-info.json";

    const reportFilePath = path.join(process.cwd(), "chartverifier", reportFileName);
    const reportInfoFilePath = path.join(process.cwd(), "chartverifier", reportInfoFileName);

    const verifyExtraArgs = [];
    if (profileArgs.length > 0) {
        verifyExtraArgs.push(...profileArgs);
    }
    const verifyArgs = ghCore.getInput(Inputs.VERIFY_ARGS);
    if (verifyArgs !== "") {
        const trimVerifyArgs = verifyArgs.trim().split(/\s+/);
        verifyExtraArgs.push(...trimVerifyArgs);
    }

    // Run verify
    await verify(chartUri, verifyExtraArgs, kubeconfig);

    ghCore.setOutput(Outputs.REPORT_FILE, reportFilePath);
    ghCore.info(`✍️ Setting output "${Outputs.REPORT_FILE}" to "${reportFilePath}"`);

    // Run report
    await report(reportType, reportFilePath);

    ghCore.setOutput(Outputs.REPORT_INFO_FILE, reportInfoFilePath);
    ghCore.info(`✍️ Setting output "${Outputs.REPORT_INFO_FILE}" to "${reportInfoFilePath}"`);

    const reportInfo = await fs.readFile(reportInfoFilePath, "utf-8");
    const resultJsonData = JSON.parse(reportInfo);
    const passed = resultJsonData.results.passed;
    const failed = resultJsonData.results.failed;

    const green = "\u001b[32m";
    const red = "\u001b[31m";
    const reset = "\u001b[0m";

    ghCore.setOutput(Outputs.PASSED, passed);
    if (passed === "0") {
        ghCore.info(`❌ ${red}${passed} checks passed${reset}`);
    }
    else if (passed === "1") {
        ghCore.info(`✅ ${green}${passed} check passed${reset}`);
    }
    else {
        ghCore.info(`✅ ${green}${passed} checks passed${reset}`);
    }

    ghCore.setOutput(Outputs.FAILED, failed);
    let exitStatus = 1;
    if (failed === "0") {
        ghCore.info(`✅ ${green}${failed} checks failed${reset}`);
        exitStatus = 0;
    }
    else if (failed === "1") {
        // Print with colon for messages follow-up below
        ghCore.info(`❌ ${red}${failed} check failed:${reset}`);
    }
    else {
        // Print with colon for messages follow-up below
        ghCore.info(`❌ ${red}${failed} checks failed:${reset}`);
    }

    if (exitStatus === 1) {
        const messageFile = "messages.txt";
        await fs.writeFile(messageFile, JSON.stringify(resultJsonData.results.message), "utf-8");
        const messages = resultJsonData.results.message.toString().split(",");
        messages.forEach((message: string) => {
            ghCore.info(`  - ${message}`);
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
