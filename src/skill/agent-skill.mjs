import { mkdir, readFile, readdir, realpath, rm, symlink } from "node:fs/promises";
import path from "node:path";
import { exists, sha256File, writeText } from "../shared/fs.mjs";

const DEFAULT_TARGET = ".claude/skills/slidesls";

export function defaultSkillTarget(cwd = process.cwd()) {
  return path.resolve(cwd, DEFAULT_TARGET);
}

export function bundledSkillRoot() {
  return path.resolve(import.meta.dirname, "..", "..", "skills", "slidesls");
}

export async function packageInfo() {
  const pkgPath = path.resolve(import.meta.dirname, "..", "..", "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
  return { name: pkg.name, version: pkg.version };
}

export async function listSkillFiles(sourceRoot = bundledSkillRoot()) {
  const files = [];

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => {
      if (a.name === "SKILL.md") return -1;
      if (b.name === "SKILL.md") return 1;
      return a.name.localeCompare(b.name);
    });
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
        continue;
      }
      if (!entry.isFile()) continue;
      const relative = path.relative(sourceRoot, absolute).replaceAll(path.sep, "/");
      files.push({ path: relative, absolute, sha256: await sha256File(absolute) });
    }
  }

  await walk(sourceRoot);
  return files;
}

export async function skillInfo() {
  const pkg = await packageInfo();
  const source = bundledSkillRoot();
  const files = await listSkillFiles(source);
  return {
    name: "slidesls",
    package: pkg.name,
    cliVersion: pkg.version,
    source,
    files: files.map(({ path, sha256 }) => ({ path, sha256 })),
    recommendedTargets: [DEFAULT_TARGET],
  };
}

export const skillReferenceFiles = {
  catalog: "references/catalog.md",
  "deck-authoring": "references/deck-authoring.md",
  "copy-workflow": "references/copy-workflow.md",
  "preview-validation": "references/preview-validation.md",
  "registry-contract": "references/registry-contract.md",
};

export async function readSkillMarkdown() {
  return readFile(path.join(bundledSkillRoot(), "SKILL.md"), "utf8");
}

export async function readSkillReference(name) {
  const file = skillReferenceFiles[name];
  if (!file) {
    const error = new Error(
      `Unknown skill reference: ${name}. Valid references: ${Object.keys(skillReferenceFiles).join(", ")}`,
    );
    error.code = "usage_error";
    error.exitCode = 2;
    throw error;
  }
  return readFile(path.join(bundledSkillRoot(), file), "utf8");
}

export async function readAllSkillMarkdown() {
  const root = bundledSkillRoot();
  const sections = [{ title: "SKILL.md", markdown: await readSkillMarkdown() }];
  for (const file of Object.values(skillReferenceFiles)) {
    sections.push({ title: file, markdown: await readFile(path.join(root, file), "utf8") });
  }
  return sections.map((section) => `<!-- ${section.title} -->\n${section.markdown}`).join("\n\n");
}

export async function planSkillInstall({
  targetDir = defaultSkillTarget(),
  dryRun = false,
  force = false,
} = {}) {
  const source = bundledSkillRoot();
  const target = path.resolve(targetDir);
  const files = await listSkillFiles(source);
  const planned = [];
  let hasConflicts = false;

  for (const file of files) {
    const targetPath = path.join(target, file.path);
    let status = "created";
    if (await exists(targetPath)) {
      const targetHash = await sha256File(targetPath);
      status = targetHash === file.sha256 ? "unchanged" : "conflict";
      if (status === "conflict") hasConflicts = true;
    }
    if (dryRun && status !== "unchanged")
      status = status === "conflict" ? (force ? "would-update" : "would-conflict") : "would-create";
    planned.push({
      path: file.path,
      sourcePath: file.absolute,
      targetPath,
      sha256: file.sha256,
      status,
    });
  }

  return { action: "install", source, target, dryRun, hasConflicts, files: planned };
}

export async function performSkillInstall({
  targetDir = defaultSkillTarget(),
  dryRun = false,
  force = false,
} = {}) {
  const plan = await planSkillInstall({ targetDir, dryRun, force });
  const conflicts = plan.files.filter(
    (file) => file.status === "conflict" || file.status === "would-conflict",
  );
  if (conflicts.length && !force) {
    const error = new Error(
      `Refusing to overwrite existing skill file(s) without --force: ${conflicts.map((file) => file.path).join(", ")}`,
    );
    error.code = "file_exists";
    error.details = { conflicts: conflicts.map((file) => file.path) };
    throw error;
  }

  if (!dryRun) {
    for (const file of plan.files) {
      if (file.status === "unchanged") continue;
      await writeText(file.targetPath, await readFile(file.sourcePath, "utf8"));
      if (file.status === "conflict" || file.status === "would-update") file.status = "updated";
    }
  }

  return summarizePlan({ ...plan, forced: force });
}

export async function performSkillLink({ targetDir = defaultSkillTarget(), force = false } = {}) {
  const source = bundledSkillRoot();
  const target = path.resolve(targetDir);
  let status = "created";

  if (await exists(target)) {
    const currentReal = await realTarget(target);
    const sourceReal = await realTarget(source);
    if (currentReal === sourceReal) {
      status = "unchanged";
    } else if (!force) {
      const error = new Error(`Refusing to replace existing path without --force: ${target}`);
      error.code = "file_exists";
      throw error;
    } else {
      await rm(target, { recursive: true, force: true });
      status = "updated";
    }
  }

  if (status !== "unchanged") {
    await mkdir(path.dirname(target), { recursive: true });
    await symlink(source, target, "dir");
  }

  return {
    action: "link",
    source,
    target,
    status,
    files: (await listSkillFiles(source)).map(({ path, sha256 }) => ({ path, sha256 })),
  };
}

async function realTarget(target) {
  try {
    return path.resolve(await realpath(target));
  } catch {
    return null;
  }
}

function summarizePlan(plan) {
  const counts = {};
  for (const file of plan.files) counts[file.status] = (counts[file.status] || 0) + 1;
  return {
    action: plan.action,
    source: plan.source,
    target: plan.target,
    dryRun: plan.dryRun,
    forced: plan.forced,
    counts,
    files: plan.files.map(({ path, targetPath, sha256, status }) => ({
      path,
      targetPath,
      sha256,
      status,
    })),
  };
}
