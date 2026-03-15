/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

interface VitapEvent {
  id: string;
  event_name?: string;
  club_name?: string;
  description?: string;
  date?: string;
  time?: string;
  venue?: string;
  registration_link?: string;
  prize_pool?: string;
  ods_provided?: string | null;
}

type TabType = "upcoming" | "past" | "no-date";
type SortBy = "date" | "od" | null;
type SortOrder = "asc" | "desc";

const parseDate = (dateString?: string): number => {
  if (!dateString) return 0;
  const raw = dateString.toLowerCase().trim();
  if (raw.match(/^\d{4}$/)) return -1;
  if (raw.includes("tba") || raw.includes("soon") || raw.includes("weekly")) return -1;
  const parsed = Date.parse(dateString);
  if (!isNaN(parsed) && parsed > 0) return parsed;
  const cleaned = raw.replace(/(st|nd|rd|th)/g, "");
  if (cleaned.includes("-") || cleaned.includes("–") || cleaned.includes(" to ")) {
    const segments = cleaned.split(/[-–]| to /).map((s) => s.trim());
    if (segments.length >= 2) {
      const p1 = segments[0];
      const p2 = segments[1];
      const p2HasMonth = /[a-z]/i.test(p2);
      let finalEndString = p2;
      if (!p2HasMonth) {
        const monthMatch = p1.match(/[a-z]+/i);
        if (monthMatch) finalEndString = `${p2} ${monthMatch[0]}`;
      }
      const currentYear = new Date().getFullYear();
      const parsedEnd = Date.parse(`${finalEndString} ${currentYear}`);
      if (!isNaN(parsedEnd) && parsedEnd > 0) return parsedEnd;
    }
  }
  const currentYear = new Date().getFullYear();
  const parsedClean = Date.parse(`${cleaned} ${currentYear}`);
  if (!isNaN(parsedClean) && parsedClean > 0) return parsedClean;
  return -1;
};

function useInView(ref: React.RefObject<HTMLElement>, threshold = 0.05) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return inView;
}

function EventRow({ event, index }: { event: VitapEvent; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rowRef = useRef<HTMLTableRowElement>(null);
  const inView = useInView(rowRef as React.RefObject<HTMLElement>);

  return (
    <>
      <tr
        ref={rowRef}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(14px)",
          transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${index * 40}ms, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${index * 40}ms`,
        }}
        className="group cursor-pointer border-b border-[#e4e7ed] hover:bg-[#f4f5f8] transition-colors duration-300 text-sm"
      >
        {/* EVENT NAME & DATE */}
        <td className="py-5 px-3 sm:px-4 md:px-6 align-top max-w-45 sm:max-w-xs">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-col gap-0.5">
              <h2
                className="text-[13.5px] md:text-[14px] font-semibold text-[#111318] leading-snug tracking-[-0.01em] transition-colors duration-300"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {event.event_name || "Untitled Event"}
              </h2>
              {event.club_name && (
                <span
                  className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.13em] text-[#6b52f5]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {event.club_name}
                </span>
              )}
            </div>

            <div
              className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium text-[#9da3b0] mt-0.5"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {event.date ? (
                <span>
                  {!isNaN(Date.parse(event.date)) && event.date.match(/^\d{4}-\d{2}-\d{2}$/)
                    ? new Date(event.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
                    : event.date}
                </span>
              ) : (
                <span className="italic text-[#b8beca]">Date TBA</span>
              )}
              {event.time && (
                <>
                  <span className="hidden sm:inline text-[#cbd0da]">·</span>
                  <span className="text-[#adb3bf] block sm:inline">{event.time}</span>
                </>
              )}
            </div>

            {/* Mobile OD badge */}
            {event.ods_provided === "Yes" && (
              <div className="sm:hidden mt-1">
                <span
                  className="inline-flex items-center gap-1 text-[#6b52f5] font-semibold bg-[#f0eeff] px-2 py-0.5 rounded-full border border-[#d4ccff] text-[9px] uppercase tracking-wider"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <span className="w-1 h-1 rounded-full bg-[#6b52f5] inline-block" />
                  OD Provided
                </span>
              </div>
            )}
          </div>
        </td>

        {/* VENUE */}
        <td className="py-5 px-4 md:px-6 align-top hidden sm:table-cell max-w-40">
          {event.venue ? (
            <span className="line-clamp-2 text-[11.5px] text-[#5c6270] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {event.venue}
            </span>
          ) : (
            <span className="italic text-[#b8beca] text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Location TBA
            </span>
          )}
        </td>

        {/* ODS */}
        <td className="py-5 px-4 md:px-6 align-top whitespace-nowrap hidden sm:table-cell">
          {event.ods_provided === "Yes" ? (
            <span
              className="inline-flex items-center gap-1.5 text-[#6b52f5] font-semibold bg-[#f0eeff] px-2.5 py-1 rounded-full border border-[#d4ccff] text-[10px] uppercase tracking-wider"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#6b52f5] inline-block" />
              OD Provided
            </span>
          ) : (
            <span className="text-[#b8beca] font-medium tracking-wider text-[10px] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              No OD
            </span>
          )}
        </td>

        {/* ACTION */}
        <td className="py-5 px-2 md:px-6 align-top text-right shrink-0 whitespace-nowrap">
          <div className="flex flex-col items-end gap-3 justify-center h-full pt-1">
            {event.registration_link && (
              <a
                href={event.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white bg-[#111318] hover:bg-[#6b52f5] transition-colors duration-300 rounded-lg"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Register
              </a>
            )}
            <div
              className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#b8beca] group-hover:text-[#6b52f5] transition-colors duration-300"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <span className="hidden sm:inline">{isExpanded ? "Close" : "Details"}</span>
              <span className="sm:hidden">{isExpanded ? "↑" : "↓"}</span>
              <svg
                className="w-3 h-3 hidden sm:block"
                style={{
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)",
                }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </td>
      </tr>

      {/* EXPANDED ROW */}
      <tr className="border-b border-[#e4e7ed]" style={{ background: "linear-gradient(to bottom, #f4f5f8, #f8f9fb)" }}>
        <td colSpan={4} className="p-0 border-none">
          <div
            style={{
              maxHeight: isExpanded ? "600px" : "0px",
              opacity: isExpanded ? 1 : 0,
              overflow: "hidden",
              transition: "max-height 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.4s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <div className="py-6 md:py-8 px-4 md:px-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-10 w-full max-w-5xl pl-4 md:pl-8 border-l-2 border-[#d4ccff]">
                <div className="col-span-1 md:col-span-3">
                  <p
                    className="text-[#3d4452] leading-loose font-normal text-[13px] md:text-[14px] whitespace-pre-wrap"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {event.description || "No detailed description provided by the organizer."}
                  </p>
                </div>
                <div className="col-span-1 space-y-5 md:pl-4">
                  {event.prize_pool && (
                    <div>
                      <h4 className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#b8beca] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        Prize Pool
                      </h4>
                      <p className="font-semibold text-[#111318] text-[13px]" style={{ fontFamily: "'Outfit', sans-serif" }}>{event.prize_pool}</p>
                    </div>
                  )}
                  <div className="sm:hidden">
                    <h4 className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#b8beca] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Venue</h4>
                    <p className="font-semibold text-[#111318] text-[13px]" style={{ fontFamily: "'Outfit', sans-serif" }}>{event.venue || "TBA"}</p>
                  </div>
                  <div>
                    <h4 className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#b8beca] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Schedule Time</h4>
                    <p className="font-semibold text-[#111318] text-[13px]" style={{ fontFamily: "'Outfit', sans-serif" }}>{event.time || "TBA"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<VitapEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [odFilter, setOdFilter] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const querySnapshot = await getDocs(collection(db, "events"));
        const eventsData: VitapEvent[] = [];
        querySnapshot.forEach((doc) => {
          eventsData.push({ id: doc.id, ...doc.data() } as VitapEvent);
        });
        eventsData.sort((a, b) => b.id.localeCompare(a.id));
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const handleSort = (field: SortBy) => {
    if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortOrder("desc"); }
  };

  const filteredAndSortedEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    let filtered = events.filter((event) => {
      if (!event.date) return activeTab === "no-date";
      const eventTime = parseDate(event.date);
      if (eventTime === -1) return activeTab === "no-date";
      if (activeTab === "upcoming") return eventTime >= todayTime;
      else if (activeTab === "past") return eventTime < todayTime;
      return false;
    });

    if (odFilter) filtered = filtered.filter((e) => e.ods_provided === "Yes");

    if (sortBy) {
      filtered.sort((a, b) => {
        let valA: any, valB: any;
        if (sortBy === "date") { valA = parseDate(a.date); valB = parseDate(b.date); }
        else if (sortBy === "od") { valA = a.ods_provided === "Yes" ? 1 : 0; valB = b.ods_provided === "Yes" ? 1 : 0; }
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [events, activeTab, sortBy, sortOrder, odFilter]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd0da; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #9da3b0; }
        * { scrollbar-width: thin; scrollbar-color: #cbd0da transparent; }

        .tab-btn { position: relative; z-index: 1; transition: color 0.2s ease; }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div
        className="min-h-screen pb-24"
        style={{ background: "#f8f9fb", fontFamily: "'Outfit', sans-serif" }}
      >
        {/* HEADER */}
        <header className="px-4 pt-16 pb-12 md:px-12 md:pt-24 md:pb-16">
          <div
            className="max-w-7xl mx-auto flex flex-col items-center text-center gap-3"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(22px)",
              transition: "opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <h1
              className="text-4xl sm:text-5xl md:text-[66px] font-bold tracking-[-0.03em] text-[#111318] leading-[1.05] mt-1"
              style={{ fontFamily: "'Outfit, sans-serif'" }}
            >
              VIT-AP Events
            </h1>

            <p
              className="text-[#5c6270] font-normal leading-relaxed text-[14px] md:text-[16px] max-w-xl mt-0.5 px-2"
            >
              An automatically updated board of upcoming events from mail directly.
            </p>
          </div>
        </header>

        <main
          className="max-w-6xl mx-auto px-2 sm:px-4 md:px-8"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.7s cubic-bezier(0.22,1,0.36,1) 0.18s",
          }}
        >
          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
            <div
              className="relative flex items-center gap-0.5 p-1 rounded-xl border border-[#e4e7ed]"
              style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)" }}
            >
              {(["upcoming", "past", "no-date"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`tab-btn relative px-3.5 py-1.5 rounded-lg text-[10.5px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors duration-200 ${
                    activeTab === tab ? "text-white" : "text-[#9da3b0] hover:text-[#3d4452]"
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {activeTab === tab && (
                    <span className="absolute inset-0 rounded-lg bg-[#111318]" style={{ zIndex: -1 }} />
                  )}
                  {tab === "no-date" ? "No Date" : tab}
                </button>
              ))}
            </div>

            {/* OD FILTER */}
            <label
              className="flex items-center gap-2.5 cursor-pointer group px-3.5 py-2 rounded-xl border transition-all duration-300"
              style={{
                background: odFilter ? "#f0eeff" : "rgba(255,255,255,0.8)",
                borderColor: odFilter ? "#d4ccff" : "#e4e7ed",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                className="relative flex items-center justify-center w-4 h-4 rounded border-[1.5px] transition-all duration-200"
                style={{
                  borderColor: odFilter ? "#6b52f5" : "#cbd0da",
                  background: odFilter ? "#6b52f5" : "transparent",
                }}
              >
                <input
                  type="checkbox"
                  checked={odFilter}
                  onChange={(e) => setOdFilter(e.target.checked)}
                  className="absolute opacity-0 w-full h-full cursor-pointer m-0"
                />
                {odFilter && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span
                className={`text-[10.5px] font-semibold uppercase tracking-wider transition-colors duration-200 ${odFilter ? "text-[#6b52f5]" : "text-[#9da3b0] group-hover:text-[#3d4452]"}`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ODs Only
              </span>
            </label>
          </div>

          {/* TABLE CARD */}
          <div
            className="w-full overflow-hidden rounded-2xl border border-[#e4e7ed]"
            style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 2px 24px rgba(60,70,120,0.06), 0 1px 4px rgba(60,70,120,0.04)",
            }}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e4e7ed]" style={{ background: "rgba(248,249,251,0.95)" }}>
                  <th
                    className="py-4 md:py-5 px-3 md:px-6 cursor-pointer w-[60%] sm:w-[40%] text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9da3b0] hover:text-[#3d4452] transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1.5">
                      Event Details
                      <span style={{ opacity: sortBy === "date" ? 1 : 0.25, color: sortBy === "date" ? "#6b52f5" : "inherit", transition: "opacity 0.2s, color 0.2s" }}>
                        {sortBy === "date" && sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    </div>
                  </th>
                  <th
                    className="py-4 md:py-5 px-4 md:px-6 hidden sm:table-cell w-[25%] text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9da3b0]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Location
                  </th>
                  <th
                    className="py-4 md:py-5 px-4 md:px-6 hidden sm:table-cell cursor-pointer text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9da3b0] hover:text-[#3d4452] transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    onClick={() => handleSort("od")}
                  >
                    <div className="flex items-center gap-1.5">
                      ODs
                      <span style={{ opacity: sortBy === "od" ? 1 : 0.25, color: sortBy === "od" ? "#6b52f5" : "inherit", transition: "opacity 0.2s, color 0.2s" }}>
                        {sortBy === "od" && sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    </div>
                  </th>
                  <th
                    className="py-4 md:py-5 px-3 md:px-6 text-right text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9da3b0]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#e4e7ed]">
                      <td className="py-6 px-4 md:px-6">
                        <div
                          className="h-3.5 w-2/3 mb-3 rounded-full"
                          style={{
                            background: "linear-gradient(90deg, #edeef2 25%, #f4f5f8 50%, #edeef2 75%)",
                            backgroundSize: "200% 100%",
                            animation: `shimmer 1.5s infinite ${i * 0.1}s`,
                          }}
                        />
                        <div
                          className="h-2.5 w-1/4 rounded-full"
                          style={{
                            background: "linear-gradient(90deg, #edeef2 25%, #f4f5f8 50%, #edeef2 75%)",
                            backgroundSize: "200% 100%",
                            animation: `shimmer 1.5s infinite ${i * 0.1 + 0.15}s`,
                          }}
                        />
                      </td>
                    </tr>
                  ))
                ) : filteredAndSortedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-24 text-center">
                      <p className="text-[15px] text-[#9da3b0] font-normal">
                        No events found for this filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedEvents.map((event, i) => (
                    <EventRow key={event.id} event={event} index={i} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>

        {/* FOOTER CREDIT */}
        <footer
          className="max-w-6xl mx-auto px-4 md:px-8 mt-12"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s",
          }}
        >
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e4e7ed]">
            <span
              className="text-[10px] text-[#b8beca] font-medium"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              built by
            </span>
            <a
              href="https://github.com/pranjal-kumar-0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold text-[#9da3b0] hover:text-[#6b52f5] transition-colors duration-200"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Pranjal Kumar
            </a>
            <span className="text-[#e4e7ed] text-[10px]">·</span>
            <a
              href="https://www.instagram.com/pranjal.kumar_/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold text-[#9da3b0] hover:text-[#6b52f5] transition-colors duration-200"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              @pranjal.kumar_
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}