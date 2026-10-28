"use client";

/* 업무·서식 찾기입니다.
   부서 이름, 업무분장(코드에 적힌 것과 담당자가 적은 것), 서식, 부서 글, 공용 링크를
   한 번에 뒤집니다. 띄어 쓴 낱말이 모두 들어 있는 것만 보여 줍니다.
   업무와 글은 누르면 그 부서 탭으로 가고, 서식과 링크는 바로 열립니다. */

import { useEffect, useMemo, useState } from "react";
import { departments } from "@/config/departments";
import { boardPosts } from "@/config/linktree";
import {
  watchDuties,
  watchForms,
  watchPosts,
  type SavedDuty,
  type SavedForm,
  type SavedPost
} from "@/lib/school";

type Hit = {
  key: string;
  kind: "부서" | "업무" | "서식" | "글" | "링크";
  title: string;
  sub: string;
  deptId?: string;
  href?: string;
  text: string;
};

const MAX_HITS = 20;

function deptName(deptId: string) {
  return departments.find(d => d.id === deptId)?.name ?? "";
}

export default function SiteSearch({ onGo }: { onGo: (deptId: string) => void }) {
  const [q, setQ] = useState("");
  const [duties, setDuties] = useState<SavedDuty[]>([]);
  const [forms, setForms] = useState<SavedForm[]>([]);
  const [posts, setPosts] = useState<SavedPost[]>([]);

  useEffect(() => watchDuties(null, setDuties), []);
  useEffect(() => watchForms(null, setForms), []);
  useEffect(() => watchPosts(null, setPosts), []);

  const index = useMemo<Hit[]>(() => {
    const list: Hit[] = [];
    for (const dept of departments) {
      list.push({ key: `d-${dept.id}`, kind: "부서", title: dept.name, sub: dept.subtitle ?? "", deptId: dept.id, text: dept.name });
      for (const duty of dept.duties) {
        list.push({
          key: `cd-${dept.id}-${duty.id}`,
          kind: "업무",
          title: duty.title,
          sub: dept.name,
          deptId: dept.id,
          text: [dept.name, duty.title, duty.owner, duty.summary, ...duty.routines.map(r => `${r.cycle} ${r.what}`)].join(" ")
        });
      }
    }
    for (const duty of duties) {
      list.push({
        key: `sd-${duty.id}`,
        kind: "업무",
        title: duty.title,
        sub: deptName(duty.deptId),
        deptId: duty.deptId,
        text: [deptName(duty.deptId), duty.title, duty.owner, duty.summary, ...duty.routines.map(r => `${r.cycle} ${r.what}`)].join(" ")
      });
    }
    for (const form of forms) {
      list.push({
        key: `f-${form.id}`,
        kind: "서식",
        title: form.label,
        sub: [deptName(form.deptId), form.kind].filter(Boolean).join(" · "),
        href: form.href,
        text: [deptName(form.deptId), form.label, form.kind].join(" ")
      });
    }
    for (const post of posts) {
      list.push({
        key: `p-${post.id}`,
        kind: "글",
        title: post.title,
        sub: deptName(post.deptId) || "공통",
        deptId: post.deptId || undefined,
        text: [deptName(post.deptId), post.title, post.body].join(" ")
      });
    }
    for (const link of boardPosts) {
      list.push({
        key: `l-${link.id}`,
        kind: "링크",
        title: link.title,
        sub: link.date,
        href: link.href,
        text: [link.title, link.summary ?? "", link.date].join(" ")
      });
    }
    return list;
  }, [duties, forms, posts]);

  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const hits = words.length === 0 ? [] : index.filter(h => words.every(w => h.text.toLowerCase().includes(w)));

  return (
    <section className="site-search" role="search">
      <label className="ss-box">
        <span className="ss-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="업무·서식·글 찾기 (예: 출결 서식)"
          aria-label="업무, 서식, 글 찾기"
        />
      </label>

      {words.length > 0 ? (
        hits.length === 0 ? (
          <p className="ss-empty">"{q.trim()}"에 맞는 업무나 서식이 없습니다.</p>
        ) : (
          <ul className="ss-list">
            {hits.slice(0, MAX_HITS).map(hit => (
              <li key={hit.key}>
                {hit.href ? (
                  <a className="ss-hit" href={hit.href} target="_blank" rel="noopener noreferrer">
                    <span className="ss-kind">{hit.kind}</span>
                    <span className="ss-title">{hit.title}</span>
                    <span className="ss-sub">{hit.sub}</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    className="ss-hit"
                    onClick={() => {
                      onGo(hit.deptId ?? "home");
                      setQ("");
                    }}
                  >
                    <span className="ss-kind">{hit.kind}</span>
                    <span className="ss-title">{hit.title}</span>
                    <span className="ss-sub">{hit.sub}</span>
                  </button>
                )}
              </li>
            ))}
            {hits.length > MAX_HITS ? <li className="ss-more">그 밖에 {hits.length - MAX_HITS}건 더 있습니다. 낱말을 더 넣어 좁혀 보세요.</li> : null}
          </ul>
        )
      ) : null}
    </section>
  );
}
