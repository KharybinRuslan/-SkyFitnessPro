/** Курс из API GET /api/fitness/courses (список) */
export interface CourseListItem {
  _id: string;
  nameRU: string;
  nameEN: string;
  description?: string;
  directions?: string[];
  fitting?: string[];
  workouts?: string[];
  difficulty?: string;
  durationInDays?: number;
  dailyDurationInMinutes?: { from: number; to: number };
}

/** Курс из API GET /api/fitness/courses/[courseId] (полные данные) */
export interface CourseDetails extends CourseListItem {
  difficulty?: string;
  durationInDays?: number;
  dailyDurationInMinutes?: { from: number; to: number };
}
