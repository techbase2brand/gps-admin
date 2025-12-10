import { NextResponse } from "next/server";

// Temporary mock database for cars
let cars = [];

/**
 * GET - Fetch all cars
 */
export async function GET(req) {
  return NextResponse.json(cars);
}

/**
 * POST - Add a new car
 */
export async function POST(req) {
  const body = await req.json();
  // Status depends on chip: if chip exists → Assigned, else → Unassigned
  const status = body.chip && body.chip.trim() ? "Assigned" : "Unassigned";
  const newCar = { id: Date.now(), ...body, assignedDate: null, status };
  cars.push(newCar);
  return NextResponse.json(newCar);
}

/**
 * PUT - Update existing car
 */
export async function PUT(req) {
  const body = await req.json();
  // Status depends on chip: if chip exists → Assigned, else → Unassigned
  const status = body.chip && body.chip.trim() ? "Assigned" : "Unassigned";
  cars = cars.map((item) =>
    item.id === body.id ? { ...item, ...body, status } : item
  );
  return NextResponse.json({ message: "Updated", updated: body });
}

/**
 * PATCH - Update tracker and status
 */
export async function PATCH(req) {
  const { id, trackerNo, status, assignedDate } = await req.json();
  cars = cars.map((item) =>
    item.id === id ? { ...item, trackerNo, status, assignedDate } : item
  );
  return NextResponse.json({ message: "Tracker and status updated", id });
}

/**
 * DELETE - Delete car by ID
 */
export async function DELETE(req) {
  const { id } = await req.json();
  cars = cars.filter((item) => item.id !== id);
  return NextResponse.json({ message: "Deleted", id });
}
