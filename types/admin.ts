export type AdminRole = "owner" | "editor" | "viewer";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
};

export type BackupManifest = {
  id: string;
  createdAt: string;
  projectCount: number;
  note: string;
};
