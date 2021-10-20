#!/usr/bin/env sh

echo "KUBECONFIG is '$KUBECONFIG'"
if [ -z "$KUBECONFIG" ]; then
	echo "Fatal: KUBECONFIG is not set in the environment. Please set KUBECONFIG to the path to your Kubernetes config file."
	exit 1
fi

echo "Chart URI to certify is '$CHART_URI'"

if [ -z "$CHART_URI" ]; then
	echo "Fatal: Chart URI must be provided as the first argument to this script."
	exit 1
fi

echo "Report type is '$REPORT_TYPE'"

set -e

echo "::group::Print usage"
chart-verifier verify --help
echo "::endgroup::"

REPORT_FILENAME=chart-verifier-report.yaml
RESULTS_FILENAME=results.json

verify_cmd="chart-verifier verify --kubeconfig $KUBECONFIG $* $CHART_URI"
echo "Running: $verify_cmd"
$verify_cmd 2>&1 | tee $REPORT_FILENAME

# echo "::group::Print full report"
# cat $REPORT_FILENAME
# echo "::endgroup::"

report_cmd="chart-verifier report $REPORT_TYPE $REPORT_FILENAME"
echo "Running: $report_cmd"
$report_cmd 2>&1 | tee $RESULTS_FILENAME

# echo "::group::Print full results"
# cat $RESULTS_FILENAME
# echo "::endgroup::"

passed=$(jq -r '.results.passed' $RESULTS_FILENAME)
failed=$(jq -r '.results.failed' $RESULTS_FILENAME)

if [ -z "$passed" ] || [ -z "$failed" ]; then
	echo "Fatal: failed to parse JSON from $RESULTS_FILENAME"
	exit 1
fi

green="\u001b[32m"
red="\u001b[31m"
reset="\u001b[0m"
if [ "$passed" == "0" ]; then
	echo -e "${red}${passed} checks passed${reset}"
elif [ "$passed" == "1" ]; then
	echo -e "${green}${passed} check passed${reset}"
else
	echo -e "${green}${passed} checks passed${reset}"
fi

exit_status=1
if [ "$failed" == "0" ]; then
	echo -e "${green}${failed} checks failed${reset}"
	exit_status=0
elif [ "$failed" == "1" ]; then
	echo -ne "${red}${failed} check failed${reset}:"
else
	echo -e "${red}${failed} checks failed${reset}:"
fi

if [ "$exit_status" == "1" ]; then
	MESSAGES_FILE=messages.txt
	jq -r '.results.message[]' $RESULTS_FILENAME > $MESSAGES_FILE

	while read line; do
		echo "  - $line"
	done < $MESSAGES_FILE

	echo

	echo "Exiting with error code due to failed checks"
fi

# echo "exit $exit_status"
exit $exit_status
