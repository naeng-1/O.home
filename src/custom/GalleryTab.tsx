'use client';
// [커스텀] 갤러리 연동 — 캐릭터·자관 프로필에서, 그 이름으로 태그된 갤러리 글을 바로 보여준다.
// 갤러리 글의 태그(BackupPost.tags)가 캐릭터/자관의 「이름」 또는 「주소 별명」과 같으면 연결된다.
//   (앞의 #, 공백, 대소문자는 무시)
// 공개범위는 두 겹으로 지킨다:
//   1) 글 자체의 공개범위 — 갤러리 목록과 같은 기준 (전체공개 / 멤버공개 / 나만보기)
//   2) 글이 속한 갤러리(섹션)가 메뉴에서 정한 공개범위 — 메뉴·메인 위젯이 쓰는 canViewHref와 같은 기준
// 접힘(스포일러·수위 주의) 글은 갤러리 목록처럼 가려 두고, 눌러야 대표 이미지가 보인다.
// 새 파일이라 원본을 업데이트해도 충돌하지 않는다.
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLocalList, fmtDate } from '@/lib/postStore';
import { BackupPost, BACKUP_SEED } from '@/lib/galleryStore';
import { useBlobUrl } from '@/lib/blobStore';
import { sectionHref, MAIN_SEC } from '@/lib/sectionStore';
import { useMenuSettings, canViewHref } from '@/lib/menuStore';

type Named = { name: string; slug?: string | null };

/** 태그·이름 비교용 — 앞의 #, 모든 공백을 지우고 소문자로 */
const norm = (s: string) => s.replace(/^\s*#/, '').replace(/\s+/g, '').toLowerCase();

const FOLD_LABEL: Record<string, string> = { spoiler: '스포일러', adult: '수위 주의' };

/** 글 한 개 — 대표(첫) 이미지를 크게, 누르면 갤러리 글로 이동 */
function GalleryItem({ p }: { p: BackupPost }) {
  const [open, setOpen] = useState(false);          // 접힘을 풀었는가
  const url = useBlobUrl(p.images[0]);
  const folded = !!p.fold && !open;
  const foldLabel = p.fold
    ? (p.fold.type === 'custom' ? (p.fold.label || '접힘') : (FOLD_LABEL[p.fold.type] ?? '접힘'))
    : '';
  const n = Math.max(p.images.length, p.phList.length);
  const href = `/gallery/${p.id}`;
  const frame: React.CSSProperties = { display: 'block', borderRadius: 10, overflow: 'hidden', background: 'rgba(128,128,128,.12)' };

  return (
    <div style={{ marginBottom: 24 }}>
      {folded ? (
        <div style={{ ...frame, aspectRatio: '16 / 9', display: 'grid', placeItems: 'center', textAlign: 'center', cursor: 'pointer' }}
          onClick={() => setOpen(true)}>
          <div><b>{foldLabel}</b><br /><small>클릭하여 표시</small></div>
        </div>
      ) : (
        <Link href={href} style={frame}>
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={p.title} loading="lazy"
              style={{ display: 'block', maxWidth: '100%', maxHeight: 640, margin: '0 auto' }} />
          ) : (
            <div className={`ph ${p.phList[0] ?? 'cool'}`} style={{ aspectRatio: '16 / 10' }}><span>IMAGE</span></div>
          )}
        </Link>
      )}
      <Link href={href} style={{ display: 'block', marginTop: 8, textDecoration: 'none', color: 'inherit' }}>
        <b style={{ fontSize: 13 }}>{p.title}</b>
        <small style={{ marginLeft: 8, color: 'var(--page-desc)' }}>{n}장 · {fmtDate(p.date)}</small>
      </Link>
    </div>
  );
}

/** 이 이름(또는 주소 별명)으로 태그된 글을 골라서 나열 */
function TaggedGallery({ target }: { target: Named }) {
  const { user, isAdmin } = useAuth();
  const [postsAll, , loaded] = useLocalList<BackupPost>('ohome.backup.v1', BACKUP_SEED);
  const [menuSet, , menuLoaded] = useMenuSettings();
  // 메뉴 설정을 다 읽기 전에는 그리지 않는다 — 안 그러면 비공개 갤러리 글이 잠깐 비쳤다 사라질 수 있다
  if (!loaded || !menuLoaded) return null;

  const viewer = { loggedIn: !!user, isAdmin, id: user?.id };
  const keys = new Set([target.name, target.slug ?? ''].map(norm).filter(Boolean));
  const hits = postsAll
    .filter(p => (p.tags ?? []).some(t => keys.has(norm(t))))
    // 1) 글 자체의 공개범위 — 갤러리 목록과 같은 기준
    .filter(p => isAdmin || p.visibility === 'public' || (p.visibility === 'member' && !!user))
    // 2) 글이 속한 갤러리(섹션)의 메뉴 공개범위
    .filter(p => canViewHref(menuSet, sectionHref('gallery', p.secId ?? MAIN_SEC), viewer))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));   // 최신 글이 위로

  if (hits.length === 0) {
    return (
      <p style={{ color: 'var(--page-desc)', fontSize: 13, padding: '24px 0' }}>
        {isAdmin
          ? <>아직 없습니다 — 갤러리 글에 <b>#{target.name}</b> 태그를 붙이면 여기에 나타납니다</>
          : '표시할 갤러리 글이 없습니다'}
      </p>
    );
  }
  return <div>{hits.map(p => <GalleryItem key={p.id} p={p} />)}</div>;
}

/** 캐릭터 프로필의 「갤러리」 탭 내용 */
export function CharGalleryTab({ char }: { char: Named }) {
  return (
    <>
      <h3 className="tab-tt">갤러리</h3>
      <div className="sub" style={{ marginBottom: 14 }}>#{char.name}</div>
      <TaggedGallery target={char} />
    </>
  );
}

/** 자관 상세의 「GALLERY」 탭 내용 */
export function RelGalleryTab({ rel }: { rel: Named }) {
  return (
    <div style={{ padding: '18px 6px 4px' }}>
      <TaggedGallery target={rel} />
    </div>
  );
}
