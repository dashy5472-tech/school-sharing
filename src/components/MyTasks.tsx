"use client";

/* 홈 맨 위의 "내가 낼 것"입니다.
   로그인한 사람이 제출 대상자로 지정된 과제 가운데 아직 제출 표시를 하지 않은 것을
   마감이 급한 순서로 보여 주고, 문서 열기와 제출 표시를 바로 할 수 있게 합니다.
   같은 계산을 화면 아래 알림(TaskAlert)에서도 씁니다. */

import { useEffect, useMemo, useState } from "react";
import { useSchoolUser } from "@/components/SchoolGate";
import { departments } from "@/config/departments";
import { isSchoolLoginEnabled, toggleTaskDone, watchTasks, type SavedTask } from "@/lib/school";

export function daysLeft(due: string) {
  const [y, m, d] = due.split("-").map(Number);
  const target = new Date(y, (m || 1) - 1, d || 1);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

export function leftLabel(left: number) {
  if (left < 0) return `${-left}일 지남`;
  if (left === 0) return "오늘까지";
  if (left === 1) return "내일까지";
  return `${left}일 남음`;
}

export function deptName(deptId: string) {
  return departments.find(d => d.id === deptId)?.name ?? "";
}

/* 내가 아직 내지 않은 과제를 마감 순으로 돌려줍니다. */
export function useMyTasks() {
  const { user } = useSchoolUser();
  const [tasks, setTasks] = useState<SavedTask[]>([]);

  useEffect(() => watchTasks(setTasks), []);

  const mine = useMemo(() => {
    const me = user?.email?.toLowerCase();
    if (!me) return [];
    return tasks
      .filter(task => task.assignees.some(a => a.email.toLowerCase() === me))
      .filter(task => !task.done.includes(me))
      .sort((a, b) => a.due.localeCompare(b.due));
  }, [tasks, user]);

  return { user, mine };
}

export default function MyTasks() {
  const { user, mine } = useMyTasks();

  if (!isSchoolLoginEnabled || !user) return null;
  const me = user.email.toLowerCase();

  return (
    <section className="my-tasks">
      <h2 className="sec-title">
        내가 낼 것 {mine.length > 0 ? <span className="sec-count">{mine.length}</span> : null}
      </h2>

      {mine.length === 0 ? (
        <div className="dl-empty">지금 내야 할 제출 과제가 없습니다.</div>
      ) : (
        <ul className="mt-list">
          {mine.map(task => {
            const left = daysLeft(task.due);
            const state = left < 0 ? "is-over" : left === 0 ? "is-today" : left <= 3 ? "is-soon" : "";
            return (
              <li key={task.id} className={`mt-item ${state}`}>
                <span className="mt-left">{leftLabel(left)}</span>
                <span className="mt-name">
                  {deptName(task.deptId) ? <em>{deptName(task.deptId)}</em> : null}
                  {task.title}
                </span>
                <span className="mt-actions">
                  {task.docUrl ? (
                    <a href={task.docUrl} target="_blank" rel="noopener noreferrer" className="mt-go">
                      문서 열기
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="mt-done"
                    onClick={() => {
                      void toggleTaskDone(task.id, me, true);
                    }}
                  >
                    제출함
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
