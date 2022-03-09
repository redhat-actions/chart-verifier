import * as ghExec from "@actions/exec";
import * as ghCore from "@actions/core";
import * as path from "path";
import stripAnsi from "strip-ansi";
import * as utils from "./util/utils";
import { ExecResult } from "./types";
import CmdOutputHider from "./cmdOutputHider";

namespace ChartVerifier {

    let chartVerifierExecutable: string | undefined;
    export function getChartVerifierExecutable(): string {
        if (chartVerifierExecutable) {
            return chartVerifierExecutable;
        }

        const chartVerifier = utils.getOS() === "windows" ? "chart-verifier.exe" : "chart-verifier";
        chartVerifierExecutable = chartVerifier;
        return chartVerifier;
    }

    /**
     * chart-verifier commands
     */
    export enum Commands {
        Verify = "verify",
        Report = "report",
        Version = "version",
    }

    /**
     * chart-verifier sub-commands
     */
    export enum SubCommands {

    }

    /**
     * chart-verifier flags. Create an Options object with these, and then pass it to getOptions.
     */
    export enum Flags {
        Help = "help",
        Kubeconfig = "kubeconfig",
        WriteToFile = "write-to-file",
        Output = "output",
    }

    export type Options = { [key in Flags]?: string };

    /**
     * This formats an Options object into a string[] which is suitable to be passed to `exec`.
     *
     * Flags are prefixed with `--`, and suffixed with `=${value}`, unless the value is the empty string.
     *
     * For example, `{ flatten: "", minify: "true" }` is formatted into `[ "--flatten", "--minify=true" ]`.
     */
    export function getOptions(options: Options): string[] {
        return Object.entries<string | undefined>(options).reduce((argsBuilder: string[], entry) => {
            const [ key, value ] = entry;

            if (value == null) {
                return argsBuilder;
            }

            let arg = "--" + key;
            if (value !== "") {
                arg += `=${value}`;
            }
            argsBuilder.push(arg);

            return argsBuilder;
        }, []);
    }

    /**
     * Run 'chart-verifier' with the given arguments.
     *
     * @throws If the exitCode is not 0, unless execOptions.ignoreReturnCode is set.
     *
     * @param args Arguments and options to 'chart-verifier'.
     * Use getOptions to convert an options mapping into a string[].
     * @param execOptions Options for how to run the exec. See note about hideOutput on windows.
     * @returns Exit code and the contents of stdout/stderr.
     */
    export async function exec(
        executable: string,
        args: string[],
        execOptions: ghExec.ExecOptions & { group?: boolean, hideOutput?: boolean } = {}
    ): Promise<ExecResult> {
        // ghCore.info(`${executable} ${args.join(" ")}`);
        // ghCore.debug(`options ${JSON.stringify(execOptions)}`);

        let stdout = "";
        let stderr = "";

        const finalExecOptions = { ...execOptions };
        if (execOptions.hideOutput) {
            // There is some bug here, only on Windows, where if the wrapped stream is NOT used,
            // the output is not correctly captured into the execResult.
            // so, if you have to use the contents of stdout, do not set hideOutput.
            const wrappedOutStream = execOptions.outStream || process.stdout;
            finalExecOptions.outStream = new CmdOutputHider(wrappedOutStream, stdout);
        }
        finalExecOptions.ignoreReturnCode = true;     // the return code is processed below

        finalExecOptions.listeners = {
            stdout: (chunk): void => {
                stdout += chunk.toString();
            },
            stderr: (chunk): void => {
                stderr += chunk.toString();
            },
        };

        if (execOptions.group) {
            const groupName = [ executable, ...args ].join(" ");
            ghCore.startGroup(groupName);
        }

        try {
            const exitCode = await ghExec.exec(executable, args, finalExecOptions);
            ghCore.debug(`Exit code ${exitCode}`);

            let failCondition;
            if (executable === ChartVerifier.getChartVerifierExecutable()) {
                // crda exit 2 indicates a vulnerability was found, so that's an expected error
                failCondition = exitCode !== 0 && exitCode !== 2;
            }
            else {
                failCondition = exitCode !== 0;
            }

            if (failCondition && !execOptions.ignoreReturnCode) {
                // Throwing the stderr as part of the Error makes the stderr show up in the action outline,
                // which saves some clicking when debugging.
                let error = `${path.basename(executable)} exited with code ${exitCode}`;
                if (stderr) {
                    error += `\n${stripAnsi(stderr)}`;
                }
                throw new Error(error);
            }

            if (finalExecOptions.outStream instanceof CmdOutputHider) {
                stdout = finalExecOptions.outStream.getContents();
            }

            return {
                exitCode, stdout, stderr,
            };
        }
        finally {
            if (execOptions.group) {
                ghCore.endGroup();
            }
        }
    }
}

export default ChartVerifier;
