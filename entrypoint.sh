#!/usr/bin/env sh

echo "KUBECONFIG is '$KUBECONFIG'"
if [ -z "$KUBECONFIG" ]; then
	echo "Fatal: KUBECONFIG is not set in the environment. Please set KUBECONFIG to the path to your Kubernetes config file."
	exit 1
fi

chart_uri="$1"
echo "Chart URI to certify is '$chart_uri'"

if [ -z "$chart_uri" ]; then
	echo "Fatal: Chart URI must be provided as the first argument to this script."
	exit 1
fi


shift
extra_args="$@"

set -ex

chart-verifier verify --help

chart-verifier verify --kubeconfig $KUBECONFIG $extra_args $chart_uri 2>&1 | tee chart-verifier-report.yaml

chart-verifier report chart-verifier-report.yaml | tee final-report.json | jq
