import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// export const supabase = createClient(supabaseUrl, supabaseKey);
export const supabase = createClient('https://kmutxypmblbtfaverwqx.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttdXR4eXBtYmxidGZhdmVyd3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDQwMTIsImV4cCI6MjA2NTMyMDAxMn0.pmvSSzgYE80Mla_RsoO89of2-u4B-_rFubeXV0f5vs0');
