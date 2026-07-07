import { mkdir, readFile, readdir, realpath, rm, symlink } from "node:fs/promises";
import path from "node:path";
import { exists, sha256File, writeText } from "../shared/fs.mjs";

const SKILL_NAME = "create-slides-with-slidesls";
const EXAMPLE_TARGETS = [
  { runtime: "Claude Code project-local", path: `.claude/skills/${SKILL_NAME}` },
];
const POST_INSTALL_INSTRUCTIONS = [
  "Fully read the installed SKILL.md before authoring slides.",
  "Read relevant bundled references, especially style-directions.md, archetypes.md, and qa.md.",
  "If your runtime does not auto-load this skill, run slidesls skill show and read SKILL.md; use slidesls skill show --all only as a full export fallback.",
];

export { SKILL_NAME };

export function bundledSkillRoot() {
  return path.resolve(import.meta.dirname, "..", "..", "skills", SKILL_NAME);
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
    name: SKILL_NAME,
    package: pkg.name,
    cliVersion: pkg.version,
    source,
    files: files.map(({ path, sha256 }) => ({ path, sha256 })),
    exampleTargets: EXAMPLE_TARGETS,
    runtimeNeutralInstruction:
      "Use slidesls skill show to read SKILL.md without installing; use slidesls skill show --all only as a full export fallback.",
  };
}

export const skillReferenceFiles = {
  catalog: "references/catalog.md",
  "style-directions": "references/style-directions.md",
  archetypes: "references/archetypes.md",
  motion: "references/motion.md",
  customization: "references/customization.md",
  qa: "references/qa.md",
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

export async function planSkillInstall({ targetDir, dryRun = false, force = false } = {}) {
  assertExplicitSkillTarget(targetDir);
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

  return {
    action: "install",
    source,
    target,
    dryRun,
    hasConflicts,
    warnings: await siblingSkillWarnings(target),
    files: planned,
  };
}

export async function performSkillInstall({ targetDir, dryRun = false, force = false } = {}) {
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
    await writeSkillManifest(plan.target, plan.source);
  }

  return withPostInstallDetails(summarizePlan({ ...plan, forced: force }), {
    includeNextSteps: !dryRun,
  });
}

export async function performSkillLink({ targetDir, force = false } = {}) {
  assertExplicitSkillTarget(targetDir);
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

  return withPostInstallDetails({
    action: "link",
    source,
    target,
    status,
    warnings: await siblingSkillWarnings(target),
    files: (await listSkillFiles(source)).map(({ path, sha256 }) => ({ path, sha256 })),
  });
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
    warnings: plan.warnings || [],
    files: plan.files.map(({ path, targetPath, sha256, status }) => ({
      path,
      targetPath,
      sha256,
      status,
    })),
  };
}

function assertExplicitSkillTarget(targetDir) {
  if (targetDir) return;
  const error = new Error(
    "Missing skill target directory. Choose the skill directory required by your agent runtime.",
  );
  error.code = "usage_error";
  error.exitCode = 2;
  error.hint = [
    "Example for Claude Code project-local skills:",
    "  slidesls skill install ./.claude/skills/create-slides-with-slidesls",
    "Runtime-neutral no-install option:",
    "  slidesls skill show",
  ].join("\n");
  throw error;
}

async function siblingSkillWarnings(target) {
  const parent = path.dirname(target);
  const legacyNames = ["slidesls", "create-slides"];
  const warnings = [];
  for (const name of legacyNames) {
    const sibling = path.join(parent, name);
    if (sibling === target || !(await exists(sibling))) continue;
    const manifestPath = path.join(sibling, ".slidesls-skill.json");
    const skillPath = path.join(sibling, "SKILL.md");
    if (await exists(manifestPath)) {
      warnings.push(
        `Found older likely slidesls skill directory at ${sibling}; consider replacing it with ${SKILL_NAME}.`,
      );
    } else if (await exists(skillPath)) {
      const markdown = await readFile(skillPath, "utf8");
      if (markdown.includes("slidesls"))
        warnings.push(
          `Found possible older slidesls skill directory at ${sibling}; check for duplicate active skills.`,
        );
    }
  }
  return warnings;
}

async function writeSkillManifest(target, source) {
  const pkg = await packageInfo();
  await writeText(
    path.join(target, ".slidesls-skill.json"),
    `${JSON.stringify(
      {
        package: pkg.name,
        version: pkg.version,
        skillName: SKILL_NAME,
        source,
      },
      null,
      2,
    )}\n`,
  );
}

function withPostInstallDetails(result, { includeNextSteps = true } = {}) {
  return {
    ...result,
    skillName: SKILL_NAME,
    ...(includeNextSteps
      ? {
          skillPath: path.join(result.target, "SKILL.md"),
          referencesPath: path.join(result.target, "references"),
          postInstallInstructions: POST_INSTALL_INSTRUCTIONS,
        }
      : {}),
  };
}
