"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useTheme } from "../hooks/useTheme";
import { EventRow } from "../components/EventRow";
import { ThemeToggle } from "../components/ThemeToggle";
import { VitapEvent, TabType, SortBy, SortOrder } from "../types/event";
import { parseDate } from "../lib/dateUtils";

export default function EventsPage() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        ::view-transition-old(root),
        ::view-transition-new(root) {
          animation: none;
          mix-blend-mode: normal;
        }
        ::view-transition-old(root) {
          z-index: 1;
        }
        ::view-transition-new(root) {
          z-index: 2;
        }
      `}</style>
      
      <div
        className="min-h-screen flex flex-col transition-colors duration-300 pb-8"
        style={{
          background: dark ? "#13151c" : "#f8f9fb",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
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
              className="text-4xl sm:text-5xl md:text-[66px] font-bold tracking-[-0.03em] leading-[1.05] mt-1 transition-colors duration-300"
              style={{
                fontFamily: "'Outfit', sans-serif",
                color: dark ? "#e8eaf0" : "#111318",
              }}
            >
              VIT-AP Events
            </h1>

            <p
              className="font-normal leading-relaxed text-[14px] md:text-[16px] max-w-xl mt-0.5 px-2 transition-colors duration-300"
              style={{ color: dark ? "#6b7280" : "#5c6270" }}
            >
              An automatically updated board of upcoming events from mail directly.
            </p>
          </div>
        </header>

        <main
          className="w-full max-w-6xl mx-auto px-2 sm:px-4 md:px-8 flex-1"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.7s cubic-bezier(0.22,1,0.36,1) 0.18s",
          }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="relative flex items-center gap-0.5 p-1 rounded-xl border"
                style={{
                  background: dark ? "rgba(30,32,41,0.8)" : "rgba(255,255,255,0.8)",
                  backdropFilter: "blur(10px)",
                  borderColor: dark ? "#2a2d36" : "#e4e7ed",
                }}
              >
                {(["upcoming", "past", "no-date"] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`tab-btn relative px-3.5 py-1.5 rounded-lg text-[10.5px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors duration-200`}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: activeTab === tab ? "#fff" : dark ? "#6b7280" : "#9da3b0",
                    }}
                  >
                    {activeTab === tab && (
                      <span
                        className="absolute inset-0 rounded-lg"
                        style={{ zIndex: -1, background: dark ? "#6b52f5" : "#111318" }}
                      />
                    )}
                    {tab === "no-date" ? "No Date" : tab}
                  </button>
                ))}
              </div>

              <label
                className="flex items-center gap-2.5 cursor-pointer group px-3.5 py-2 rounded-xl border transition-all duration-300"
                style={{
                  background: odFilter
                    ? dark ? "#2d2a4a" : "#f0eeff"
                    : dark ? "rgba(30,32,41,0.8)" : "rgba(255,255,255,0.8)",
                  borderColor: odFilter
                    ? dark ? "#4a3f8a" : "#d4ccff"
                    : dark ? "#2a2d36" : "#e4e7ed",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  className="relative flex items-center justify-center w-4 h-4 rounded border-[1.5px] transition-all duration-200"
                  style={{
                    borderColor: odFilter ? "#6b52f5" : dark ? "#3d4252" : "#cbd0da",
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
                  className="text-[10.5px] font-semibold uppercase tracking-wider transition-colors duration-200"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: odFilter ? "#6b52f5" : dark ? "#6b7280" : "#9da3b0",
                  }}
                >
                  ODs Only
                </span>
              </label>
            </div>

            <ThemeToggle
              theme={theme}
              toggle={toggle}
              dark={dark}
            />
          </div>

          <div
            className="w-full overflow-hidden rounded-2xl border transition-colors duration-300"
            style={{
              background: dark ? "rgba(22,24,32,0.85)" : "rgba(255,255,255,0.72)",
              backdropFilter: "blur(14px)",
              borderColor: dark ? "#2a2d36" : "#e4e7ed",
              boxShadow: dark
                ? "0 2px 24px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)"
                : "0 2px 24px rgba(60,70,120,0.06), 0 1px 4px rgba(60,70,120,0.04)",
            }}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="border-b"
                  style={{
                    background: dark ? "rgba(19,21,28,0.95)" : "rgba(248,249,251,0.95)",
                    borderColor: dark ? "#2a2d36" : "#e4e7ed",
                  }}
                >
                  <th
                    className="py-4 md:py-5 px-3 md:px-6 cursor-pointer w-[60%] sm:w-[40%] text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: dark ? "#4b5263" : "#9da3b0" }}
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
                    className="py-4 md:py-5 px-4 md:px-6 hidden sm:table-cell w-[25%] text-[9px] font-semibold uppercase tracking-[0.14em]"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: dark ? "#4b5263" : "#9da3b0" }}
                  >
                    Location
                  </th>
                  <th
                    className="py-4 md:py-5 px-4 md:px-6 hidden sm:table-cell cursor-pointer text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: dark ? "#4b5263" : "#9da3b0" }}
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
                    className="py-4 md:py-5 px-3 md:px-6 text-right text-[9px] font-semibold uppercase tracking-[0.14em]"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: dark ? "#4b5263" : "#9da3b0" }}
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr
                      key={i}
                      className="border-b"
                      style={{ borderColor: dark ? "#2a2d36" : "#e4e7ed" }}
                    >
                      <td className="py-6 px-4 md:px-6">
                        <div
                          className="h-3.5 w-2/3 mb-3 rounded-full"
                          style={{
                            backgroundImage: dark
                              ? `linear-gradient(90deg, #1e2029 25%, #252831 50%, #1e2029 75%)`
                              : `linear-gradient(90deg, #edeef2 25%, #f4f5f8 50%, #edeef2 75%)`,
                            backgroundSize: "200% 100%",
                            animation: `shimmer 1.5s infinite ${i * 0.1}s`,
                          }}
                        />
                        <div
                          className="h-2.5 w-1/4 rounded-full"
                          style={{
                            backgroundImage: dark
                              ? `linear-gradient(90deg, #1e2029 25%, #252831 50%, #1e2029 75%)`
                              : `linear-gradient(90deg, #edeef2 25%, #f4f5f8 50%, #edeef2 75%)`,
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
                      <p
                        className="text-[15px] font-normal"
                        style={{ color: dark ? "#4b5263" : "#9da3b0" }}
                      >
                        No events found for this filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedEvents.map((event, i) => (
                    <EventRow key={event.id} event={event} index={i} dark={dark} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>

        <footer
          className="w-full max-w-6xl mx-auto px-4 md:px-8 mt-12"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s",
          }}
        >
          <div
            className="flex items-center justify-end gap-3 pt-4 border-t"
            style={{ borderColor: dark ? "#2a2d36" : "#e4e7ed" }}
          >
            <span
              className="text-[10px] font-medium"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: dark ? "#4b5263" : "#b8beca" }}
            >
              built by
            </span>
            <a
              href="https://github.com/pranjal-kumar-0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold hover:text-[#6b52f5] transition-colors duration-200"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: dark ? "#6b7280" : "#9da3b0" }}
            >
              Pranjal Kumar
            </a>
            <span style={{ color: dark ? "#2a2d36" : "#e4e7ed" }} className="text-[10px]">·</span>
            <a
              href="https://www.instagram.com/pranjal.kumar_/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold hover:text-[#6b52f5] transition-colors duration-200"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: dark ? "#6b7280" : "#9da3b0" }}
            >
              @pranjal.kumar_
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}