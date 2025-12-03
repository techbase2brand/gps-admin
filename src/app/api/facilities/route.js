import { NextResponse } from "next/server";

// Temporary mock database
let facilities = [];

export async function GET(req) {
  return NextResponse.json(facilities);
}

export async function POST(req) {
  const body = await req.json();
  const newFacility = { id: Date.now(), ...body };
  facilities.push(newFacility);
  return NextResponse.json(newFacility);
}

export async function PUT(req) {
  const body = await req.json();
  facilities = facilities.map((item) =>
    item.id === body.id ? { ...item, ...body } : item
  );
  return NextResponse.json({ message: "Updated", updated: body });
}

export async function DELETE(req) {
  const { id } = await req.json();
  facilities = facilities.filter((item) => item.id !== id);
  return NextResponse.json({ message: "Deleted", id });
}
