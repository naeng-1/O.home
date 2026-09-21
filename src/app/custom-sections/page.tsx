'use client';
// [커스텀] 목록 만들기 화면 — 캐릭터·자관 등을 「여러 개의 목록」으로 만들고 이름·주소 별명을 정한다.
// 원본에는 이 화면이 없어서(sectionStore의 add/setList를 부르는 곳이 없음) 새로 만들었다.
// 새 파일이라 원본을 업데이트해도 충돌하지 않는다. 주소: /custom-sections (관리자 전용)
// 여기서 만든 목록은 「메뉴 관리」 아래쪽 「미배치 기능」에 나타난다 — 거기서 원하는 상위 메뉴에 넣는다.
import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import { PageTitle } from '@/components/ui/PageText';
import { LiveInput } from '@/components/ui/Kit';
import {
  useSections, cleanSlug, SECTION_KINDS, SECTION_META, MAIN_SEC,
  type SectionKind, type SectionItem,
} from '@/lib/sectionStore';

// 캐릭터·자관을 위에 (나머지는 원래 순서)
const FIRST: string[] = ['chars', 'rels'];
const KINDS = [...SECTION_KINDS].sort((a, b) => Number(!FIRST.includes(a)) - Number(!FIRST.includes(b)));

const line: React.CSSProperties = { borderBottom: '1px dashed rgba(128,128,128,.3)', padding: '14px 0' };
const dim: React.CSSProperties = { color: 'var(--page-desc)', fontSize: 13 };

/** 목록 한 줄 — 이름·주소 별명을 고쳐서 [저장]을 눌러야 반영된다 (글자마다 저장하지 않게 초안으로 둔다) */
function SectionRow({ kind, item, others, onSave, onRemove }: {
  kind: SectionKind;
  item: SectionItem;
  others: SectionItem[];
  onSave: (patch: { name: string; slug?: string }) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [slug, setSlug] = useState(item.slug ?? '');
  const [askDel, setAskDel] = useState(false);

  const cleaned = cleanSlug(slug);
  // 다른 목록의 id·별명, 기본 목록(main)과 겹치면 주소가 엉킨다
  const clash = !!cleaned && (cleaned === MAIN_SEC
    || others.some(o => o.id === cleaned || (o.slug ?? '') === cleaned));
  const changed = name.trim() !== item.name || cleaned !== (item.slug ?? '');
  const canSave = changed && name.trim().length > 0 && !clash;
  const url = `${SECTION_META[kind].href}?s=${cleaned || item.id}`;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '8px 0' }}>
      <LiveInput value={name} onValue={setName} placeholder="목록 이름" style={{ width: 180 }} />
      <LiveInput value={slug} onValue={setSlug} placeholder="주소 별명 (영문·숫자, 선택)" style={{ width: 210 }} />
      <span style={{ ...dim, minWidth: 150 }}>
        {clash ? '이미 쓰는 별명입니다' : url}
      </span>
      <button className="btn btn-dark" disabled={!canSave}
        onClick={() => onSave({ name: name.trim(), slug: cleaned || undefined })}>저장</button>
      {askDel
        ? (
          <>
            <button className="btn btn-dark" onClick={onRemove}>정말 삭제</button>
            <button className="btn" onClick={() => setAskDel(false)}>취소</button>
          </>
        )
        : <button className="btn" onClick={() => setAskDel(true)}>삭제</button>}
    </div>
  );
}

export default function CustomSectionsPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const { map, list, setList, add } = useSections();

  if (!isAdmin) {
    return (
      <section className="page">
        <div className="page-head"><PageTitle>SECTIONS</PageTitle><p>관리자 전용</p></div>
      </section>
    );
  }

  // 저장된 원본 목록(기본 목록 표시 제외)을 고쳐서 통째로 다시 저장한다
  const save = (kind: SectionKind, id: string, patch: { name: string; slug?: string }, slugChanged: boolean) => {
    const stored = map[kind] ?? [];
    setList(kind, stored.map(s => (s.id === id ? { ...s, name: patch.name, slug: patch.slug } : s)));
    toast(slugChanged
      ? '저장했습니다 — 주소 별명을 바꿨다면 메뉴에서 빠졌을 수 있어요. 메뉴 관리의 미배치에서 다시 넣어 주세요'
      : '저장했습니다');
  };
  const remove = (kind: SectionKind, id: string) => {
    setList(kind, (map[kind] ?? []).filter(s => s.id !== id));
    toast('목록을 삭제했습니다 — 안에 있던 글·캐릭터 데이터는 남아 있습니다');
  };

  return (
    <section className="page">
      <div className="page-head">
        <PageTitle>SECTIONS</PageTitle>
        <p style={dim}>
          같은 기능의 목록을 여러 개로 만듭니다. 만든 목록은 <b>메뉴 관리 → 미배치 기능</b>에 나타나니, 거기서 원하는 상위 메뉴에 넣으세요.
          주소 별명은 <b>메뉴에 넣기 전에</b> 정해 두세요 — 나중에 바꾸면 메뉴에서 빠집니다.
        </p>
      </div>

      {KINDS.map(kind => {
        const items = list(kind);
        const extras = items.filter(s => s.id !== MAIN_SEC);
        return (
          <div key={kind} style={line}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <b style={{ fontSize: 16 }}>{SECTION_META[kind].label}</b>
              <span style={dim}>{SECTION_META[kind].href}</span>
              <button className="btn btn-dark" onClick={() => add(kind)}>＋ 목록 추가</button>
            </div>
            <p style={{ ...dim, margin: '6px 0 0' }}>기본 목록: {SECTION_META[kind].href} (원래 있던 페이지)</p>
            {extras.length === 0 && <p style={{ ...dim, margin: '6px 0 0' }}>추가한 목록이 없습니다</p>}
            {extras.map(s => (
              <SectionRow key={s.id} kind={kind} item={s}
                others={items.filter(o => o.id !== s.id)}
                onSave={patch => save(kind, s.id, patch, (patch.slug ?? '') !== (s.slug ?? ''))}
                onRemove={() => remove(kind, s.id)} />
            ))}
          </div>
        );
      })}
    </section>
  );
}
