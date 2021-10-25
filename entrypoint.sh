#!/usr/bin/env sh

set -e

# Echo the usage of both commands, so users know what the inputs mean.
echo "::group::Print 'chart-verifier verify --help'"
chart-verifier verify --help
echo "::endgroup::"

echo "::group::Print 'chart-verifier report --help'"
chart-verifier report --help
echo "::endgroup::"

echo "KUBECONFIG is '$KUBECONFIG'"
if [ -z "$KUBECONFIG" ]; then
    echo "Fatal: \$KUBECONFIG must be set in the environment. Please set KUBECONFIG to the path to your Kubernetes config file."
    exit 1
fi

echo "Chart URI to certify is '$CHART_URI'"

if [ -z "$CHART_URI" ]; then
    echo "Fatal: \$CHART_URI must be set in the environment. Please set CHART_URI to point to the chart to certify."
    exit 1
fi

echo "Report type is '$REPORT_TYPE'"

profile_args=""
if [ -n "$PROFILE_NAME" ]; then
    echo "Using profile.vendortype '$PROFILE_NAME'"
    profile_args="--set profile.vendortype='$PROFILE_NAME'"
fi

if [ -n "$PROFILE_VERSION" ]; then
    echo "Using profile.version '$PROFILE_VERSION'"
    profile_args="$profile_args --set profile.version='$PROFILE_VERSION'"
fi

report_filename=chart-verifier-report.yaml
results_filename=results.json

verify_extra_args=""
if [ -n "$profile_args" ]; then
    verify_extra_args="$profile_args "
fi
verify_extra_args="$verify_extra_args$@"

### Run 'verify'

# https://github.com/redhat-certification/chart-verifier/issues/208

verify_cmd="chart-verifier verify --kubeconfig $KUBECONFIG $verify_extra_args $CHART_URI"
echo "::group::$verify_cmd"
$verify_cmd 2>&1 | tee $report_filename
echo "::endgroup::"

report_cmd="chart-verifier report $REPORT_TYPE $report_filename"
echo "::group::$report_cmd"
$report_cmd 2>&1 | tee $results_filename
echo "::endgroup::"

### Parse the report JSON to detect passes and fails

passed=$(jq -r '.results.passed' $results_filename)
failed=$(jq -r '.results.failed' $results_filename)

if [ -z "$passed" ] || [ -z "$failed" ]; then
    echo "Fatal: failed to parse JSON from $results_filename"
    exit 1
fi

echo "::set-output name=report_filename::$report_filename"
echo "::set-output name=results_filename::$results_filename"
echo "::set-output name=passed::$passed"
echo "::set-output name=failed::$passed"

green="\u001b[32m"
red="\u001b[31m"
reset="\u001b[0m"
if [ "$passed" == "0" ]; then
    echo -e "❌ ${red}${passed} checks passed${reset}"
elif [ "$passed" == "1" ]; then
    echo -e "✅ ${green}${passed} check passed${reset}"
else
    echo -e "✅ ${green}${passed} checks passed${reset}"
fi

exit_status=1
if [ "$failed" == "0" ]; then
    echo -e "✅ ${green}${failed} checks failed${reset}"
    exit_status=0
elif [ "$failed" == "1" ]; then
    # Echo with colon for messages follow-up below
    echo -e "❌ ${red}${failed} check failed${reset}:"
else
    # Echo with colon for messages follow-up below
    echo -e "❌ ${red}${failed} checks failed${reset}:"
fi

if [ "$exit_status" == "1" ]; then
    messages_file=messages.txt
    jq -r '.results.message[]' $results_filename > $messages_file

    while read line; do
        echo "  - $line"
    done < $messages_file

    echo

    if [ "$FAIL" != "false" ] && [ "$FAIL" != "no" ]; then
        echo "❌ Exiting with error code due to failed checks"
    else
        echo "'fail' input is '$FAIL', not exiting with an error code"
        exit_status=0
    fi
fi

# echo "exit $exit_status"
exit $exit_status
