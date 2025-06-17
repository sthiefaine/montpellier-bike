const dayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' });

export const WEEK_DAYS_CONFIG = {
  monday: { key: "monday", name: dayFormatter.format(new Date(2024, 0, 1)), color: "#9333EA" },
  tuesday: { key: "tuesday", name: dayFormatter.format(new Date(2024, 0, 2)), color: "#2563eb" },
  wednesday: { key: "wednesday", name: dayFormatter.format(new Date(2024, 0, 3)), color: "#00FF00" },
  thursday: { key: "thursday", name: dayFormatter.format(new Date(2024, 0, 4)), color: "#FF0000" },
  friday: { key: "friday", name: dayFormatter.format(new Date(2024, 0, 5)), color: "#f59e0b" },
  saturday: { key: "saturday", name: dayFormatter.format(new Date(2024, 0, 6)), color: "#FFE000" },
  sunday: { key: "sunday", name: dayFormatter.format(new Date(2024, 0, 7)), color: "#14b8a6" },
} as const;