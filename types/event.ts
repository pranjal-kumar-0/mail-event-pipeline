export interface VitapEvent {
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

export type TabType = "upcoming" | "past" | "no-date";
export type SortBy = "date" | "od" | null;
export type SortOrder = "asc" | "desc";
