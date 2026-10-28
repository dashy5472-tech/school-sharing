"use client";

/* 부서별 업무분장 작성 현황입니다. 관리 탭에서 봅니다.
   업무분장(코드에 적힌 것 + 담당자가 적은 것), 서식, 공유 드라이브 링크가
   부서마다 얼마나 채워졌는지 보여 주어, 어느 부서에 작성을 부탁할지 알 수 있게 합니다. */

import { useEffect, useState } from "react";
import { departments } from "@/config/departments";
import {
  watchDeptMeta,
  watchDuties,
  watchForms,
  type SavedDuty,
  type SavedForm
} from "@/lib/school";

function DriveCell({ deptId }: { deptId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => watchDeptMeta(deptId, meta => setUrl(meta?.driveUrl ?? "")), [deptId]);
  if (url === null) return <td>…</td>;
  return <td className={url ? "is-ok" : "is-empty"}>{url ? "등록" : "없음"}</td>;
}

export default function DutyProgress({ onGo }: { onGo: (deptId: string) => void }) {
  const [duties, setDuties] = useState<SavedDuty[]>([]);
  const [forms, setForms] = useState<SavedForm[]>([]);

  useEffect(() => watchDuties(null, setDuties), []);
  useEffect(() => watchForms(null, setForms), []);

  const rows = departments.map(dept => ({
    dept,
    duties: dept.duties.length + duties.filter(d => d.deptId === dept.id).length,
    forms: forms.filter(f => f.deptId === dept.id).length
  }));
  const done = rows.filter(r => r.duties > 0).length;

  return (
    <section className="tasks">
      <h2 className="sec-title">
        업무분장 작성 현황 <span className="sec-count">{done}/{rows.length}</span>
      </h2>
      <p className="dp-lead">업무분장이 하나도 없는 부서는 빨갛게 표시됩니다. 부서 이름을 누르면 그 탭으로 갑니다.</p>
      <div className="dp-wrap">
        <table className="dp-table">
          <thead>
            <tr>
              <th scope="col">부서</th>
              <th scope="col">업무분장</th>
              <th scope="col">서식</th>
              <th scope="col">공유 드라이브</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.dept.id}>
                <th scope="row">
                  <button type="button" onClick={() => onGo(row.dept.id)}>
                    {row.dept.name}
                  </button>
                </th>
                <td className={row.duties > 0 ? "is-ok" : "is-empty"}>{row.duties}건</td>
                <td>{row.forms}건</td>
                <DriveCell deptId={row.dept.id} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
