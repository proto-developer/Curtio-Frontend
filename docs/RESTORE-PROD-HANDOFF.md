# Handoff: restore staging features to production

Copy the **prompt** below to Cursor (or any agent) when staging testing is done and you want legal pages, pricing/plans, and free-plan link limits on **production** again.

Do **not** say “merge main into prod.” That will fail to restore the features if the rollback PRs already landed.

---

## Prompt to paste

```
Restore Curtio production from staging now that testing on main is approved.

Follow docs/RESTORE-PROD-HANDOFF.md in Curtio-Frontend (same instructions apply to Curtio-Backend).

Repos:
- Frontend: https://github.com/proto-developer/Curtio-Frontend
- Backend:  https://github.com/proto-developer/Curtio-Backend

Branches: `main` = staging (keep as-is). `prod` = production (this is what we update).

HARD RULE: do not merge `main` into `prod` as the restore. Git already merged those feature commits into prod, then we removed them with rollback PRs. A later main→prod merge will keep the deletions.

Correct restore:
1. Check whether frontend PR #4 and backend PR #5 are merged.
2. If they are still OPEN: close them without merging. Prod already has the features. Then open/merge PRs that bring remaining `main`-only commits onto `prod` (frontend still has the pricing-card copy tweak).
3. If they ARE merged: on each repo, revert the rollback merge commit (the merge of PR #4 / PR #5), via a new PR into `prod`. Do not force-push `prod` (branch protection: PRs only).
4. After the reverts land, if `main` still has commits `prod` does not, cherry-pick or PR those remaining commits into `prod` (frontend: pricing-card tweak `c57bfb3` / merge `617920c`).
5. Leave `main` untouched. Do not delete backup branches `backup/prod-before-legal-rollback`.
6. Verify both repos as listed in the handoff, then give me the PR URLs.
```

---



## Why this is not a normal merge

Both default branches are `prod`. Features were merged **into prod first**, then we tried to take them off prod while leaving them on `main`.


| Repo     | What shipped onto prod                                                                                                                             | Rollback                                                                                                                                                                                                                                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | PR #1 merged `main` → `prod` (`4d04d17`). Added Terms, Privacy, Refund, Shipping, PasswordProtected, new Pricing, `premiumAccess` / link-limit UI. | PR #4: [https://github.com/proto-developer/Curtio-Frontend/pull/4](https://github.com/proto-developer/Curtio-Frontend/pull/4) — commit `de3b10f` on `rollback/prod-legal`. Tree matches pre-feature `859f77b`.                                                                                                         |
| Backend  | PR #2 + PR #4 put subscription link limits on prod. 1s redirect delay stayed on purpose.                                                           | PR #5: [https://github.com/proto-developer/Curtio-Backend/pull/5](https://github.com/proto-developer/Curtio-Backend/pull/5) — commit `f8dbc15` on `rollback/prod-legal`. Removes `config/premium.js` + `models/Subscription.js` and quota checks. **Keeps** `config/redirectTiming.js` (1s delay, 1s pre-click grace). |


`prod` is protected: **no force-push**, **changes must go through a pull request**. Write access cannot bypass that. Do not try `git push --force origin prod`.

A three-way merge of `main` into `prod` after the rollback uses a merge-base that **already contains** the feature files. `main` did not change those files again; `prod` deleted them. Git keeps the deletions. Privacy, Terms, premium quota, etc. would stay gone.

**Restore = revert the rollback**, not merge staging.

---



## State to re-check before touching anything

As of 2026-09-02 the rollback PRs were still **open** and `origin/prod` still had the features. Re-fetch. Do not assume this table is still true.

```bash
git fetch origin
git log -1 --oneline origin/prod origin/main
gh pr view 4 --repo proto-developer/Curtio-Frontend --json state,mergedAt,mergeCommit
gh pr view 5 --repo proto-developer/Curtio-Backend --json state,mergedAt,mergeCommit
```


| Ref                     | Frontend (expected at handoff time)                                                   | Backend (expected at handoff time)              |
| ----------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `origin/main`           | `617920c` — has legal pages, new pricing, link-limit UI, plus pricing-card copy tweak | `50c295c` — has link limits + 1s timing         |
| `origin/prod`           | `4d04d17` — has legal/pricing/limits, **not** the pricing-card tweak                  | `923286e` — has link limits + 1s timing         |
| Rollback branch         | `rollback/prod-legal` @ `de3b10f`                                                     | `rollback/prod-legal` @ `f8dbc15`               |
| Closed (do not reopen)  | Frontend PR #3 (`main` → `prod`) — would have put features on prod during the freeze  | —                                               |
| Backups (do not delete) | `backup/prod-before-legal-rollback` @ `4d04d17`                                       | `backup/prod-before-legal-rollback` @ `923286e` |


Local clones:

- `/home/muhammad-nabeel-asif/Desktop/Curtio-Frontend`
- `/home/muhammad-nabeel-asif/Desktop/Curtio-Backend`

Work in those checkouts. Do not use git worktrees.

---



## Procedure A — rollback PRs still OPEN (prod never actually rolled back)

Prod already has the features. Staging testing being “done” means: **do not merge the rollbacks.**

1. Close frontend PR #4 and backend PR #5 if still open, with a comment that staging was approved and production should keep the features.
2. Frontend only: `main` is ahead of `prod` by the pricing-card tweak (`c57bfb3` / merge `617920c`). Open a PR **into** `prod` that contains that change (cherry-pick `c57bfb3` onto a branch from `origin/prod`, or a careful PR from a branch that only has that delta). Do not reopen closed PR #3 unless it is still a clean `main` → `prod` with no rollback commits.
3. Backend: `main` has no extra commits vs `prod` (only merge-commit differences). After closing PR #5, backend prod is already the desired feature set. No restore PR needed.
4. Leave `main` alone.

---



## Procedure B — rollback PRs MERGED (prod is the old tree)

This is the path if Mir/Abdullah approved PR #4 and PR #5.

### Frontend (`Curtio-Frontend`)

```bash
cd /home/muhammad-nabeel-asif/Desktop/Curtio-Frontend
git fetch origin
git checkout -B restore/prod-features origin/prod

# Revert the merge commit that brought PR #4 into prod.
# Find it with: git log origin/prod --oneline --merges | head
# Parent 1 of that merge is old prod; -m 1 restores the pre-rollback tree.
git revert -m 1 <PR4_MERGE_SHA>

git push -u origin restore/prod-features
gh pr create --base prod --head restore/prod-features \
  --title "Restore legal pages, pricing, and link limits to production" \
  --body "Reverts the production rollback (PR #4). Does not merge main. Staging (main) is unchanged."
```

After that revert is **merged** into `prod`, bring the pricing-card tweak if it is still missing:

```bash
git fetch origin
git checkout -B restore/prod-pricing-cards origin/prod
git cherry-pick c57bfb3
# If cherry-pick is messy, diff origin/main -- src/pages/Pricing.jsx and apply that delta only.
git push -u origin restore/prod-pricing-cards
gh pr create --base prod --head restore/prod-pricing-cards \
  --title "Bring staging pricing-card copy onto production"
```



### Backend (`Curtio-Backend`)

```bash
cd /home/muhammad-nabeel-asif/Desktop/Curtio-Backend
git fetch origin
git checkout -B restore/prod-link-limits origin/prod
git revert -m 1 <PR5_MERGE_SHA>
git push -u origin restore/prod-link-limits
gh pr create --base prod --head restore/prod-link-limits \
  --title "Restore free-plan link limits to production" \
  --body "Reverts the production rollback (PR #5). Keeps 1s redirect timing. Does not merge main."
```

Backend `main` should not need a follow-up cherry-pick if the revert applied cleanly.

If `git revert -m 1` conflicts, check out the feature versions of these paths from `origin/main` (not a full merge):

Frontend: `src/pages/PrivacyPolicy.jsx`, `TermsOfService.jsx`, `RefundPolicy.jsx`, `ShippingPolicy.jsx`, `PasswordProtected.jsx`, `Pricing.jsx`, `premiumAccess.js`, plus the other files PR #4 reversed (`App.jsx`, `Sidebar.jsx`, `Dashboard.jsx`, `Campaigns.jsx`, `footer.jsx`, `seoConfig.js`, …).

Backend: `config/premium.js`, `models/Subscription.js`, and the quota changes in `controllers/url.controller.js`, `services/url.service.js`, `services/jwt.js`, `server.js`, `config/db.js`. Do **not** revert `config/redirectTiming.js` back to 3s.

---



## Merge / review

- You cannot merge into `prod` without a review. Request **MirHussainJan** and **Abdullah-AI122**. Org admin is `proto-developer`.
- Auto-merge is disabled on these repos.
- Do not `--admin` merge; write role has `admin: false`.
- Frontend CI is Vercel checks. Backend CI is `.github/workflows/ci.yml` (`Node.js CI` on `main` and `prod`). Backend `pre-push` runs Jest.

---



## Verify after restore PRs merge

**Frontend** `origin/prod` **must have:**

- `src/pages/PrivacyPolicy.jsx`
- `src/pages/TermsOfService.jsx`
- `src/pages/RefundPolicy.jsx`
- `src/pages/ShippingPolicy.jsx`
- `src/pages/PasswordProtected.jsx`
- `src/premiumAccess.js`
- New pricing/plans page (not the pre-`859f77b` pricing tree)

**Backend** `origin/prod` **must have:**

- `config/premium.js` (`FREE_LINK_LIMIT = 1`)
- `models/Subscription.js`
- Quota enforcement in URL create path
- `config/redirectTiming.js` still `REDIRECT_DELAY_MS = 1000` and `PRECLICK_GRACE_MS = 1000`

`origin/main` **on both repos must be unchanged** by this restore (no reset, no force-push, no extra revert on main).

Smoke:

- Staging and production both show legal/pricing routes.
- Free account is limited to one link on **production** after backend restore.
- Paid/subscription still unlimited.
- Redirect interstitial still ~1 second (not 3).

---



## Do not

- Merge `main` → `prod` as the way to restore features after the rollback PRs merged.
- Force-push `prod`.
- Reopen frontend PR #3 blindly after a rollback merge (history is then wrong for a straight merge).
- Change `main` / staging.
- Delete `backup/prod-before-legal-rollback` on either repo.
- Roll back the 1s redirect delay while restoring link limits.

---



## If something goes wrong

Restore the pre-freeze prod trees from:

- Frontend: `backup/prod-before-legal-rollback` (`4d04d17`)
- Backend: `backup/prod-before-legal-rollback` (`923286e`)

That is a PR of those trees onto current `prod`, or an admin force-push (Nabeel cannot force-push). Prefer a PR.

---



## What “done” looks like

Agent reply should include:

1. Which procedure ran (A: rollbacks closed, or B: rollbacks reverted).
2. Frontend and backend PR URLs.
3. Confirmation `main` was not modified.
4. Confirmation 1s redirect timing is still on backend prod.
5. Anything still blocked on review.

