// GitHub API response types
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  starred_at: string;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  html_url: string;
  published_at: string | null;
  created_at: string;
  prerelease: boolean;
}

export interface RepositoryWithRelease {
  repository: GitHubRepository;
  release: GitHubRelease | null;
}

// Configuration
export interface SyncConfig {
  githubToken: string;
  notionToken: string;
  notionDatabaseId: string;
  githubUsername?: string;
}
