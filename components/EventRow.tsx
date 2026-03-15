import { useState, useRef } from "react";
import { VitapEvent } from "../types/event";
import { useInView } from "../hooks/useInView";

export function EventRow({ event, index, dark }: { event: VitapEvent; index: number; dark: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rowRef = useRef<HTMLTableRowElement>(null);
  const inView = useInView(rowRef);

  const d = dark;

  return (
    <>
      <tr
        ref={rowRef}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(14px)",
          transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${index * 40}ms, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${index * 40}ms`,
          background: "transparent",
        }}
        className={`group cursor-pointer border-b transition-colors duration-300 text-sm ${
          d
            ? "border-[#2a2d36] hover:bg-[#1e2029]"
            : "border-[#e4e7ed] hover:bg-[#f4f5f8]"
        }`}
      >
        <td className="py-5 px-3 sm:px-4 md:px-6 align-top max-w-45 sm:max-w-xs">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-col gap-0.5">
              <h2
                className="text-[13.5px] md:text-[14px] font-semibold leading-snug tracking-[-0.01em] transition-colors duration-300"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  color: d ? "#e8eaf0" : "#111318",
                }}
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
              className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium mt-0.5"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: d ? "#6b7280" : "#9da3b0",
              }}
            >
              {event.date ? (
                <span>
                  {!isNaN(Date.parse(event.date)) && event.date.match(/^\d{4}-\d{2}-\d{2}$/)
                    ? new Date(event.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
                    : event.date}
                </span>
              ) : (
                <span className="italic" style={{ color: d ? "#4b5263" : "#b8beca" }}>Date TBA</span>
              )}
              {event.time && (
                <>
                  <span className="hidden sm:inline" style={{ color: d ? "#3d4252" : "#cbd0da" }}>·</span>
                  <span className="block sm:inline" style={{ color: d ? "#5a6070" : "#adb3bf" }}>{event.time}</span>
                </>
              )}
            </div>

            {event.ods_provided === "Yes" && (
              <div className="sm:hidden mt-1">
                <span
                  className="inline-flex items-center gap-1 text-[#6b52f5] font-semibold px-2 py-0.5 rounded-full border text-[9px] uppercase tracking-wider"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: d ? "#2d2a4a" : "#f0eeff",
                    borderColor: d ? "#4a3f8a" : "#d4ccff",
                  }}
                >
                  <span className="w-1 h-1 rounded-full bg-[#6b52f5] inline-block" />
                  OD Provided
                </span>
              </div>
            )}
          </div>
        </td>

        <td className="py-5 px-4 md:px-6 align-top hidden sm:table-cell max-w-40">
          {event.venue ? (
            <span
              className="line-clamp-2 text-[11.5px] font-medium"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: d ? "#7a8296" : "#5c6270",
              }}
            >
              {event.venue}
            </span>
          ) : (
            <span
              className="italic text-[11px]"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: d ? "#4b5263" : "#b8beca",
              }}
            >
              Location TBA
            </span>
          )}
        </td>

        <td className="py-5 px-4 md:px-6 align-top whitespace-nowrap hidden sm:table-cell">
          {event.ods_provided === "Yes" ? (
            <span
              className="inline-flex items-center gap-1.5 text-[#6b52f5] font-semibold px-2.5 py-1 rounded-full border text-[10px] uppercase tracking-wider"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: d ? "#2d2a4a" : "#f0eeff",
                borderColor: d ? "#4a3f8a" : "#d4ccff",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#6b52f5] inline-block" />
              OD Provided
            </span>
          ) : (
            <span
              className="font-medium tracking-wider text-[10px] uppercase"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: d ? "#4b5263" : "#b8beca",
              }}
            >
              No OD
            </span>
          )}
        </td>

        <td className="py-5 px-2 md:px-6 align-top text-right shrink-0 whitespace-nowrap">
          <div className="flex flex-col items-end gap-3 justify-center h-full pt-1">
            {event.registration_link && (
              <a
                href={event.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white transition-colors duration-300 rounded-lg"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: d ? "#6b52f5" : "#111318",
                }}
              >
                Register
              </a>
            )}
            <div
              className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors duration-300 group-hover:text-[#6b52f5]"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: d ? "#4b5263" : "#b8beca",
              }}
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

      <tr
        className={`border-b ${d ? "border-[#2a2d36]" : "border-[#e4e7ed]"}`}
        style={{ background: d ? "linear-gradient(to bottom, #1a1c24, #1d1f28)" : "linear-gradient(to bottom, #f4f5f8, #f8f9fb)" }}
      >
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
              <div
                className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-10 w-full max-w-5xl pl-4 md:pl-8 border-l-2"
                style={{ borderColor: d ? "#4a3f8a" : "#d4ccff" }}
              >
                <div className="col-span-1 md:col-span-3">
                  <p
                    className="leading-loose font-normal text-[13px] md:text-[14px] whitespace-pre-wrap"
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      color: d ? "#9da3b0" : "#3d4452",
                    }}
                  >
                    {event.description || "No detailed description provided by the organizer."}
                  </p>
                </div>
                <div className="col-span-1 space-y-5 md:pl-4">
                  {event.prize_pool && (
                    <div>
                      <h4
                        className="text-[9px] font-bold uppercase tracking-[0.14em] mb-1"
                        style={{ fontFamily: "'JetBrains Mono', monospace", color: d ? "#4b5263" : "#b8beca" }}
                      >
                        Prize Pool
                      </h4>
                      <p
                        className="font-semibold text-[13px]"
                        style={{ fontFamily: "'Outfit', sans-serif", color: d ? "#e8eaf0" : "#111318" }}
                      >
                        {event.prize_pool}
                      </p>
                    </div>
                  )}
                  <div className="sm:hidden">
                    <h4
                      className="text-[9px] font-bold uppercase tracking-[0.14em] mb-1"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: d ? "#4b5263" : "#b8beca" }}
                    >
                      Venue
                    </h4>
                    <p
                      className="font-semibold text-[13px]"
                      style={{ fontFamily: "'Outfit', sans-serif", color: d ? "#e8eaf0" : "#111318" }}
                    >
                      {event.venue || "TBA"}
                    </p>
                  </div>
                  <div>
                    <h4
                      className="text-[9px] font-bold uppercase tracking-[0.14em] mb-1"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: d ? "#4b5263" : "#b8beca" }}
                    >
                      Schedule Time
                    </h4>
                    <p
                      className="font-semibold text-[13px]"
                      style={{ fontFamily: "'Outfit', sans-serif", color: d ? "#e8eaf0" : "#111318" }}
                    >
                      {event.time || "TBA"}
                    </p>
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
