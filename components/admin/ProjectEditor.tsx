"use client";

import { useEffect, useMemo, useState } from "react";
import type { Project } from "@/types/project";

type ProjectEditorProps = {
  initialProject?: Project;
};

export default function ProjectEditor({ initialProject }: ProjectEditorProps) {
  const [title, setTitle] = useState(initialProject?.title ?? "");
  const [status, setStatus] = useState(initialProject?.status ?? "draft");
  const [tags, setTags] = useState(initialProject?.tags.join(", ") ?? "");
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");

  const snapshot = useMemo(
    () => JSON.stringify({ title, status, tags }),
    [title, status, tags]
  );

  useEffect(() => {
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      // 실제 CMS 연결 단계에서 API 또는 DB 저장으로 교체합니다.
      window.localStorage.setItem("v3-project-editor-draft", snapshot);
      setSaveState("saved");
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [snapshot]);

  return (
    <form className="project-editor" onSubmit={(event) => event.preventDefault()}>
      <header className="editor-header">
        <div>
          <h1>{initialProject ? "프로젝트 수정" : "새 프로젝트"}</h1>
          <p>상태: {saveState === "saving" ? "자동 저장 중…" : "자동 저장됨"}</p>
        </div>
        <div className="editor-actions">
          {initialProject && <button type="button">프로젝트 복제</button>}
          <button type="button">미리보기</button>
        </div>
      </header>

      <div className="editor-grid">
        <section className="editor-panel">
          <h2>기본 정보</h2>
          <label>
            프로젝트명
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            상태
            <select value={status} onChange={(event) => setStatus(event.target.value as Project["status"])}>
              <option value="draft">작성 중</option>
              <option value="published">공개</option>
              <option value="private">비공개</option>
              <option value="trash">휴지통</option>
            </select>
          </label>
          <label>
            태그
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="모던, 미니멀, 34평"
            />
          </label>
        </section>

        <section className="editor-panel">
          <h2>이미지 관리</h2>
          <p>일괄 업로드, 드래그 정렬, 대표 이미지 지정 기능을 연결할 영역입니다.</p>
          <div className="image-manager-placeholder">
            <span>이미지 업로드</span>
            <span>드래그 순서 변경</span>
            <span>PC 대표 이미지 지정</span>
          </div>
        </section>

        <section className="editor-panel">
          <h2>SEO</h2>
          <label>SEO 제목<input defaultValue={initialProject?.seo.title ?? ""} /></label>
          <label>SEO 설명<textarea defaultValue={initialProject?.seo.description ?? ""} /></label>
          <label>OG 이미지<input defaultValue={initialProject?.seo.ogImage ?? ""} /></label>
        </section>

        <section className="editor-panel">
          <h2>버전 기록</h2>
          <p>수정 이력을 저장하고 이전 버전으로 복원할 수 있도록 설계합니다.</p>
          <ul>
            {(initialProject?.revisions ?? []).map((revision) => (
              <li key={revision.id}>{revision.createdAt} · {revision.note}</li>
            ))}
          </ul>
        </section>
      </div>
    </form>
  );
}
