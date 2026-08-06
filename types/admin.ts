export type AdminRole = "owner" | "editor" | "viewer";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
};

