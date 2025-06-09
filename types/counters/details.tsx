export interface HourlyStatsDetailsTypes {
  year: number;
  week: {
    number: number;
    startDate: Date;
    endDate: Date;
    stats: {
      monday: { hour: number; value: number }[];
      tuesday: { hour: number; value: number }[];
      wednesday: { hour: number; value: number }[];
      thursday: { hour: number; value: number }[];
      friday: { hour: number; value: number }[];
      saturday: { hour: number; value: number }[];
      sunday: { hour: number; value: number }[];
    };
  };
  availableYears: {
    start: number;
    end: number;
  };
}

export interface PreloadedCounterDetailsData {
  counterId: string;
  counterStats: {
    maxDay: { date: Date; value: number } | null;
    beforeYesterday: number;
    yesterday: number;
    totalPassages: number;
    firstPassageDate: Date | null;
    lastPassageDate: Date | null;
    lastPassageBeforeYesterday: Date | null;
    lastPassageYesterday: Date | null;
  };
  hourlyStats: HourlyStatsDetailsTypes[] | null;
  weeklyStats: {
    currentWeek: { day: string; value: number | null }[];
    lastWeek: { day: string; value: number | null }[];
    currentWeekAverage: number;
    lastWeekAverage: number;
    globalAverage: number;
  };
  dailyBarStats: {
    year: { day: string; value: number }[];
    globalAverage: number;
    activeDaysAverage: number;
  };
  counterIsActive: boolean;
  yearlyStats?: { year: number; total: number }[];
  yearlyProgressStats?: { year: number; total: number; yearToDate: number }[];
}