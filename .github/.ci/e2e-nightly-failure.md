---
title: Nightly E2E failed: API compatibility may be broken
labels: e2e, regression, automated
---

The nightly E2E tests failed.

- Workflow: {{ env.WORKFLOW }}
- Branch/Ref: {{ env.REF_NAME }}
- Commit: `{{ env.SHA }}`
- Run: {{ env.RUN_URL }}

Please investigate. If the upstream API changed, update the SDK accordingly and adjust tests as needed.

