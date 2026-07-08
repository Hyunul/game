// ep4 「사라진 목소리」 테이프 구간 — 해금/클린 모드는 solved 배열 파생 (저장 스키마 무변경)
export interface TapeSegment {
  id: string;
  /** 데크 카운터 표시값 (세 자리 문자열) */
  counter: string;
  label: string;
  /** 이 퍼즐이 풀려 있어야 구간 재생 가능 */
  unlockedBy: string;
  /** 기본 재생 자막 (노이즈 낀 상태) */
  script: string[];
  /** 클린 모드(ep4-eq)에서 추가로 들리는 줄 — 삽입 위치는 index */
  cleanInserts?: { at: number; line: string }[];
}

export const TAPE_SEGMENTS: TapeSegment[] = [
  {
    id: 'seg-042', counter: '042', label: '자장가', unlockedBy: 'ep4-counter',
    script: [
      '…(지직)… 자장자장 우리 아가…',
      '(잔기침) …자장자장, 잘도 잔다…',
      '오늘은 여기까지 하자. …(테이프 멈추는 소리)',
    ],
    cleanInserts: [
      { at: 2, line: '(기침 사이 — 길게 멈춘 숨. 노래를 잇기까지 한참이 걸린다)' },
      { at: 3, line: '"…테이프가 모자라네. 다음 장은 더 아껴 불러야겠다."' },
    ],
  },
  {
    id: 'seg-118', counter: '118', label: '골방 이야기', unlockedBy: 'ep4-radio',
    script: [
      '"엄마 골방에 올 땐, 이렇게 두드리렴. 쿵, 쿵, 콩콩, 쿵."',
      '"장, 장, 단, 단, 장 — 우리 둘만의 신호야."',
    ],
  },
  {
    id: 'seg-audition', counter: '203', label: '오디션 녹음 (복원)', unlockedBy: 'ep4-splice',
    script: [
      '"수험번호 열넷, 은방울입니다."',
      '(맑고 또렷한 목소리 — 지금까지 들은 어떤 테이프보다 젊다)',
      '"…비 오는 날의 라디오처럼, 곁에 있는 목소리가 되고 싶습니다."',
    ],
  },
  {
    id: 'seg-last', counter: '387', label: '되감다 만 테이프', unlockedBy: 'ep4-lasttape',
    script: [
      '(테이프 끝, 갈라진 목소리) "…여기까지 남기면… 스물, 서른…"',
      '"다 못 남겨서 미안해."',
      '"나머지 노래는… 네가 불러주렴. 엄마 몫까지."',
    ],
  },
];

export function isCleanMode(solved: string[]): boolean {
  return solved.includes('ep4-eq');
}

export function isSegmentUnlocked(segId: string, solved: string[]): boolean {
  const seg = TAPE_SEGMENTS.find((s) => s.id === segId);
  return !!seg && solved.includes(seg.unlockedBy);
}

/** 현재 solved 상태에서 들리는 자막 줄 (클린 모드면 cleanInserts 병합) */
export function segmentLines(segId: string, solved: string[]): string[] {
  const seg = TAPE_SEGMENTS.find((s) => s.id === segId);
  if (!seg || !isSegmentUnlocked(segId, solved)) return [];
  if (!isCleanMode(solved) || !seg.cleanInserts) return [...seg.script];
  const lines = [...seg.script];
  // at이 큰 것부터 삽입해 인덱스가 밀리지 않게
  [...seg.cleanInserts].sort((a, b) => b.at - a.at).forEach((ins) => lines.splice(ins.at, 0, ins.line));
  return lines;
}
