"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestSupabasePage() {
  const supabase = createClient();

  const [result, setResult] = useState("Waiting...");
  const [loading, setLoading] = useState(false);

  async function testSignup() {
    setLoading(true);
    setResult("Testing Supabase...");

    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = "TestPassword123!";

    console.log("TEST EMAIL:", testEmail);

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    console.log("SIGNUP DATA:", data);
    console.log("SIGNUP ERROR:", error);

    if (error) {
      setResult(`ERROR: ${error.message}`);
    } else if (data.user) {
      setResult(`SUCCESS. User ID: ${data.user.id}`);
    } else {
      setResult("No error, but Supabase returned no user.");
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">

        <h1 className="text-2xl font-bold">
          Supabase Connection Test
        </h1>

        <p className="mt-2 text-gray-600">
          This page only tests Supabase authentication.
        </p>

        <button
          onClick={testSignup}
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-green-700 px-4 py-3 font-semibold text-white"
        >
          {loading ? "Testing..." : "Test Supabase Signup"}
        </button>

        <div className="mt-6 rounded-xl bg-gray-100 p-4">
          <p className="break-words text-sm">
            {result}
          </p>
        </div>

      </div>
    </main>
  );
}