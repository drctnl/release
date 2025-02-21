import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";

export async function run() {
  try {
    const githubToken = core.getInput("github-token") || process.env.GITHUB_TOKEN;
    const path = core.getInput("path");
    const prefix = core.getInput("prefix");

    core.info(`Will read version from '${path}'`);
    core.info(`Releases will be prefixed with '${prefix}'`);

    if (!githubToken) {
      throw new Error("Missing github-token input.");
    }

    const currentVersion = await readVersion(path);
    const outputVersion = await updateOrCreateRelease(currentVersion, prefix, githubToken);

    core.setOutput("version", outputVersion);

  } catch (error) {
    core.setFailed(error.message);
    core.debug(error.stack);
  }
}

async function readVersion(path) {
  core.info(`Reading version from "${path}"`);
  const content = await fs.readFileSync(path, { encoding: "utf-8" });
  return content.trim();
}

async function updateOrCreateRelease(version, prefix, githubToken) {
  const releaseName = `${prefix}${version}`;
  const kit = github.getOctokit(githubToken, {
    "userAgent": "github-actions-release",
  });

  const releases = (await kit.rest.repos.listReleases({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    page: 1,
    per_page: 30,
  }))?.data;

  let release = releases.find((r) => r.name == releaseName);

  if (release?.published_at) {
    throw new Error(`Release ${releaseName} already published.`);
  }

  if (!release) {
    core.info(`Creating release ${releaseName}`);

    const response = await kit.rest.repos.createRelease({
      name: releaseName,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      tag_name: releaseName,
      draft: true,
      target_commitish: github.context.sha,
    });
    release = response.data;
  } else {
    core.info(`Updating release ${releaseName}`);

    await kit.rest.repos.updateRelease({
      release_id: release.id,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      tag_name: releaseName,
      target_commitish: github.context.sha,
    });
  }

  if (release?.draft) {
    return `${releaseName}+${github.context.sha}`;
  }

  return releaseName;
}
