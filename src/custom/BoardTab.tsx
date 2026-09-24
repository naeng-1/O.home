'use client';
// [커스텀] 게시판 연동 — 캐릭터·자관 프로필의 「게시글」 탭에서, 그 이름으로 태그된 게시판 글을
// 제목 + 본문 앞부분 미리보기로 보여준다. 갤러리 연동(GalleryTab.tsx)과 같은 태그 매칭 규칙을 쓴다.
//   태그 비교: 캐릭터/자관의 「이름」 또는 「주소 별명」과 같으면 연결 (앞의 #, 공백, 대소문자 무시)
// 공개범위:
//   1) 비밀글(secret) — 게시판 상세 화면과 같은 규칙: 작성자 본인 또는 관리자만 보임
//   2) 글이 속한 게시판의 메뉴 공개범위 — 메뉴·메인 위젯이 쓰는 canViewHref와 같은 기준
// 새 파일이라 원본을 업데이트해도 충돌하지 않는다.
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLocalList, BOARD_SEED, Post, fmtDate } from '@/lib/postStore';
import { useBoards, boardHref, MAIN_BOARD_ID } from '@/lib/boardStore';
import { useMenuSettings, canViewHref, extraBoardHref } from '@/lib/menuStore';

type Named = { name: string; slug?: string | null };

/** 태그·이름 비교용 — 앞의 #, 모든 공백을 지우고 소문자로 (갤러리 연동과 동일 규칙) */
const norm = (s: string) => s.replace(/^\s*#/, '').replace(/\s+/g, '').toLowerCase();

const PREVIEW_LEN = 90;

/** 본문(마크다운/HTML 섞임)에서 태그·서식을 걷어내고 순수 텍스트 미리보기만 뽑는다 */
function previewOf(body: string): string {
  const text = body
    .replace(/<[^>]+>/g, ' ')                 // HTML 태그
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')     // 마크다운 이미지
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')   // 마크다운 링크 — 글자만 남김
    .replace(/[#*`_>~-]/g, ' ')                // 마크다운 서식 기호
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > PREVIEW_LEN ? `${text.slice(0, PREVIEW_LEN)}…` : text;
}

/** 글 한 개 — 제목 + 미리보기, 누르면 원문으로 이동 */
function BoardItem({ p }: { p: Post }) {
  const href = `/board/${p.id}`;
  const preview = previewOf(p.body);
  return (
    <Link href={href} style={{ display: 'block', padding: '14px 0', borderBottom: '1px solid var(--line, rgba(128,128,128,.18))', textDecoration: 'none', color: 'inherit' }}>
      <b style={{ fontSize: 13.5 }}>{p.secret && '🔒 '}{p.title}</b>
      <small style={{ marginLeft: 8, color: 'var(--page-desc)' }}>{p.author} · {fmtDate(p.date)}</small>
      {preview && <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--page-desc)', lineHeight: 1.5 }}>{preview}</p>}
    </Link>
  );
}

/** 이 이름(또는 주소 별명)으로 태그된 게시판 글을 골라서 나열 */
function TaggedBoard({ target }: { target: Named }) {
  const { user, isAdmin } = useAuth();
  const [postsAll, , loaded] = useLocalList<Post>('ohome.board.v1', BOARD_SEED);
  const { boards, loaded: boardsLoaded } = useBoards();
  const [menuSet, , menuLoaded] = useMenuSettings();
  if (!loaded || !boardsLoaded || !menuLoaded) return null;

  const viewer = { loggedIn: !!user, isAdmin, id: user?.id };
  const keys = new Set([target.name, target.slug ?? ''].map(norm).filter(Boolean));
  const hits = postsAll
    .filter(p => (p.tags ?? []).some(t => keys.has(norm(t))))
    // 비밀글은 원래 게시판 규칙과 동일하게 — 작성자 본인 또는 관리자만
    .filter(p => !p.secret || isAdmin || (!!p.authorId && p.authorId === user?.id))
    .filter(p => {
      const bid = p.boardId ?? MAIN_BOARD_ID;
      const href = bid === MAIN_BOARD_ID ? '/board' : extraBoardHref(bid);
      return canViewHref(menuSet, href, viewer);
    })
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  if (hits.length === 0) {
    return (
      <p style={{ color: 'var(--page-desc)', fontSize: 13, padding: '24px 0' }}>
        아직 없습니다 — 게시판 글에 <b>#{target.name}</b> 태그를 붙이면 여기에 나타납니다
      </p>
    );
  }
  return <div>{hits.map(p => <BoardItem key={p.id} p={p} />)}</div>;
}

/** 캐릭터 프로필의 「게시글」 탭 내용 */
export function CharBoardTab({ char }: { char: Named }) {
  return (
    <>
      <h3 className="tab-tt">게시글</h3>
      <div className="sub" style={{ marginBottom: 14 }}>#{char.name}</div>
      <TaggedBoard target={char} />
    </>
  );
}

/** 자관 상세의 「게시글」 탭 내용 */
export function RelBoardTab({ rel }: { rel: Named }) {
  return (
    <div style={{ padding: '18px 6px 4px' }}>
      <TaggedBoard target={rel} />
    </div>
  );
}
