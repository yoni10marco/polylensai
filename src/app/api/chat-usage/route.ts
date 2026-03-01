import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const FREE_LIMIT = 3;

export async function GET() {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    // Get tier from profiles
    const { data: profile } = await supabase
        .from("profiles").select("tier").eq("id", user.id).single();
    const tier = profile?.tier || "free";

    if (tier !== "free") {
        return NextResponse.json({ used: 0, limit: null, tier });
    }

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const { data: usage } = await supabase
        .from("user_usage").select("messages_today, last_message_date").eq("user_id", user.id).single();

    const isToday = usage?.last_message_date === today;
    const used = isToday ? (usage?.messages_today ?? 0) : 0;

    return NextResponse.json({ used, limit: FREE_LIMIT, tier });
}

export async function POST(_req: NextRequest) {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { data: profile } = await supabase
        .from("profiles").select("tier").eq("id", user.id).single();
    const tier = profile?.tier || "free";

    // Pro users are always allowed
    if (tier !== "free") {
        return NextResponse.json({ allowed: true, used: null, limit: null, tier });
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await supabase
        .from("user_usage").select("messages_today, last_message_date").eq("user_id", user.id).single();

    const isToday = existing?.last_message_date === today;
    const currentCount = isToday ? (existing?.messages_today ?? 0) : 0;

    if (currentCount >= FREE_LIMIT) {
        return NextResponse.json({ allowed: false, used: currentCount, limit: FREE_LIMIT, tier });
    }

    // Upsert: reset counter if new day, otherwise increment
    await supabase.from("user_usage").upsert({
        user_id: user.id,
        messages_today: isToday ? currentCount + 1 : 1,
        last_message_date: today,
        updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return NextResponse.json({ allowed: true, used: currentCount + 1, limit: FREE_LIMIT, tier });
}
