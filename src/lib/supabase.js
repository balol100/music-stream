import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://evufisyrxfrwksequajt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dWZpc3lyeGZyd2tzZXF1YWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NTU2ODIsImV4cCI6MjA4NzEzMTY4Mn0.RenMVEQXkpVy6kA3z6enHy8hmyotUzviSMqCNoA2N7Q";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.localStorage.getItem("musicstream:device-id");
    if (!id) {
      id = (crypto?.randomUUID?.() ?? "dev-" + Math.random().toString(36).slice(2)) + "";
      window.localStorage.setItem("musicstream:device-id", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export const DEVICE_ID = getOrCreateDeviceId();
