import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting Master badge management...');

    // Get current month (YYYY-MM-01 format)
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    
    console.log('Current month:', currentMonth);

    // Get the first place winner for the current month
    const { data: currentWinner, error: winnerError } = await supabase
      .from('monthly_winners')
      .select('player_id, full_name, winning_month')
      .eq('winning_month', currentMonth)
      .eq('position', 1)
      .maybeSingle();

    if (winnerError) {
      console.error('Error fetching current winner:', winnerError);
      throw winnerError;
    }

    console.log('Current winner:', currentWinner);

    // Remove Master badge from all players
    const { error: removeError } = await supabase
      .from('players')
      .update({ 
        badges: supabase.rpc('array_remove', { arr: 'badges', elem: 'Master' })
      })
      .not('badges', 'is', null);

    // Note: We're using a simple approach - fetch all players and update them individually
    // This is more reliable than trying to use array functions
    const { data: allPlayers, error: fetchError } = await supabase
      .from('players')
      .select('id, badges');

    if (fetchError) {
      console.error('Error fetching players:', fetchError);
      throw fetchError;
    }

    // Remove Master badge from all players
    for (const player of allPlayers || []) {
      if (player.badges && player.badges.includes('Master')) {
        const updatedBadges = player.badges.filter((badge: string) => badge !== 'Master');
        await supabase
          .from('players')
          .update({ badges: updatedBadges })
          .eq('id', player.id);
      }
    }

    console.log('Removed Master badge from all players');

    // Add Master badge to current winner if exists
    if (currentWinner) {
      const { data: currentPlayer, error: playerError } = await supabase
        .from('players')
        .select('id, badges')
        .eq('id', currentWinner.player_id)
        .single();

      if (playerError) {
        console.error('Error fetching current winner player:', playerError);
        throw playerError;
      }

      // Add Master badge if not already present
      const currentBadges = currentPlayer.badges || [];
      if (!currentBadges.includes('Master')) {
        const updatedBadges = [...currentBadges, 'Master'];
        
        const { error: updateError } = await supabase
          .from('players')
          .update({ badges: updatedBadges })
          .eq('id', currentWinner.player_id);

        if (updateError) {
          console.error('Error updating winner badges:', updateError);
          throw updateError;
        }

        console.log(`Added Master badge to ${currentWinner.full_name}`);
      }
    } else {
      console.log('No current month winner found');
    }

    return new Response(
      JSON.stringify({
        success: true,
        currentWinner: currentWinner?.full_name || null,
        message: currentWinner
          ? `Master badge awarded to ${currentWinner.full_name}`
          : 'No current month winner to award badge',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in manage-master-badge function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
