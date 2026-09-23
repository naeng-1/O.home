'use client';
// [커스텀] 비밀번호 잠금 공용 부품 — 캐릭터 「비밀 탭」과 자관 「타임라인 잠금」이 같이 쓴다.
// 관리자도 예외 없이 비밀번호를 입력해야 열린다 (요청에 따라 관리자 우회를 두지 않음).
// 한 번 맞히면 "이 화면을 새로고침하기 전까지"는 다시 묻지 않는다 (useState 기반 — 새로고침하면 다시 잠김).
// 비밀번호는 평문으로 저장된다 — 진짜 보안이 아니라 "가려 두는" 용도임을 감안할 것.
import React, { useState } from 'react';
import { KInput } from '@/components/ui/Kit';

/** 이 화면에서 푼 잠금 id 모음 — 탭이면 탭 id, 타임라인이면 'tl'처럼 고정 키를 쓰면 된다 */
export function useUnlockedSet(): [Set<string>, (id: string) => void] {
  const [set, setSet] = useState<Set<string>>(new Set());
  const unlock = (id: string) => setSet(prev => (prev.has(id) ? prev : new Set(prev).add(id)));
  return [set, unlock];
}

/** 비밀번호 입력 화면 — 맞으면 onUnlock을 부른다 (그 뒤 무엇을 보여줄지는 부르는 쪽이 정한다) */
export function PasswordGate({ password, onUnlock, label = '잠긴 내용입니다' }: {
  password?: string;
  onUnlock: () => void;
  label?: string;
}) {
  const [pw, setPw] = useState('');
  const [wrong, setWrong] = useState(false);

  const submit = () => {
    if (pw === (password ?? '')) { onUnlock(); setPw(''); setWrong(false); }
    else { setWrong(true); }
  };

  return (
    <div style={{ display: 'grid', gap: 10, maxWidth: 260, padding: '28px 4px' }}>
      <div style={{ fontSize: 13, color: 'var(--page-desc, var(--faint))' }}>🔒 {label}</div>
      <KInput
        type="password"
        value={pw}
        onChange={e => { setPw(e.target.value); setWrong(false); }}
        onKeyDown={e => { if (e.key === 'Enter') submit(); }}
        placeholder="비밀번호"
        autoFocus
      />
      <button className="btn btn-dark" style={{ justifySelf: 'start' }} onClick={submit}>확인</button>
      {wrong && <span style={{ fontSize: 12, color: '#a63a45' }}>비밀번호가 틀렸습니다</span>}
    </div>
  );
}

/** 잠금 표시용 작은 자물쇠 — 탭 아이콘 옆, 타임라인 카드 안 등에 붙여 쓴다 */
export function LockDot({ style }: { style?: React.CSSProperties }) {
  return <span aria-hidden style={{ fontSize: 9, verticalAlign: 'top', ...style }}>🔒</span>;
}

/** 잠금·비밀번호 입력칸 한 벌 — 편집 화면(탭 편집, 타임라인 기록 추가)에서 그대로 쓴다 */
export function LockFields({ locked, password, onLockedChange, onPasswordChange }: {
  locked: boolean;
  password: string;
  onLockedChange: (v: boolean) => void;
  onPasswordChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label className="k-check">
        <input type="checkbox" checked={locked} onChange={e => onLockedChange(e.target.checked)} />
        <span className="box" />
        <span>비밀번호로 잠그기</span>
      </label>
      {locked && (
        <KInput
          type="text"
          placeholder="비밀번호(영문/숫자/특수문자)"
          value={password}
          onChange={e => onPasswordChange(e.target.value)}
        />
      )}
    </div>
  );
}
