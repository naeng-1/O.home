'use client';
// 자관 등록 페이지 (4.5) — 상대 캐릭터는 등록 후 상세에서 추가
// [커스텀] 여러 개로 만든 자관 목록 지원 — 캐릭터 등록(chars/new/page.tsx)과 같은 방식.
//          바뀐 곳은 「[커스텀]」 주석으로 표시해 두었다 (업데이트 충돌 시 이 줄들만 다시 붙이면 된다)
import React, { Suspense } from 'react';   // [커스텀] Suspense 추가
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLocalList, newId } from '@/lib/postStore';
import { Character, CHAR_SEED, Relation, REL_SEED, RelMember } from '@/lib/charStore';
import { useSectionParam, secStamp, secQuery, useSectionTitle } from '@/lib/sectionStore';   // [커스텀]
import { RelForm } from '@/components/rels/RelForm';
import { useToast } from '@/components/ui/Toast';
import { PageTitle, EditableDesc } from '@/components/ui/PageText';

function RelNewInner() {   // [커스텀] 이름 변경 (아래에서 Suspense로 감싼다)
  const router = useRouter();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [rels, setRels, loaded] = useLocalList<Relation>('ohome.rels.v1', REL_SEED);
  const [chars] = useLocalList<Character>('ohome.chars.v1', CHAR_SEED);
  // [커스텀] 어느 자관 목록에서 눌러 왔는지 + 큰 제목(추가 목록이면 그 이름)
  const sec = useSectionParam('rels');
  const tt = useSectionTitle('rels', sec.id, 'ADD RELATION');

  if (!loaded) return <section className="page" />;
  if (!isAdmin) {
    return (
      <section className="page">
        <div className="page-head"><PageTitle href={tt.href}>{tt.title}</PageTitle><p>관리자 전용</p></div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-head">
        <PageTitle href={tt.href}>{tt.title}</PageTitle>
        <EditableDesc k="rels-new-desc" def="자관 등록 — 상대 캐릭터는 페이지를 만든 뒤 상세에서 추가할 수 있습니다" />
      </div>
      <RelForm
        initial={null}
        myChars={chars.filter(c => c.own)}
        existingIds={rels.flatMap(r => [r.id, ...(r.slug ? [r.slug] : [])])}
        onCancel={() => router.push('/rels' + secQuery('rels', sec.id))}   // [커스텀] 그 목록으로 돌아가기
        onSave={v => {
          // 팔레트는 캐릭터 쪽을 상세에서 그대로 읽는다 — 여기서 복사해 두면 나중에 캐릭터 색을
          // 바꿔도 자관이 따라오지 않는다 (v2.0 — 상세 페이지와 같은 규칙으로 통일)
          const members: RelMember[] = v.pickedCharIds.map(cid =>
            ({ charId: cid, quote: '', keywords: [], desc: '', palette: [] }));
          const rel: Relation = {
            id: v.slug ?? newId(),   // 지정한 페이지 주소 (v1.9) — 비우면 자동
            name: v.name, catchphrase: v.catchphrase, kind: v.kind,
            fontId: v.fontId, bodyFontId: v.bodyFontId, visibility: v.visibility,
            arts: v.arts, thumbId: v.arts[0], thumbCrop: v.thumbCrop,
            headerImgId: v.headerImgId, headerCrop: v.headerCrop,
            themeMode: v.themeMode, themeColor: v.themeColor, themeTone: v.themeTone,
            illuBg: v.illuBg, illuOn: v.illuOn,
            nameColor: v.nameColor, cpColor: v.cpColor, cpTagBg: v.cpTagBg, cpTagFg: v.cpTagFg,
            nameShadowColor: v.nameShadowColor, nameShadow: v.nameShadow,
            headerBgG1: v.headerBgG1, headerBgG2: v.headerBgG2, headerBgAngle: v.headerBgAngle,
            pageBgG1: v.pageBgG1, pageBgG2: v.pageBgG2, pageBgAngle: v.pageBgAngle,
            members, thumbClass: '',
            illustMode: v.kind === 'pair' ? 'duo' : 'one',
            aus: [{ id: 'base', label: '원본', catchphrase: v.catchphrase }],
            timeline: [], questions: [],
            ...secStamp(sec.id),   // [커스텀] 이 자관이 어느 목록 소속인지 표시 (기본 목록이면 아무것도 안 붙음)
          };
          setRels([...rels, rel]);
          toast('자관이 등록되었습니다 — 상대 캐릭터·한마디 등은 상세에서 이어서');
          router.push(`/rels/${rel.id}`);
        }}
      />
    </section>
  );
}

// [커스텀] useSearchParams는 Suspense 경계 필요 (Next App Router) — 캐릭터 등록과 같은 방식
export default function RelNewPage() {
  return <Suspense fallback={<section className="page" />}><RelNewInner /></Suspense>;
}
