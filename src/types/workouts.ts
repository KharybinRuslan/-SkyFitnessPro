/** Тренировка из GET /courses/[courseId]/workouts */
export interface WorkoutListItem {
  _id: string;
  name: string;
  video: string;
  exercises: { _id: string; name: string; quantity: number }[];
}

/** Тренировка из GET /workouts/[workoutId] */
export type WorkoutDetails = WorkoutListItem;

/** Прогресс по курсу GET /users/me/progress?courseId= */
export interface CourseProgressResponse {
  courseId: string;
  courseCompleted: boolean;
  workoutsProgress: {
    workoutId: string;
    workoutCompleted: boolean;
    progressData: number[];
  }[];
}

/** Прогресс по одной тренировке GET /users/me/progress?courseId=&workoutId= */
export interface WorkoutProgressResponse {
  workoutId: string;
  workoutCompleted: boolean;
  progressData: number[];
}
