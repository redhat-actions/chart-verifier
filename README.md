# chart-verifier

**chart-verifier** is a GitHub Action for verifying a Helm chart passes the Red Hat Helm chart certification checks.

You can read more about the `chart-verifier` tool at [redhat-certification/chart-verifier](https://github.com/redhat-certification/chart-verifier).

The `chart-verifier` executable is packaged into a Docker image, which can be pulled from [quay.io/redhat-certification/chart-verifier:latest](https://quay.io/redhat-certification/chart-verifier:latest). See [the Dockerfile](./Dockerfile) for the additional steps run for the image used by this action.

## Prerequisites

1. Be logged into a Kubernetes cluster, with the `KUBECONFIG` environment variable set.
2. Have a Helm chart to verify.
3. Make sure that `helm install` succeeds on your cluster, and that any tests pass.

## Inputs
| Input | Description | Default |
| ----- | ----------- | ------- |
| `chart_uri` | URI to Helm chart to verify. This can be a path to a local directory containing `Chart.yaml`, or an http(s) URI. | **Required** |
| `report_type` |  The argument to pass to `report`. One of: `all`, `annotations`, `digests`, `metadata`, `results`. | `results` |
| `profile_name` | Run a different set of Chart checks. Refer to [this list of profiles](https://github.com/redhat-certification/chart-verifier/tree/main/config). For example, to run the latest `profile-partner-*.yaml`, pass "partner" in this input. | None |
| `profile_version` | Version of the `profile_name` to run. If `profile_name` is set but `profile_version` is not, the latest version is used. | None
| `verify_args` | Extra arguments to pass to the `verify` command. Quotes and spaces must be used as they would for a regular shell invocation. `verify --help` is run at the beginning of each action run for reference. | None |
| `fail` | Set it to `false` to not fail the workflow step. If set to true, workflow will fail if at least one check is failed. | `true`

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

      - uses: redhat-actions/chart-verifier@v1.0.0
        with:
          chart_uri: https://github.com/redhat-actions/openshift-actions-runner-chart/blob/release-chart/packages/actions-runner-1.1.tgz?raw=true
          verify_args: --chart-set githubOwner=tetchel
```
## Versioning of this action

New version of this action will be released once there is a new tag of the image `https://quay.io/redhat-certification/chart-verifier` is released.
If the image released is the minor version, then this actions' minor version will be released. Since, [chart-verifier](https://github.com/redhat-certification/chart-verifier) tool often introduce new mandatory checks that may break your existing workflows. Therefore for this action we recommend to use minor versions i.e use `v1.1` instead of using `v1`, as minor versions will not be updated in the next release (e.g. `v1.2`) but major versions (i.e. `v1`) will be rolled forward to the new release (i.e. `v1.2`).

For the updated mandatory checks that gets introduced through new version, refer to [CHANGELOG.md](./CHANGELOG.md)

## Troubleshooting
If the `verify` step appears to be stuck, it is probably waiting for your chart to be installed successfully. The tool will wait up to 5 minutes by default for `helm install` to succeed.

Make sure your chart can be installed on the currently logged in cluster before using the `chart-verifier`.
