# chart-verifier

**chart-verifier** is a GitHub Action for verifying a Helm chart passes the Red Hat Helm chart certification checks.

## Inputs
- `chart_uri`: URI to Helm chart to verify. This can be a path to the chart directory (containing `Chart.yaml`), or an http(s) URI. **Required**.

- `report_type`: The argument to pass to `report`. One of: `all`, `annotations`, `digests`, `metadata`, `results`. Default: `results`.

- `verify_args`: Extra arguments to pass to the `verify` command. These are passed verbatim, so quotes and spaces must be used as they would for a regular shell invocation. For example, set values in the chart using `--chart-set`. `verify --help` is invoked at the beginning of each action run, so that can be used a a reference. Default: None.

### Refer to:
- https://github.com/redhat-certification/chart-verifier

- https://github.com/redhat-certification/chart-verifier/blob/main/docs/helm-chart-checks.md
