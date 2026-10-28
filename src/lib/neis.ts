/* 나이스 교육정보 개방포털에서 학교 학사일정을 불러옵니다.
   달력에만 보여 주고, 마감 목록에는 넣지 않습니다.
   - 토요휴업일은 매주 있으므로 뺍니다.
   - 방학은 며칠씩 이어지므로 시작일과 마지막 날만 남깁니다.
   - 일부 학년만 해당하면 이름 뒤에 학년을 붙입니다. */

import type { Notice } from "@/config/departments";
import { SCHOOL } from "@/config/school";

type NeisRow = {
  AA_YMD: string;
  EVENT_NM: string;
  EVENT_CNTNT?: string | null;
  ONE_GRADE_EVENT_YN?: string;
  TW_GRADE_EVENT_YN?: string;
  THREE_GRADE_EVENT_YN?: string;
};

const SKIP = new Set(["토요휴업일"]);

function compact(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}${m}${d}`;
}

/* "20261001" 을 "2026-10-01" 로 바꿉니다. */
function dashed(ymd: string) {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

function toDate(ymd: string) {
  return new Date(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8)));
}

/* 방학 날짜에는 주말과 공휴일이 빠져 있어서, 나흘까지 비는 것은 이어진 것으로 봅니다. */
function closeEnough(prev: string, next: string) {
  const gap = (toDate(next).getTime() - toDate(prev).getTime()) / 86400000;
  return gap <= 4;
}

function withGrades(row: NeisRow) {
  const flags = [row.ONE_GRADE_EVENT_YN, row.TW_GRADE_EVENT_YN, row.THREE_GRADE_EVENT_YN];
  if (flags.every(f => f === "Y") || flags.every(f => f !== "Y") || row.EVENT_NM.includes("학년")) {
    return row.EVENT_NM;
  }
  const grades = flags.map((f, i) => (f === "Y" ? i + 1 : 0)).filter(Boolean);
  return `${row.EVENT_NM}(${grades.join("·")}학년)`;
}

/* 같은 이름이 날짜가 끊기지 않고 이어지면 한 덩어리로 봅니다.
   방학만 첫날과 마지막 날로 줄이고, 시험처럼 날마다 의미가 있는 일정은 그대로 둡니다. */
function toNotices(rows: NeisRow[]): Notice[] {
  const sorted = rows
    .filter(r => r.AA_YMD && r.EVENT_NM && !SKIP.has(r.EVENT_NM))
    .sort((a, b) => a.AA_YMD.localeCompare(b.AA_YMD));

  const out: Notice[] = [];
  const used = new Set<number>();

  sorted.forEach((row, i) => {
    if (used.has(i)) return;
    const title = withGrades(row);

    /* "여름방학식" 같은 행사는 하루짜리이므로 이름이 "방학"으로 끝나는 것만 줄입니다. */
    if (row.EVENT_NM.endsWith("방학")) {
      let last = row.AA_YMD;
      for (let k = i + 1; k < sorted.length; k++) {
        if (sorted[k].EVENT_NM !== row.EVENT_NM) continue;
        if (sorted[k].AA_YMD === last) {
          used.add(k);
          continue;
        }
        if (!closeEnough(last, sorted[k].AA_YMD)) break;
        last = sorted[k].AA_YMD;
        used.add(k);
      }
      out.push({ id: `neis-${row.AA_YMD}-${title}`, due: dashed(row.AA_YMD), dept: "나이스", title: `${title} 시작` });
      if (last !== row.AA_YMD) {
        out.push({ id: `neis-${last}-${title}-end`, due: dashed(last), dept: "나이스", title: `${title} 끝` });
      }
      return;
    }

    out.push({
      id: `neis-${row.AA_YMD}-${title}-${i}`,
      due: dashed(row.AA_YMD),
      dept: "나이스",
      title,
      detail: row.EVENT_CNTNT ?? undefined
    });
  });

  return out;
}

/* 오늘을 가운데 두고 앞뒤 1년 치를 한 번에 받습니다. 실패하면 빈 목록을 돌려줍니다. */
export async function fetchNeisSchedule(): Promise<Notice[]> {
  const { officeCode, schoolCode } = SCHOOL.neis;
  if (!officeCode || !schoolCode) return [];

  const today = new Date();
  const from = new Date(today.getFullYear() - 1, today.getMonth(), 1);
  const to = new Date(today.getFullYear() + 1, today.getMonth() + 1, 0);

  const params = new URLSearchParams({
    Type: "json",
    pIndex: "1",
    pSize: "1000",
    ATPT_OFCDC_SC_CODE: officeCode,
    SD_SCHUL_CODE: schoolCode,
    AA_FROM_YMD: compact(from),
    AA_TO_YMD: compact(to)
  });
  const key = process.env.NEXT_PUBLIC_NEIS_API_KEY;
  if (key) params.set("KEY", key);

  try {
    const res = await fetch(`https://open.neis.go.kr/hub/SchoolSchedule?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    const rows: NeisRow[] = data?.SchoolSchedule?.[1]?.row ?? [];
    return toNotices(rows);
  } catch {
    return [];
  }
}
