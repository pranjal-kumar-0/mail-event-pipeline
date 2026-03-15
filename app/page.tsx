"use client";

import { useEffect, useState, useMemo } from "react";
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
  if (!isNaN(parsed) && parsed > 0) {
    return parsed;
  }

  let cleaned = raw.replace(/(st|nd|rd|th)/g, "");

  if (cleaned.includes("-") || cleaned.includes("–") || cleaned.includes(" to ")) {
    const segments = cleaned.split(/[-–]| to /).map(s => s.trim());
    if (segments.length >= 2) {
      const p1 = segments[0];
      const p2 = segments[1];

      const p1HasMonth = /[a-z]/i.test(p1);
      const p2HasMonth = /[a-z]/i.test(p2);

      let finalEndString = p2;
      if (!p2HasMonth && p1HasMonth) {
        const monthMatch = p1.match(/[a-z]+/i);
        if (monthMatch) {
          finalEndString = `${p2} ${monthMatch[0]}`;
        }
      }

      const currentYear = new Date().getFullYear();
      const parsedEnd = Date.parse(`${finalEndString} ${currentYear}`);

      if (!isNaN(parsedEnd) && parsedEnd > 0) {
        return parsedEnd;
      }
    }
  }

  const currentYear = new Date().getFullYear();
  const parsedClean = Date.parse(`${cleaned} ${currentYear}`);

  if (!isNaN(parsedClean) && parsedClean > 0) {
    return parsedClean;
  }

  return -1;
};

function EventRow({ event }: { event: VitapEvent }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr
        onClick={() => setIsExpanded(!isExpanded)}
        className="group cursor-pointer border-b border-[#222] hover:bg-[#111] transition-colors duration-200 text-sm md:text-base"
      >
        {/* EVENT NAME & DATE */}
        <td className="py-5 px-2 sm:px-4 md:px-6 align-top max-w-[180px] sm:max-w-xs transition-transform duration-200 group-hover:translate-x-1 md:group-hover:translate-x-2">
          <div className="flex flex-col gap-1.5 md:gap-2">
            <div className="flex flex-col gap-0.5 md:gap-1">
              <h2 className="text-sm md:text-base font-semibold text-white leading-snug tracking-wide">
                {event.event_name || "Untitled Event"}
              </h2>
              {event.club_name && (
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#5e5ce6]">
                  {event.club_name}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs md:text-sm font-medium text-neutral-500 mt-1 pb-1 md:pb-0">
              {event.date ? (
                <span>{
                  !isNaN(Date.parse(event.date)) && event.date.match(/^\d{4}-\d{2}-\d{2}$/)
                    ? new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
                    : event.date
                }</span>
              ) : (
                <span className="italic">Date TBA</span>
              )}
              {event.time && (
                <>
                  <span className="hidden sm:inline text-neutral-700">•</span>
                  <span className="text-neutral-600 block sm:inline">{event.time}</span>
                </>
              )}
            </div>

            {/* Mobile OD Badge */}
            {event.ods_provided === "Yes" && (
              <div className="sm:hidden mt-0.5 mb-1">
                <span className="text-white font-medium bg-[#1a1a1a] px-2 py-1 rounded-sm border border-[#333] tracking-wide text-[9px]">
                  OD Provided
                </span>
              </div>
            )}
          </div>
        </td>

        {/* VENUE */}
        <td className="py-5 px-4 md:px-6 align-top text-neutral-400 font-medium hidden sm:table-cell max-w-[150px]">
          {event.venue ? (
            <span className="line-clamp-2 text-sm md:text-base">{event.venue}</span>
          ) : (
            <span className="italic text-neutral-600 text-sm md:text-base">Location TBA</span>
          )}
        </td>

        {/* ODS (Desktop only) */}
        <td className="py-5 px-4 md:px-6 align-top whitespace-nowrap hidden sm:table-cell">
          {event.ods_provided === "Yes" ? (
            <span className="text-white font-medium bg-[#1a1a1a] px-3 py-1.5 rounded-md border border-[#333] tracking-wide text-xs">
              OD Provided
            </span>
          ) : (
            <span className="text-neutral-500 font-medium tracking-wide text-xs">
              No OD
            </span>
          )}
        </td>

        {/* ACTION / EXPAND */}
        <td className="py-5 px-2 md:px-6 align-top text-right shrink-0 whitespace-nowrap">
          <div className="flex flex-col items-end gap-3 justify-center h-full pt-1">
            {event.registration_link && (
              <a
                href={event.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center px-3 py-1.5 md:px-4 md:py-1.5 text-[10px] md:text-xs font-semibold text-black bg-white hover:bg-neutral-200 transition-colors duration-200 rounded-full"
              >
                Register
              </a>
            )}
            <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-neutral-500 group-hover:text-white transition-colors duration-200 pt-1 md:pt-0">
              <span className="hidden sm:inline">{isExpanded ? "Close Info" : "More Info"}</span>
              <span className="sm:hidden">{isExpanded ? "Close" : "Info"}</span>
              <svg
                className={`w-3 h-3 transition-transform duration-300 ease-[cubic-bezier(0.87,0,0.13,1)] ${isExpanded ? "-rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </td>
      </tr>

      {/* EXPANDED ROW FOR DESCRIPTION */}
      <tr className={`border-b border-[#222] bg-[#0c0c0c] transition-all duration-300 ease-[cubic-bezier(0.87,0,0.13,1)] ${isExpanded ? "opacity-100" : "opacity-0 hidden"}`}>
        <td colSpan={4} className="p-0 border-none">
          <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.87,0,0.13,1)] ${isExpanded ? "max-h-[1000px] py-6 md:py-10 px-2 md:px-12" : "max-h-0 py-0 px-2 md:px-12"}`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 w-full max-w-5xl pl-4 md:pl-8 border-l-2 border-[#333]">
              <div className="col-span-1 md:col-span-3 space-y-4">
                <p className="text-neutral-300 leading-loose font-light text-sm md:text-base whitespace-pre-wrap">
                  {event.description || "No detailed description provided by the organizer."}
                </p>

              </div>

              {/* Sidebar Meta */}
              <div className="col-span-1 space-y-8 md:pl-6">
                {event.prize_pool && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Prize Pool</h4>
                    <p className="font-medium text-white text-base">{event.prize_pool}</p>
                  </div>
                )}

                <div className="sm:hidden">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Venue</h4>
                  <p className="font-medium text-white text-base">{event.venue || "TBA"}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Schedule Time</h4>
                  <p className="font-medium text-white text-base">{event.time || "TBA"}</p>
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
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const filteredAndSortedEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    let filtered = events.filter((event) => {

      if (!event.date) {
        return activeTab === "no-date";
      }

      const eventTime = parseDate(event.date);

      if (eventTime === -1) {
        return activeTab === "no-date";
      }

      if (activeTab === "upcoming") {
        return eventTime >= todayTime;
      } else if (activeTab === "past") {
        return eventTime < todayTime;
      }

      return false;
    });

    if (odFilter) filtered = filtered.filter(e => e.ods_provided === "Yes");

    if (sortBy) {
      filtered.sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortBy === "date") {
          valA = parseDate(a.date);
          valB = parseDate(b.date);
        } else if (sortBy === "od") {
          valA = a.ods_provided === "Yes" ? 1 : 0;
          valB = b.ods_provided === "Yes" ? 1 : 0;
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [events, activeTab, sortBy, sortOrder, odFilter]);

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 font-sans pb-32">

      {/* HEADER SECTION */}
      <header className="px-4 py-16 md:px-12 md:py-24">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-4 md:gap-6">

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight text-white m-0 p-0 leading-tight">
            VIT-AP Events
          </h1>

          <p className="text-neutral-500 font-normal leading-relaxed text-sm md:text-lg max-w-2xl mt-1 md:mt-2 px-2">
            An automatically updated board of upcoming events from mail directly. 
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-2 sm:px-4 md:px-8">

        {/* FILTERS / SETTINGS HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-4 border-b border-[#222] pb-6">

          <div className="flex gap-4 md:gap-8 overflow-x-auto pb-2 scrollbar-hide">
            {(["upcoming", "past", "no-date"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm tracking-wide capitalize transition-all duration-200 whitespace-nowrap ${activeTab === tab
                    ? "text-white font-medium"
                    : "text-neutral-500 hover:text-neutral-300 font-normal"
                  }`}
              >
                {tab === "no-date" ? "Date not mentioned" : `${tab} Events`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 rounded border border-[#333] bg-[#111] transition-all group-hover:border-neutral-400">
                <input 
                  type="checkbox" 
                  checked={odFilter}
                  onChange={(e) => setOdFilter(e.target.checked)}
                  className="absolute opacity-0 w-full h-full cursor-pointer m-0"
                />
                {odFilter && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`tracking-wide font-medium transition-colors ${odFilter ? "text-white" : "text-neutral-500 group-hover:text-neutral-300"}`}>
                ODs Only
              </span>
            </label>
          </div>
        </div>

        {/* LIST VIEW */}
        <div className="w-full overflow-x-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222] text-[10px] md:text-xs font-semibold text-neutral-500 tracking-wide uppercase">
                <th
                  className="py-4 md:py-6 px-2 md:px-6 cursor-pointer hover:text-neutral-300 w-[60%] sm:w-[40%] md:w-auto transition-colors font-medium"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-1.5 md:gap-2">
                    Event Details
                    {sortBy === "date" ? (
                      <span className="text-white">{sortOrder === "asc" ? "↑" : "↓"}</span>
                    ) : (
                      <span className="opacity-0">↓</span>
                    )}
                  </div>
                </th>
                <th className="py-4 md:py-6 px-4 md:px-6 hidden sm:table-cell w-[25%] md:w-auto font-medium">Location</th>
                <th
                  className="py-4 md:py-6 px-4 md:px-6 hidden sm:table-cell cursor-pointer hover:text-neutral-300 transition-colors font-medium"
                  onClick={() => handleSort("od")}
                >
                  <div className="flex items-center gap-1.5 md:gap-2">
                    ODs
                    {sortBy === "od" ? (
                      <span className="text-white">{sortOrder === "asc" ? "↑" : "↓"}</span>
                    ) : (
                      <span className="opacity-0">↓</span>
                    )}
                  </div>
                </th>
                <th className="py-4 md:py-6 px-2 md:px-6 text-right font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#222]">
                    <td className="py-8 px-6">
                      <div className="h-4 bg-[#222] w-2/3 mb-4 rounded-full animate-pulse" />
                      <div className="h-3 bg-[#111] w-1/4 rounded-full animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredAndSortedEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <p className="text-lg text-neutral-500 font-light">
                      No events found for this filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedEvents.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}
