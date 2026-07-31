export type GitHubPreset = {
  id: string;
  label: string;
  language: string;
  repo: string;
  path: string;
  fallbackCode: string;
};

export const GITHUB_CODE_PRESETS: GitHubPreset[] = [
  {
    id: "react-hooks",
    label: "React (useMemo / useState)",
    language: "typescript",
    repo: "facebook/react",
    path: "packages/react/src/ReactHooks.js",
    fallbackCode: `import { useMemo, useState, useCallback, useEffect } from "react";

export function useDataFetcher<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(url);
    const result = await res.json();
    setData(result);
    setLoading(false);
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}`,
  },
  {
    id: "typescript-compiler",
    label: "TypeScript AST Utility",
    language: "typescript",
    repo: "microsoft/TypeScript",
    path: "src/compiler/utilities.ts",
    fallbackCode: `export function isIdentifier(node: Node): node is Identifier {
  return node.kind === SyntaxKind.Identifier;
}

export function createToken(kind: SyntaxKind): Token {
  return { kind, pos: -1, end: -1 };
}

export function parseSourceFile(fileName: string, sourceText: string): SourceFile {
  const scanner = createScanner(ScriptTarget.Latest, true);
  scanner.setText(sourceText);
  return parseFile(fileName, scanner);
}`,
  },
  {
    id: "python-asyncio",
    label: "Python Async Engine",
    language: "python",
    repo: "python/cpython",
    path: "Lib/asyncio/tasks.py",
    fallbackCode: `import asyncio
import time

async function process_queue(queue: asyncio.Queue, worker_id: int):
    while not queue.empty():
        item = await queue.get()
        print(f"Worker {worker_id} processing {item}")
        await asyncio.sleep(0.05)
        queue.task_done()

async function main():
    queue = asyncio.Queue()
    for i in range(20):
        queue.put_nowait(i)
    tasks = [asyncio.create_task(process_queue(queue, i)) for i in range(3)]
    await asyncio.gather(*tasks)`,
  },
  {
    id: "rust-tokio",
    label: "Rust Tokio Async Loop",
    language: "rust",
    repo: "tokio-rs/tokio",
    path: "tokio/src/runtime/task/mod.rs",
    fallbackCode: `use std::sync::Arc;
use tokio::sync::mpsc;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let (tx, mut rx) = mpsc::channel(32);
    let tx2 = tx.clone();

    tokio::spawn(async move {
        tx2.send("hello from worker").await.unwrap();
    });

    while let Some(message) = rx.recv().await {
        println!("Received: {}", message);
    }
    Ok(())
}`,
  },
  {
    id: "go-gin",
    label: "Go Gin HTTP Router",
    language: "go",
    repo: "gin-gonic/gin",
    path: "gin.go",
    fallbackCode: `package main

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

type User struct {
	ID   string \`json:"id"\`
	Name string \`json:"name"\`
}

func main() {
	r := gin.Default()
	r.GET("/api/v1/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	r.Run(":8080")
}`,
  },
];

export async function fetchGitHubRepoCode(ownerRepo: string, filePath?: string): Promise<string> {
  const parts = ownerRepo.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").split("/");
  if (parts.length < 2) {
    throw new Error("Invalid repo format. Use owner/repo (e.g. facebook/react)");
  }
  const owner = parts[0];
  const repo = parts[1];

  // Try raw file if explicit path provided or default to main/master readme or index
  const path = filePath || "index.js";
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`;

  try {
    const res = await fetch(rawUrl);
    if (!res.ok) {
      // Try API fallback to fetch repository tree/files
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
      const apiRes = await fetch(apiUrl);
      if (!apiRes.ok) throw new Error("Failed to fetch repository from GitHub API");
      const files = await apiRes.json();
      if (Array.isArray(files)) {
        const codeFile = files.find((f: { type: string; name: string }) =>
          f.type === "file" && /\.(ts|tsx|js|jsx|py|rs|go|cs|cpp|java)$/i.test(f.name)
        );
        if (codeFile && codeFile.download_url) {
          const fileRes = await fetch(codeFile.download_url);
          return await fileRes.text();
        }
      }
      throw new Error(`Could not find a raw code file at ${path}`);
    }
    return await res.text();
  } catch (err) {
    console.warn("GitHub fetch error, returning fallback code snippet", err);
    throw err;
  }
}
