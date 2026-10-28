/* 강릉문성고 부서 목록입니다. 부서 이름과 id 만 여기서 정하고,
   업무분장 내용은 각 부장이 화면에서 "+ 업무분장 적기" 로 직접 채웁니다.

   부서별 공유 폴더를 대신하는 자료입니다.
   - departments : 오른쪽 탭 하나가 부서 하나입니다. 그 안에 업무분장이 들어갑니다.
   - 업무분장 하나를 누르면 "반복되는 업무(주기별)"와 "업무 관련 내용(절차·서식·메모)"이 나옵니다.
   - notices : 홈(교무실) 화면에 뜨는 공지입니다. 며칠까지 무엇을 해야 하는지 적습니다.

   담당자 이름은 공개 저장소에 넣지 않습니다. owner 에는 직책이나 "담당"만 적으세요. */

export type Routine = {
  /* 반복 주기입니다. 예: 매주 월요일 / 매월 초 / 학기초 / 연 1회(3월) */
  cycle: string;
  what: string;
};

export type DutyLink = {
  label: string;
  href: string;
};

/* 업무 흐름도의 한 칸입니다.
   인수인계를 받은 사람이 이 순서대로만 따라가도 일이 굴러가도록 적습니다.
   "무엇을 한다"가 아니라 "어디에 들어가서 무엇을 누르고 무엇을 남긴다"까지 적습니다. */
export type FlowStep = {
  /* 단계 이름입니다. 예: 서류 접수 */
  phase: string;
  /* 언제 하는 일인지입니다. 예: 배정 통보를 받은 날 */
  when: string;
  /* 누가 하고 누구와 같이 하는지입니다. 개인 이름은 적지 않습니다. */
  who?: string;
  /* 어디서 처리하는지입니다. 예: 나이스 > 학적 > 전입학 */
  where?: string;
  /* 실제로 하는 일입니다. 한 줄에 하나씩 적습니다. */
  actions: string[];
  /* 이 단계가 끝나면 남는 것입니다. 다음 사람이 찾아볼 근거가 됩니다. */
  output?: string;
  /* 여기서 틀리면 되돌리기 어려운 것입니다. */
  caution?: string;
};

/* 업무 하나 안에서 갈래가 나뉘는 흐름입니다.
   예: 학적 업무는 전입·전출·자퇴가 각각 다른 흐름입니다. */
export type Flow = {
  /* 흐름 이름입니다. 예: 전입(다른 학교에서 우리 학교로) */
  title: string;
  /* 이 흐름이 시작되는 신호입니다. 예: 보호자가 전학 문의를 해 왔을 때 */
  trigger?: string;
  /* 법령·지침 근거입니다. 해마다 바뀌므로 연도를 같이 적습니다. */
  basis?: string;
  /* 전체가 며칠짜리 일인지입니다. */
  duration?: string;
  steps: FlowStep[];
};

export type Duty = {
  id: string;
  title: string;
  /* 담당 직책입니다. 개인 이름 대신 "부장", "담당" 처럼 적습니다. */
  owner?: string;
  /* 이 업무가 무엇인지 한 줄 정의입니다. */
  summary: string;
  /* 반복되는 업무입니다. */
  routines: Routine[];
  /* 업무 흐름도입니다. 인수인계의 본체입니다. */
  flows?: Flow[];
  /* 처리 절차입니다. 인수인계 때 순서대로 따라 할 수 있게 적습니다. */
  howto?: string[];
  /* 주의사항과 인수인계 메모입니다. */
  notes?: string[];
  /* 관련 시스템·서식 링크입니다. */
  links?: DutyLink[];
};

export type Department = {
  id: string;
  name: string;
  /* 탭을 눌렀을 때 제목 옆에 붙는 작은 글씨입니다. */
  subtitle?: string;
  /* 이 부서의 공유 드라이브입니다. url 을 비워 두면 "링크 미등록"으로 표시됩니다.
     학교 구글 계정에만 권한을 주면, 사이트 주소를 알아도 자료는 열리지 않습니다. */
  drive?: { url: string; note?: string };
  duties: Duty[];
};

export const departments: Department[] = [
  {
    id: "vice-principal",
    name: "교감",
    drive: { url: "" },
    duties: []
  },
  {
    id: "academic",
    name: "교무부",
    drive: { url: "" },
    duties: []
  },
  {
    id: "curriculum",
    name: "교육과정부",
    drive: { url: "" },
    duties: []
  },
  {
    id: "research",
    name: "연구부",
    drive: { url: "" },
    duties: []
  },
  {
    id: "grade1",
    name: "1학년부",
    drive: { url: "" },
    duties: []
  },
  {
    id: "grade2",
    name: "2학년부",
    drive: { url: "" },
    duties: []
  },
  {
    id: "grade3",
    name: "3학년부",
    drive: { url: "" },
    duties: []
  },
  {
    id: "safety",
    name: "학생안전부",
    drive: { url: "" },
    duties: []
  },
  {
    id: "arts-sports",
    name: "예체능부",
    drive: { url: "" },
    duties: []
  },
  {
    id: "future-edu",
    name: "미래교육부",
    drive: { url: "" },
    duties: []
  },
  {
    id: "dormitory",
    name: "기숙사부",
    drive: { url: "" },
    duties: []
  }
];

/* 홈(교무실) 화면에 뜨는 공지입니다.
   due 는 "2026-09-08" 처럼 적습니다. 화면에서는 9월 8일과 남은 날짜로 바뀝니다.
   dept 는 위 departments 의 name 과 같게 적으면 어느 부서 건인지 함께 보입니다. */
export type Notice = {
  id: string;
  due: string;
  dept: string;
  title: string;
  detail?: string;
  /* 나이스에서 공휴일로 온 날입니다. 달력에서 날짜를 빨간색으로 칠합니다. */
  holiday?: boolean;
};

export const notices: Notice[] = [];
