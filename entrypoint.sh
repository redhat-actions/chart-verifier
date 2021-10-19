#!/usr/bin/env sh

echo "KUBECONFIG is '$KUBECONFIG'"
if [ -z "$KUBECONFIG" ]; then
	echo "Fatal: KUBECONFIG is not set in the environment. Please set KUBECONFIG to the path to your Kubernetes config file."
	exit 1
fi

chart_uri=$1
echo "Chart URI to certify is '$chart_uri'"

if [ -z "$chart_uri" ]; then
	echo "Fatal: Chart URI must be provided as the first argument to this script."
	exit 1
fi

report_type=$2
echo "Report type is '$report_type'"

shift; shift

set -e

echo "::group::Printing usage"
chart-verifier verify --help
echo "::endgroup::"

# echo "::group::Running 'verify'"
set -x
chart-verifier verify --kubeconfig $KUBECONFIG $* $chart_uri 2>&1 | tee chart-verifier-report.yaml
# echo "::endgroup::"
# echo "::group::Running 'report'"
chart-verifier report $report_type chart-verifier-report.yaml | tee results.json
set +x
# echo "::endgroup::"

passed=$(cat results.json | jq -r '.results.passed')
failed=$(cat results.json | jq -r '.results.failed')

echo "\u001b[32m$passed\u001b[0m checks passed"
echo "\u001b[31m$failed\u001b[0m checks failed"

at_least_one_failed=$(echo $failed ">" "0" | bc -l)

exit $at_least_one_failed
