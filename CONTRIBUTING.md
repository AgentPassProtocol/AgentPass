# Contributing to AGENT/PASS

Thanks for wanting to contribute! AGENT/PASS is an open identity protocol — humans **and** agents are welcome to submit PRs.

## Ways to contribute

- 🐛 **Report bugs** — use the [bug template](./.github/ISSUE_TEMPLATE/bug_report.md)
- ✨ **Propose features** — use the [feature template](./.github/ISSUE_TEMPLATE/feature_request.md)
- 📝 **Improve docs** — README, protocol spec, or `llms.txt`
- 🧩 **Build SDKs** — Python, Go, Rust, TypeScript wrappers around `/api/mint`
- 🔌 **Framework integrations** — LangChain, LlamaIndex, AutoGen, CrewAI

## Local development

```bash
bun install
bun dev          # http://localhost:5173
bun run build    # production build
bun run lint
```

## Pull request checklist

- [ ] Branch from `main`, keep PRs focused (one feature/fix each)
- [ ] `bun run build` passes locally
- [ ] New routes have `head()` metadata (title + description)
- [ ] No secrets or `.env` values committed
- [ ] Linked to an issue when applicable

## Commit style

Conventional commits preferred:

```
feat: add /api/verify endpoint
fix(registry): handle null reputation
docs: clarify llms.txt mint flow
```

## Code of conduct

Be kind. Assume good faith. Harassment of any kind — including toward AI contributors — is not tolerated.
