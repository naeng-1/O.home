'use client';
// EditableDesc 주입
// 자관 리스트 (4.5) — 4:3 가로 썸네일 · 공개범위 3단계 · 멤버 색 점
// [커스텀] 여러 개로 만든 자관 목록 지원 — 캐릭터 목록(chars/page.tsx)과 같은 방식.
//          바뀐 곳은 「[커스텀]」 주석으로 표시해 두었다 (업데이트 충돌 시 이 줄들만 다시 붙이면 된다)
import React, { Suspense, useState } from 'react';   // [커스텀] Suspense 추가
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLocalList } from '@/lib/postStore';
import { Relation, REL_SEED, Character, CHAR_SEED, relPath } from '@/lib/charStore';
import { useSectionParam, filterSection, sectionSetter, secQuery } from '@/lib/sectionStore';   // [커스텀]
import { SearchBar } from '@/components/ui/Kit';
import { useToast } from '@/components/ui/Toast';
import { CroppedBlobImg } from '@/components/ui/CropEditor';
import { EditableDesc, PageTitle } from '@/components/ui/PageText';
import { useMainStore } from '@/lib/mainStore';
import { useCardSort, mergeOrder } from '@/lib/cardSort';

function RelsInner() {   // [커스텀] 이름 변경 (아래에서 Suspense로 감싼다)
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const { editOn } = useMainStore();
  // [커스텀] 전체 자관을 받고, 주소의 ?s= 가 가리키는 목록 것만 걸러서 쓴다
  const [relsAll, setRelsAll] = useLocalList<Relation>('ohome.rels.v1', REL_SEED);
  const sec = useSectionParam('rels');
  const rels = filterSection(relsAll, sec.id);
  // 저장은 이 목록 자리만 교체 — 다른 목록의 자관이 지워지지 않는다
  const setRels = sectionSetter(relsAll, sec.id, setRelsAll);
  const [chars] = useLocalList<Character>('ohome.chars.v1', CHAR_SEED);
  const [q, setQ] = useState('');

  const colorOf = (id: string) => chars.find(c => c.id === id)?.color ?? '#666';
  const visible = rels
    .filter(r => isAdmin || r.visibility !== 'private')
    .filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()));

  // 편집모드 카드 드래그 정렬 (v1.9)
  const sort = useCardSort(visible, next => setRels(mergeOrder(rels, next)), editOn && isAdmin);

  return (
    <section className="page">
      <div className="page-head">
        {/* [커스텀] 추가 목록이면 그 이름을 큰 제목으로 */}
        <PageTitle>{sec.id === 'main' ? 'RELATIONS' : sec.name}</PageTitle>
        <EditableDesc k="rels-desc" def="자관 목록 · 4:3 가로 썸네일 · 공개범위: 전체공개/멤버공개/나만보기" />
        <div className="head-actions">
          <SearchBar onSearch={setQ} />
          {/* [커스텀] 등록 페이지로 갈 때 지금 목록을 달고 간다 */}
          {isAdmin && <button className="btn btn-dark" onClick={() => router.push('/rels/new' + secQuery('rels', sec.id))}>＋ ADD RELATION</button>}
        </div>
      </div>
      <div className="g3 rels-grid">
        {visible.map((r, i) => {
          const memberLocked = r.visibility === 'member' && !user;
          const priv = r.visibility === 'private';
          const sp = sort(i) as { style?: React.CSSProperties };
          return (
            <div key={r.id} className="rel-card" {...sort(i)}
              style={{ ...(priv ? { opacity: .45 } : undefined), ...sp.style }}
              onClick={() => {
                if (editOn) return;
                if (memberLocked) { toast('멤버공개 — 로그인 후 열람할 수 있습니다'); return; }
                router.push(relPath(r));
              }}>
              <div className="thumb" style={{ position: 'relative' }}>
                <CroppedBlobImg fileRef={r.thumbId} crop={r.thumbCrop} ph={r.thumbClass}
                  label={priv ? '나만보기' : memberLocked ? '멤버공개' : '4:3'} />
              </div>
              <div className="nm">
                {/* 리스트에서는 기본 폰트로 통일 — 개별 이름 폰트는 상세에서만 */}
                <b>
                  {r.name}
                  {r.visibility === 'member' && <span className="pill" style={{ marginLeft: 6 }}>멤버</span>}
                </b>
                <span>
                  {priv ? '관리자에게만 표시됨'
                    : memberLocked ? '로그인 시 열람 가능'
                    : `${r.catchphrase.replace(/ /g, '')} · ${r.members.length}인`}
                </span>
                {r.members.length > 0 && (
                  <div className="who">
                    {r.members.map(m => <i key={m.charId} style={{ background: colorOf(m.charId) }} />)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// [커스텀] useSearchParams는 Suspense 경계 필요 (Next App Router) — 캐릭터 목록과 같은 방식
export default function RelsPage() {
  return <Suspense fallback={<section className="page" />}><RelsInner /></Suspense>;
}
