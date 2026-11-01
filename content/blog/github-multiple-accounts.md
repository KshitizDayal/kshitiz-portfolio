---
title: "Two GitHub accounts, one laptop: let the folder decide"
date: 2026-11-01T14:00:00+05:30
excerpt: My personal projects and my startup live on different GitHub accounts. Instead of juggling SSH aliases, I let the folder a repo lives in pick the account. Set it up once and never think about it again.
tags: [Git, GitHub, Developer Setup]
---

I have two GitHub accounts on one MacBook. One is personal: this portfolio, side projects, open source. The other is for StatOz, the startup I'm building. For a while, keeping them apart was a mess:

- Commits on the startup repos went out with my personal email, so GitHub showed the wrong avatar and my contribution graph lied.
- Pushes failed with `ERROR: Permission to org/repo.git denied to personal-username`, because SSH had quietly logged me in as the wrong account.
- Every new clone meant remembering which special URL to use.

The fix I settled on is simple: **the folder a repo lives in decides which account it uses.** Everything under `~/Documents/personal/` is me. Everything under `~/Desktop/statoz/` is the startup. No special clone URLs and no per-repo setup. You clone into the right folder and Git does the rest.

Here's the whole setup. It takes about ten minutes.

## How it works

Git has a feature called **conditional includes**. In your global `~/.gitconfig` you can say "if this repo lives inside folder X, also load config file Y". Each of those small files sets two things:

1. **Who you are**: `user.name` and `user.email`, which get stamped on every commit.
2. **Which SSH key to use**: `core.sshCommand`, which decides which GitHub account you log in as when you push or pull.

So identity and authentication both follow the folder.

## Step 1: Create one SSH key per account

GitHub won't let two accounts share an SSH key, so each account needs its own. Give them clear names:

```bash
ssh-keygen -t ed25519 -C "you@personal.com" -f ~/.ssh/github-personal
ssh-keygen -t ed25519 -C "you@startup.com" -f ~/.ssh/github-startup
```

Each command creates a private key and a matching public key (the `.pub` file). The private key never leaves your machine.

## Step 2: Add each public key to its account

Copy the personal public key to your clipboard:

```bash
pbcopy < ~/.ssh/github-personal.pub
```

Sign in to your personal GitHub account, go to **Settings → SSH and GPG keys → New SSH key** and paste it. Then sign in to the other account and do the same with `github-startup.pub`.

Before going further, check that each key logs in as the right person:

```bash
ssh -i ~/.ssh/github-personal -o IdentitiesOnly=yes -T git@github.com
# Hi <your-personal-username>! You've successfully authenticated, but GitHub does not provide shell access.

ssh -i ~/.ssh/github-startup -o IdentitiesOnly=yes -T git@github.com
# Hi <your-startup-username>! You've successfully authenticated, ...
```

If the names come back right, the hard part is done.

## Step 3: One small config file per account

Create a config file for each identity in your home folder.

```ini:~/.gitconfig-personal
[user]
	name = personal-name
	email = you@personal.com
[core]
	sshCommand = ssh -i ~/.ssh/github-personal -o IdentitiesOnly=yes
```

```ini:~/.gitconfig-startup
[user]
	name = startup-name
	email = you@startup.com
[core]
	sshCommand = ssh -i ~/.ssh/github-startup -o IdentitiesOnly=yes
```

`core.sshCommand` replaces the plain `ssh` Git normally runs, so every push and pull from these repos uses exactly that key.

### Why `IdentitiesOnly=yes` matters

Without it, SSH also offers every key loaded in your SSH agent, and GitHub logs you in with the **first** key it recognises. If that happens to be your other account's key, you're authenticated as the wrong person, even though you passed `-i`. `IdentitiesOnly=yes` tells SSH to offer only the key you named. This one flag is behind most "it works in one repo but not the other" bugs.

## Step 4: Point each folder at its file

Now the part that ties it together. In your global `~/.gitconfig`:

```ini:~/.gitconfig
[user]
	useConfigOnly = true

[includeIf "gitdir:~/Desktop/statoz/"]
	path = ~/.gitconfig-startup

[includeIf "gitdir:~/Documents/personal/"]
	path = ~/.gitconfig-personal
```

Read it as: "if the repo is anywhere inside `~/Desktop/statoz/`, load the startup config". Two details matter:

- **Keep the trailing slash.** `gitdir:~/Desktop/statoz/` matches every repo inside that folder, at any depth. Without the slash, the pattern has to match the repo's `.git` folder exactly, which in practice means it matches nothing and the rule silently never applies.
- **There's no global name or email.** That's deliberate, and it's what the next line is for.

### `useConfigOnly`: the safety net

`user.useConfigOnly = true` tells Git: never guess who I am. If I commit in a repo outside both folders, Git refuses instead of making up an identity from my computer's name:

```text
fatal: no email was given and auto-detection is disabled
```

That error is a feature. It's far better than finding out a month later that a commit went out as `kshitiz@Kshitizs-MacBook-Pro.local`. When you see it, either move the repo into the right folder or add another `includeIf` for its new home.

## Step 5: Check it

Go into any repo and ask Git who you are, and where that answer came from:

```bash
cd ~/Documents/personal/side-project
git config --show-origin user.email
# file:/Users/kshitiz/.gitconfig-personal    you@personal.com

cd ~/Desktop/statoz/startup-app
git config --show-origin user.email
# file:/Users/kshitiz/.gitconfig-startup    you@startup.com
```

`--show-origin` is the best debugging tool for this setup, because it tells you exactly which file a value came from. Then `git fetch` in each repo to confirm the right key is used.

## Things that can still trip you up

**HTTPS remotes ignore all of this.** `core.sshCommand` only applies to SSH URLs. If a repo was cloned with `https://github.com/...`, switch it over:

```bash
git remote set-url origin git@github.com:personal-username/my-repo.git
```

**Old commits keep their old email.** The setup fixes every commit from now on. If you need to fix the last commit, run `git commit --amend --reset-author --no-edit` inside the right folder.

**A repo in the wrong folder gets the wrong identity**, or none at all, thanks to `useConfigOnly`. Just move the folder; Git re-reads the config every time it runs.

## Why not SSH host aliases?

The other common approach is to create fake hosts in `~/.ssh/config`, like `github.com-work`, and rewrite every clone URL to match:

```bash
git clone git@github.com-work:startup/app.git
```

It works, but it means editing every URL you copy from GitHub, forever, and remembering which alias goes with which repo. With the folder approach, URLs stay exactly as GitHub gives them. The only thing you ever decide is where to put the project, and you were deciding that anyway.

## The whole thing at a glance

| Piece | What it does |
| --- | --- |
| `~/.ssh/github-personal`, `~/.ssh/github-startup` | One SSH key per GitHub account |
| `~/.gitconfig-personal`, `~/.gitconfig-startup` | Name, email and key for each account |
| `includeIf "gitdir:..."` in `~/.gitconfig` | Picks the right file based on the folder |
| `user.useConfigOnly = true` | Refuses to commit if no identity matches |

Set it up once, and "which account am I on?" stops being a question. It's the folder.
