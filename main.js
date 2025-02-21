import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";

export async function run() {
  try {
    const githubToken = core.getInput("token", { required: true });
    const path = core.getInput("path", { trimWhitespace: true });
    const prefix = core.getInput("prefix", { trimWhitespace: true });
    const preRelease = core.getInput("pre-release", { trimWhitespace: true });
    const fail = core.getBooleanInput("fail", { trimWhitespace: true });

    core.info(`Will read version from '${path}'`);
    core.info(`Releases will be prefixed with '${prefix}'`);

    const currentVersion = await readVersion(path);
    const outputVersion = await updateOrCreateRelease(
      currentVersion,
      prefix,
      preRelease || false,
      githubToken
    );

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

async function updateOrCreateRelease(
  version,
  prefix,
  preReleaseIdentifier,
  githubToken
) {
  const kit = github.getOctokit(githubToken);

  const releaseName = `${prefix}${version}`;
  let tagName = preReleaseIdentifier
    ? `${releaseName}-${preReleaseIdentifier}`
    : releaseName;

  const releases = (
    await kit.rest.repos.listReleases({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      page: 1,
      per_page: 30,
    })
  )?.data;

  let release = releases.find((r) => r.tag_name == tagName);

  if (release?.published_at) {
    core.info(`Release ${releaseName} already published.`);

    if (release.target_commitish != github.context.sha) {
      throw new Error("Release already published with different commit.");
    }

    return tagName;
  }

  if (!release) {
    core.info(`Creating release ${releaseName}`);

    const response = await kit.rest.repos.createRelease({
      name: releaseName,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      tag_name: tagName,
      prerelease: !!preReleaseIdentifier,
      draft: true,
      target_commitish: github.context.sha,
    });
    release = response.data;
  } else {
    core.info(`Updating release ${releaseName}`);

    await kit.rest.repos.updateRelease({
      release_id: release.id,
      owner: github.context.repo.owner,
      prerelease: !!preReleaseIdentifier,
      repo: github.context.repo.repo,
      tag_name: releaseName,
      target_commitish: github.context.sha,
    });
  }

  return `${tagName}+${github.context.sha}`;
}
