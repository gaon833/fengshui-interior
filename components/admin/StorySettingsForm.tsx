"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { defaultStoryContent, imageFileToDataUrl, fetchPageContent, readLocalContent, saveLocalContent, savePageContent, STORY_CONTENT_KEY, type StoryContent } from "@/lib/page-content";
import { showAdminToast } from "@/lib/admin-toast";
import { IMAGE_GUIDES, guideText, confirmImageRatio } from "@/lib/image-guidelines";
import AdminFilePicker from "@/components/admin/AdminFilePicker";

export default function StorySettingsForm() {
  const [form, setForm] = useState<StoryContent>(defaultStoryContent);
  useEffect(() => { const local=readLocalContent(STORY_CONTENT_KEY, defaultStoryContent); setForm(local); void fetchPageContent("story", STORY_CONTENT_KEY, defaultStoryContent, true).then(setForm); }, []);
  const update = (key: keyof StoryContent, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { if (!(await confirmImageRatio(file, IMAGE_GUIDES.story))) { event.target.value = ""; return; } update("image", await imageFileToDataUrl(file)); showAdminToast("대표 이미지가 업로드되었습니다. 저장 버튼을 눌러 적용하세요.", "success"); }
    catch (error) { showAdminToast(error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.", "error"); }
  };
  const save = async (event: FormEvent) => { event.preventDefault(); try { const stored=await savePageContent("story", STORY_CONTENT_KEY, form); setForm(stored); showAdminToast("OUR STORY가 D1/R2에 저장되었습니다.", "success"); } catch(error){ showAdminToast(error instanceof Error?error.message:"서버 저장에 실패했습니다.","error"); } };
  const reset = async () => { if (!window.confirm("OUR STORY 내용을 기본값으로 복원할까요?")) return; try { const stored=await savePageContent("story",STORY_CONTENT_KEY,defaultStoryContent);setForm(stored);showAdminToast("OUR STORY가 서버 기본값으로 복원되었습니다.","success"); } catch(error){showAdminToast(error instanceof Error?error.message:"복원에 실패했습니다.","error");} };
  return <form onSubmit={save}>
    <div className="editor-grid">
      <section className="editor-panel"><h2>회사 소개</h2>
        <label>페이지 제목<input value={form.pageTitle} onChange={(e)=>update("pageTitle",e.target.value)} /></label>
        <label>브랜드 소개<textarea value={form.introduction} onChange={(e)=>update("introduction",e.target.value)} /></label>
        <label>대표 이미지 <span className="admin-image-guide">{guideText(IMAGE_GUIDES.story)}</span><input value={form.image} onChange={(e)=>update("image",e.target.value)} placeholder="/images/studio-cover.jpg" /><AdminFilePicker onChange={upload} help="클릭하여 대표 이미지를 선택하세요" />{form.image ? <span className="admin-upload-preview"><img src={form.image} alt="OUR STORY 대표 이미지 미리보기" /></span> : null}</label>
      </section>
      <section className="editor-panel"><h2>브랜드 철학</h2>
        <label>철학 제목<input value={form.philosophyTitle} onChange={(e)=>update("philosophyTitle",e.target.value)} /></label>
        <label>철학 내용<textarea value={form.philosophyBody} onChange={(e)=>update("philosophyBody",e.target.value)} /></label>
      </section>
    </div>
    <div className="admin-form-actions"><button type="submit">저장</button><button type="button" onClick={()=>void reset()}>기본값 복원</button></div>
  </form>;
}
