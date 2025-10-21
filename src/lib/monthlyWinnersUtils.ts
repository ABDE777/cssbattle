import { supabase } from "@/integrations/supabase/client";

interface Player {
  id: string;
  full_name: string;
  email: string;
  score: number;
  group_name: string | null;
}

interface MonthlyWinner {
  player_id: string;
  full_name: string;
  email: string;
  score: number;
  group_name: string | null;
  winning_month: string;
  position: number;
}

export const saveMonthlyWinners = async (): Promise<boolean> => {
  try {
    // Get the first day of the current month
    const now = new Date();
    const winningMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Format as YYYY-MM-DD for database storage
    const winningMonthString = winningMonth.toISOString().split('T')[0];
    
    // Check if winners for this month already exist
    const { data: existingWinners, error: checkError } = await supabase
      .from("monthly_winners")
      .select("id")
      .eq("winning_month", winningMonthString);
    
    if (checkError) {
      console.error("Error checking existing winners:", checkError);
      return false;
    }
    
    // If winners already exist for this month, don't save again
    if (existingWinners && existingWinners.length > 0) {
      console.log("Winners already saved for this month");
      return true;
    }
    
    // Get top 3 players ordered by score
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, full_name, email, score, group_name")
      .order("score", { ascending: false })
      .limit(3);
    
    if (playersError) {
      console.error("Error fetching players:", playersError);
      return false;
    }
    
    // Prepare winner data
    const winnersData: MonthlyWinner[] = players.map((player, index) => ({
      player_id: player.id,
      full_name: player.full_name,
      email: player.email,
      score: player.score || 0,
      group_name: player.group_name,
      winning_month: winningMonthString,
      position: index + 1
    }));
    
    // Insert winners into database
    const { error: insertError } = await supabase
      .from("monthly_winners")
      .insert(winnersData);
    
    if (insertError) {
      console.error("Error saving monthly winners:", insertError);
      return false;
    }
    
    console.log("Monthly winners saved successfully");
    return true;
  } catch (error) {
    console.error("Error in saveMonthlyWinners:", error);
    return false;
  }
};

export const getMonthlyWinners = async (month?: string) => {
  try {
    let query = supabase
      .from("monthly_winners")
      .select("*")
      .order("winning_month", { ascending: false })
      .order("position", { ascending: true });

    if (month) {
      query = query.eq("winning_month", month);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching monthly winners:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getMonthlyWinners:", error);
    return null;
  }
};