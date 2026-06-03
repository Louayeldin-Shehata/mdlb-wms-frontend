# Git Push Reference — mdlb-wms-frontend

This document describes how to commit and push changes to the
`Louayeldin-Shehata/mdlb-wms-frontend` repository from this environment.

## Account used for commits

All commits should be authored and committed as:

```
Name:  Louayeldin Shehata
Email: louayeldin@gmail.com
```

Set this once per session (or add to `~/.gitconfig`):

```bash
git config user.name  "Louayeldin Shehata"
git config user.email "louayeldin@gmail.com"
```

## Pushing to GitHub

The sandbox proxy (`origin`) may return 403 on push. Use a Personal Access
Token (PAT) with `repo` scope and the `url.insteadOf` rewrite so the PAT is
never embedded directly in the `git push` command:

```bash
# Replace <PAT> with a GitHub Personal Access Token (Settings → Developer Settings → PATs)
git -c url."https://<PAT>:x-oauth-basic@github.com/".insteadOf="https://github.com/" \
    push origin <branch-name>
```

For a force-push (e.g. after `--amend` or `--reset-author`):

```bash
git -c url."https://<PAT>:x-oauth-basic@github.com/".insteadOf="https://github.com/" \
    push --force origin <branch-name>
```

Make sure `origin` points at the plain HTTPS remote (no credentials embedded):

```bash
git remote set-url origin https://github.com/Louayeldin-Shehata/mdlb-wms-frontend.git
git remote -v   # should show https://github.com/... for both fetch and push
```

## Keeping commits verified

GitHub marks commits as **Verified** when the committer email matches a
verified address on the GitHub account.

For Claude Code sessions on this branch (`claude/*`), commits are set to
`noreply@anthropic.com` by the harness. To override before committing:

```bash
git config user.email "louayeldin@gmail.com"
git config user.name  "Louayeldin Shehata"
```

Or amend the last commit to change the author/committer:

```bash
git commit --amend --no-edit --reset-author
```

## Typical session workflow

```bash
# 1. Configure identity
git config user.name  "Louayeldin Shehata"
git config user.email "louayeldin@gmail.com"

# 2. Make changes, stage, commit
git add <files>
git commit -m "your message"

# 3. Push (replace <PAT> with your token)
git -c url."https://<PAT>:x-oauth-basic@github.com/".insteadOf="https://github.com/" \
    push origin <branch>
```
