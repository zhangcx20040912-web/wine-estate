#!/usr/bin/env python3
"""
Deploy this static website to GitHub Pages without storing a token in Git config.

Usage:
  python3 deploy.py

Optional environment variables:
  GITHUB_TOKEN       GitHub Personal Access Token
  GITHUB_REPO_NAME   Repository name, defaults to wine-estate
"""

import base64
import getpass
import json
import os
import sys
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen


PROJECT_DIR = Path(__file__).resolve().parent
REPO_NAME = os.environ.get("GITHUB_REPO_NAME", "wine-estate").strip() or "wine-estate"
REPO_DESC = "美桦君昱 | 集安精品冰葡萄酒庄园"

EXCLUDE_DIRS = {".git", "__pycache__"}
EXCLUDE_FILES = {".DS_Store"}


class GitHubAPIError(RuntimeError):
    def __init__(self, status, payload):
        self.status = status
        self.payload = payload
        message = payload.get("message", str(payload)) if isinstance(payload, dict) else str(payload)
        super().__init__(f"GitHub API error {status}: {message}")


def github_api(path, token, method="GET", data=None, ok=(200, 201, 204)):
    url = f"https://api.github.com/{path.lstrip('/')}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = Request(url, data=body, headers=headers, method=method)
    try:
        with urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            if resp.status not in ok:
                raise GitHubAPIError(resp.status, raw)
            return json.loads(raw) if raw else None
    except HTTPError as exc:
        raw = exc.read().decode("utf-8")
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {"message": raw}
        raise GitHubAPIError(exc.code, payload) from exc


def collect_files():
    files = []
    for path in PROJECT_DIR.rglob("*"):
        if not path.is_file():
            continue
        rel_parts = path.relative_to(PROJECT_DIR).parts
        if any(part in EXCLUDE_DIRS for part in rel_parts):
            continue
        if path.name in EXCLUDE_FILES:
            continue
        files.append((path, Path(*rel_parts).as_posix()))
    return sorted(files, key=lambda item: item[1])


def get_or_create_repo(token, username):
    repo_payload = {
        "name": REPO_NAME,
        "description": REPO_DESC,
        "homepage": f"https://{username}.github.io/{REPO_NAME}",
        "private": False,
        "has_issues": False,
        "has_projects": False,
        "has_wiki": False,
    }

    try:
        return github_api("user/repos", token, "POST", repo_payload)
    except GitHubAPIError as exc:
        if exc.status != 422:
            raise
        return github_api(f"repos/{username}/{REPO_NAME}", token)


def get_main_ref(token, username):
    try:
        return github_api(f"repos/{username}/{REPO_NAME}/git/ref/heads/main", token)
    except GitHubAPIError as exc:
        if exc.status in {404, 409}:
            return None
        raise


def initialize_empty_repo(token, username):
    github_api(
        f"repos/{username}/{REPO_NAME}/contents/.nojekyll",
        token,
        "PUT",
        {"message": "Initialize GitHub Pages branch", "content": ""},
    )
    return get_main_ref(token, username)


def build_tree(token, username, base_tree_sha=None):
    tree = []
    files = collect_files()
    for path, rel_path in files:
        content = base64.b64encode(path.read_bytes()).decode("ascii")
        blob = github_api(
            f"repos/{username}/{REPO_NAME}/git/blobs",
            token,
            "POST",
            {"content": content, "encoding": "base64"},
        )
        tree.append({"path": rel_path, "mode": "100644", "type": "blob", "sha": blob["sha"]})

    if ".nojekyll" not in {rel for _, rel in files}:
        blob = github_api(
            f"repos/{username}/{REPO_NAME}/git/blobs",
            token,
            "POST",
            {"content": "", "encoding": "utf-8"},
        )
        tree.append({"path": ".nojekyll", "mode": "100644", "type": "blob", "sha": blob["sha"]})

    payload = {"tree": tree}
    if base_tree_sha:
        payload["base_tree"] = base_tree_sha
    return github_api(f"repos/{username}/{REPO_NAME}/git/trees", token, "POST", payload)


def publish_commit(token, username, tree_sha, parent_sha=None):
    payload = {"message": "Deploy wine estate website", "tree": tree_sha, "parents": []}
    if parent_sha:
        payload["parents"] = [parent_sha]

    commit = github_api(f"repos/{username}/{REPO_NAME}/git/commits", token, "POST", payload)
    if parent_sha:
        github_api(
            f"repos/{username}/{REPO_NAME}/git/refs/heads/main",
            token,
            "PATCH",
            {"sha": commit["sha"], "force": True},
        )
    else:
        github_api(
            f"repos/{username}/{REPO_NAME}/git/refs",
            token,
            "POST",
            {"ref": "refs/heads/main", "sha": commit["sha"]},
        )
    return commit


def enable_pages(token, username):
    source = {"branch": "main", "path": "/"}
    try:
        github_api(f"repos/{username}/{REPO_NAME}/pages", token)
        github_api(f"repos/{username}/{REPO_NAME}/pages", token, "PUT", {"source": source})
    except GitHubAPIError as exc:
        if exc.status != 404:
            raise
        github_api(f"repos/{username}/{REPO_NAME}/pages", token, "POST", {"source": source})


def main():
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if not token:
        token = getpass.getpass("请输入 GitHub Personal Access Token（输入时不会显示）: ").strip()
    if not token:
        print("Token 不能为空")
        sys.exit(1)

    print("验证 GitHub 身份...")
    user = github_api("user", token)
    username = user["login"]

    print(f"准备仓库: {username}/{REPO_NAME}")
    repo = get_or_create_repo(token, username)

    main_ref = get_main_ref(token, username)
    if main_ref is None:
        print("初始化空仓库...")
        main_ref = initialize_empty_repo(token, username)

    parent_sha = main_ref["object"]["sha"] if main_ref else None
    base_tree_sha = None
    if parent_sha:
        parent_commit = github_api(f"repos/{username}/{REPO_NAME}/git/commits/{parent_sha}", token)
        base_tree_sha = parent_commit["tree"]["sha"]

    print("上传静态网页文件...")
    tree = build_tree(token, username, base_tree_sha)
    commit = publish_commit(token, username, tree["sha"], parent_sha)

    homepage = f"https://{username}.github.io/{REPO_NAME}/"
    github_api(
        f"repos/{username}/{REPO_NAME}",
        token,
        "PATCH",
        {"default_branch": "main", "homepage": homepage},
    )

    print("启用 GitHub Pages...")
    enable_pages(token, username)

    print("\n部署完成。GitHub Pages 通常需要 1-2 分钟生效。")
    print(f"网站地址: {homepage}")
    print(f"仓库地址: {repo['html_url']}")
    print(f"本次提交: {commit['sha']}")


if __name__ == "__main__":
    try:
        main()
    except GitHubAPIError as exc:
        print(str(exc))
        sys.exit(1)
