export interface CounterStats {
  maxDay: { date: Date; value: number } | null;
  beforeYesterday: number;
  yesterday: number;
  totalPassages: number;
  firstPassageDate: Date | null;
  lastPassageDate: Date | null;
  lastPassageBeforeYesterday: Date | null;
  lastPassageYesterday: Date | null;
}

export interface HourlyStats {
  monday: { hour: number; value: number }[];
  tuesday: { hour: number; value: number }[];
  wednesday: { hour: number; value: number }[];
  thursday: { hour: number; value: number }[];
  friday: { hour: number; value: number }[];
  saturday: { hour: number; value: number }[];
  sunday: { hour: number; value: number }[];
}

export interface WeeklyStats {
  currentWeek: { day: string; value: number | null }[];
  lastWeek: { day: string; value: number | null }[];
  currentWeekAverage: number;
  lastWeekAverage: number;
  globalAverage: number;
}

export interface DailyBarStats {
  year: { day: string; value: number }[];
  globalAverage: number;
  activeDaysAverage: number;
}

export interface YearlyStats {
  year: number;
  total: number;
}

export interface YearlyProgressStats {
  year: number;
  total: number;
  yearToDate: number;
}

export interface CounterData {
  counterId: string;
  counterStats: CounterStats;
  hourlyStats: HourlyStats;
  weeklyStats: WeeklyStats;
  dailyBarStats: DailyBarStats;
  counterIsActive: boolean;
  yearlyStats?: YearlyStats[];
  yearlyProgressStats?: YearlyProgressStats;
}

export interface DailyTotal {
  day: string;
  value: number;
  count: number;
}

export interface DailyDataPoint {
  day: string;
  value: number;
}


export interface CounterGlobalDailyStats {
  dailyTotals: DailyTotal[];
  globalAverage: number;
  totalDays: number;
  originalDays: number;
  filteredDays: number;
}

export interface PreloadedCounterData {
  counterGlobalDailyStats?: CounterGlobalDailyStats;
  counters: CounterData[];
}
