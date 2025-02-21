# GitHub-Action to automatically manage releases

Releases are being created or updated based on a semantic version in a file.
It will fail if a associated release is already published, code for a published release should not change anymore. Therefore the version has to be change manually.

Workflow:

1. Get latest releases (limit is 30 currently)
2. Check if release matching the version exists
3. Fails if a matching release has been published with different commit otherwise returns version (tag) and stops execution
4. Updates any existing release by modifying the tag and target commit
5. If none exist, it creates a draft
6. Returns version (tag) with build identifier (commit) as suffix

Assumptions:

- versions follow the SemVer spec
- every change contributes to a release
- the repo defines the lifecycle of a release

Todos:

- clean up code - despaghettify
