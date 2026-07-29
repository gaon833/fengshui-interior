import users from "@/content/admin-users.json";

const roleLabel = {
  owner: "최고 관리자",
  editor: "편집자",
  viewer: "읽기 전용",
} as const;

export default function UsersPage() {
  return (
    <>
      <h1>사용자 권한</h1>
      <div className="admin-table">
        {users.map((user) => (
          <div className="admin-row" key={user.id}>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
            <span>{roleLabel[user.role as keyof typeof roleLabel]}</span>
          </div>
        ))}
      </div>
    </>
  );
}
