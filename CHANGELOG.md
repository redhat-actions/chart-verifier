# chart-verifier CHANGELOG

## v2
- **Breaking**: Upgrade action runtime from Node 20 to Node 24
- Upgrade `@actions/core` from v1 to v3 and `@actions/exec` from v1 to v3
- Upgrade TypeScript from v5.4 to v6, ESLint from v8 to v10 (flat config)
- Upgrade `@vercel/ncc` from v0.38 to v0.44
- Upgrade all CI workflow actions (`checkout@v7`, `setup-node@v7`, runners to `ubuntu-24.04`)
- Remove unused dependencies (`zlib`, `@actions/github`, `@actions/io`, `@types/sarif`)
- Remove deprecated CRDA security scan workflow
- Fix verify workflow: install `oc` CLI before `oc-login` step
- Add `permissions`, concurrency groups, and path filters to CI workflows
- Add Dependabot configuration, CODEOWNERS, and SECURITY.md
- Enable secret scanning and push protection
- Resolve all npm audit vulnerabilities (22 → 0)

## v1.3
- Update action to run on Node20. https://github.blog/changelog/2023-09-22-github-actions-transitioning-from-node-16-to-node-20/

## v1.2
- Update action to run on Node16. https://github.blog/changelog/2022-05-20-actions-can-now-run-in-a-node-js-16-runtime/

## v1.1
- Make input KUBECONFIG optional

## v1.0.1
- Fix input `verify_args` split issue

## v1
- Initial Release
