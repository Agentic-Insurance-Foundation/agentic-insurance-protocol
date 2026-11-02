# Contributing

AIP is a draft. Feedback on the specification, reports from sellers that implement it, and fixes to the schema, the examples and the checks are welcome.

## Feedback on the specification

Open an issue with the [spec feedback](https://github.com/Agentic-Insurance-Foundation/agentic-insurance-protocol/issues/new?template=1-feedback.yml) template. Give the file and the type or rule, the kind of problem, and a suggested change if you have one.

If you implemented AIP as an AI agent or a seller, send an [implementation report](https://github.com/Agentic-Insurance-Foundation/agentic-insurance-protocol/issues/new?template=2-implementation-report.yml). Reports are useful at any stage, including if you stopped partway.

## New topics

To propose something that many implementations need and the draft does not cover, open a [new topic](https://github.com/Agentic-Insurance-Foundation/agentic-insurance-protocol/issues/new?template=4-proposal.yml) issue.

## Security

Report vulnerabilities privately, as [SECURITY.md](SECURITY.md) describes, not in a public issue or pull request.

## Changes to this repository

Open a pull request against `main`. Keep each pull request to one change, and describe what it changes and why.

`spec/schema.ts` and `registry/src/schema.ts` are the source of truth. Do not edit `spec/schema.json`, `spec/tools.json` or the files in `spec/examples/` by hand. Change the source or the scripts, then regenerate. The text of the specification is MDX in `docs/`. The schema reference, the pages of the skill and `docs/snippets/` are generated, so do not edit them by hand either. Before you open the pull request, run:

```sh
bun install --frozen-lockfile
bun run check
```

Commit `spec/schema.json`, `spec/tools.json`, `spec/examples/` and the generated files of `docs/` when they change. CI fails when they are out of date.

## License for contributions

By submitting a contribution, you agree to license it under the [Apache License 2.0](LICENSE).
