[CHANGES.md](https://github.com/user-attachments/files/32463944/CHANGES.md)
# 내가 원본 파일에 손댄 곳 (업데이트 충돌 시 참고)

이 파일은 `src/custom/CHANGES.md` 로 저장소에 올려 두세요. (원본에 없는 새 파일이라 충돌 없음)
원본을 업데이트(Sync fork)했을 때 아래 파일에서 충돌이 나면:
**① 원본(업스트림) 쪽 내용을 살리고 → ② 아래 목록의 변경만 다시 붙이면 됩니다.**
파일 안에 `[커스텀]` 이라고 적어 둔 줄이 전부 내가 바꾼 곳입니다.

## 자관 목록을 여러 개로 만들기 (캐릭터 목록 방식과 동일)

| 파일 | 바뀐 내용 |
|---|---|
| `src/lib/sectionStore.tsx` | `SectionKind` 끝에 `\| 'rels'` 추가 + `SECTION_META`에 자관 한 줄 추가 |
| `src/lib/charStore.ts(x)` | `interface Relation` 안에 `secId?: string;` 한 줄 추가 (`Character`의 `secId`를 참고) |
| `src/app/rels/page.tsx` | 자관 목록 — `[커스텀]` 줄들 (섹션 걸러내기, 저장 함수, 제목, ADD 버튼, Suspense) |
| `src/app/rels/new/page.tsx` | 자관 등록 — `[커스텀]` 줄들 (`secStamp`, 제목, 돌아가기, Suspense) |

### sectionStore.tsx 에 넣는 두 줄

```ts
// 1) SectionKind 타입 맨 끝
  | 'gallery' | ... | 'sched' | 'chars' | 'rels';

// 2) SECTION_META 맨 끝 (chars 줄 바로 아래)
  rels:     { label: '자관',      href: '/rels',     defName: '자관' },
```

### charStore 에 넣는 한 줄

```ts
// interface Relation { ... } 안쪽 아무 곳
  secId?: string;
```

## 충돌 났을 때 순서

1. 충돌 표시(`<<<<<<<`) 가 있는 파일을 열어 **위쪽/아래쪽 중 원본 쪽을 남기고** 표시를 지웁니다.
2. 위 표의 해당 파일 변경을 다시 적용합니다. (자관 목록·등록 페이지는 `[커스텀]` 주석 줄을 참고)
3. 원본 작성자가 나중에 자관 목록 여러 개 기능을 직접 넣었다면, 위 변경을 전부 버리고 원본 것을 쓰면 됩니다.
