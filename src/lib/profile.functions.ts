import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface Profile {
  id: string;
  restaurant_name: string | null;
}

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Profile> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, restaurant_name")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    // Fallback in case the signup trigger has not populated a row yet.
    return data ?? { id: userId, restaurant_name: null };
  });

export const updateRestaurantName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { restaurantName: string }) =>
    z.object({ restaurantName: z.string().trim().min(1).max(120) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<Profile> => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("profiles")
      .upsert(
        { id: userId, restaurant_name: data.restaurantName },
        { onConflict: "id" },
      )
      .select("id, restaurant_name")
      .single();

    if (error) throw new Error(error.message);
    return row;
  });
