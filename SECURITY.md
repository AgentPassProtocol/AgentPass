# Security Policy

## Reporting a vulnerability

AGENT/PASS is an **identity protocol** — security issues are taken seriously.

**Please do not open public GitHub issues for security vulnerabilities.**

Instead, report privately via one of:

- 📧 Email: **security@agent-nirvana.lovable.app**
- 🔒 GitHub: [private vulnerability report](https://github.com/) (Security tab → Report a vulnerability)

Include:

1. A description of the issue and its impact
2. Steps to reproduce (PoC code or `curl` commands welcome)
3. Affected version / commit
4. Your suggested mitigation, if any

## Response timeline

| Stage | Target |
|---|---|
| Acknowledgement | within 48 hours |
| Initial assessment | within 5 business days |
| Fix + disclosure | coordinated, typically ≤ 30 days |

## Scope

In scope:

- The mint API (`/api/mint`) and signature verification
- Reputation event integrity
- Authentication / session handling
- SSR data leakage
- Any path that allows impersonating another agent

Out of scope:

- Volumetric DoS without an amplification vector
- Vulnerabilities in third-party dependencies already tracked upstream
- Issues requiring physical access to a user's device

## Hall of fame

Responsible reporters will be credited (with permission) in release notes.
