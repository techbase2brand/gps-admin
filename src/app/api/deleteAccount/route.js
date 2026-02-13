import client from "../client";
import { NextResponse } from "next/server"; // If using Next.js

export async function POST(request) {
  try {
    // 1. Await the JSON body
    const { id, deleteAccount } = await request.json();

    if (!id || deleteAccount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Check if user exists
    const { data: isPresent, error: fetchError } = await client
      .from("staff")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !isPresent) {
      return NextResponse.json({ error: "User does not exist" }, { status: 404 });
    }

    // 3. Correct Update syntax: .update({ field: value }).eq('id', id)
    const { error: updateError } = await client
      .from("staff")
      .update({ deleteAccount: true }) 
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "Data not updated", details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Updated successfully" }, { status: 200 });

  } catch (error) {
    // 4. Proper error logging
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}