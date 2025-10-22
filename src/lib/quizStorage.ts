// Utility functions for managing quiz-related localStorage data

interface QuizStorageData {
  completed: boolean;
  score?: number;
}

/**
 * Get quiz completion status from localStorage
 * @param userId - The user's ID
 * @returns QuizStorageData or null if not found
 */
export const getQuizStorageData = (userId: string): QuizStorageData | null => {
  try {
    const completionKey = `quiz_completed_${userId}`;
    const scoreKey = `quiz_score_${userId}`;
    
    const completed = localStorage.getItem(completionKey) === "true";
    const scoreStr = localStorage.getItem(scoreKey);
    const score = scoreStr ? parseInt(scoreStr, 10) : undefined;
    
    if (completed) {
      return { completed: true, score };
    }
    
    // If not completed, return null to indicate no valid data
    return null;
  } catch (error) {
    console.error("Error reading quiz data from localStorage:", error);
    return null;
  }
};

/**
 * Save quiz completion status to localStorage
 * @param userId - The user's ID
 * @param score - The quiz score
 */
export const saveQuizStorageData = (userId: string, score: number): void => {
  try {
    const completionKey = `quiz_completed_${userId}`;
    const scoreKey = `quiz_score_${userId}`;
    
    localStorage.setItem(completionKey, "true");
    localStorage.setItem(scoreKey, score.toString());
  } catch (error) {
    console.error("Error saving quiz data to localStorage:", error);
  }
};

/**
 * Clear quiz completion status from localStorage
 * @param userId - The user's ID
 */
export const clearQuizStorageData = (userId: string): void => {
  try {
    const completionKey = `quiz_completed_${userId}`;
    const scoreKey = `quiz_score_${userId}`;
    
    localStorage.removeItem(completionKey);
    localStorage.removeItem(scoreKey);
  } catch (error) {
    console.error("Error clearing quiz data from localStorage:", error);
  }
};

/**
 * Sync localStorage with database data
 * @param userId - The user's ID
 * @param dbScore - The score from database (null if not completed)
 * @returns true if localStorage was updated, false if it was cleared
 */
export const syncQuizStorageWithDatabase = (userId: string, dbScore: number | null): boolean => {
  try {
    if (dbScore !== null) {
      // User has completed quiz in database, ensure localStorage is up to date
      saveQuizStorageData(userId, dbScore);
      return true;
    } else {
      // User has not completed quiz in database, clear localStorage
      clearQuizStorageData(userId);
      return false;
    }
  } catch (error) {
    console.error("Error syncing quiz data with database:", error);
    return false;
  }
};