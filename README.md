# GitHub-Action to automatically manage releases

Releases are being created or updated based on a semantic version in a file.
It will fail if a associated release is already published, code for a published release should not change anymore. Therefore the version has to be change manually.

Workflow:

1. Get latest releases (limit is 30 currently)
2. Check if release matching the version exists
3. Fails if a matching release has been published
4. Updates any existing release by modifying the tag and target commit
5. If none exist, it creates a draft
