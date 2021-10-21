# chart-verifier

**chart-verifier** is a GitHub Action for verifying a Helm chart passes the Red Hat Helm chart certification checks.

## Prerequisites

1. Be logged into a Kubernetes cluster, with the `KUBECONFIG` environment variable set.
2. Have a Helm chart to verify.

## Inputs
- `chart_uri`: URI to Helm chart to verify. This can be a path to the chart directory (containing `Chart.yaml`), or an http(s) URI. **Required**.

- `report_type`: The argument to pass to `report`. One of: `all`, `annotations`, `digests`, `metadata`, `results`. Default: `results`.

- `verify_args`: Extra arguments to pass to the `verify` command. These are passed verbatim, so quotes and spaces must be used as they would for a regular shell invocation. For example, set values in the chart using `--chart-set`. `verify --help` is invoked at the beginning of each action run, so that can be used a a reference. Default: None.

### Refer to:
- https://github.com/redhat-certification/chart-verifier

- https://github.com/redhat-certification/chart-verifier/blob/main/docs/helm-chart-checks.md

## Outputs
`report_filename`: Name of YAML report file, which will exist in the `$GITHUB_WORKSPACE` directory.
`results_filename`: Path to processed JSON results file, which will exist in the `$GITHUB_WORKSPACE` directory.
`passed`: Number of passed checks.
`failed`: Number of failed checks.

## Example Workflow Job

Refer to the [example](./.github/workflows/verify.yaml).

```yaml
jobs:
  verify-chart:
    name: Verify Helm Chart
    runs-on: ubuntu-20.04
    steps:
      - uses: redhat-actions/oc-login@v1
        with:
          openshift_server_url: ${{ secrets.OPENSHIFT_SERVER }}
          openshift_token: ${{ secrets.OPENSHIFT_TOKEN }}

      - uses: redhat-actions/chart-verifier@main
        with:
          chart_uri: https://github.com/redhat-actions/openshift-actions-runner-chart/blob/release-chart/packages/actions-runner-1.1.tgz?raw=true
          verify_args: --chart-set githubOwner=tetchel
```
