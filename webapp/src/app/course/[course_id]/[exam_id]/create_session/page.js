"use client"; // Next.js requer isto para usar useState e eventos no lado do cliente.

import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PopupButton from "@/components/ui/button-popup";
import BackButton from "@/components/back-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ExamCreation() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("05/11/2023");
  const [room, setRoom] = useState("");
  const [duration, setDuration] = useState("2:00");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Exam Created:", { title, date, room, duration });
    alert("Exam successfully created!");
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-8">
        <form onSubmit={handleSubmit} className="grid gap-6">
          <h1 className="text-2xl font-semibold">Create Exam Session</h1>
          {/* Título */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              placeholder="Session Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Data, Sala e Duração */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Data */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                <Button variant="ghost" size="icon" className="absolute right-0 top-0">
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Sala */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Room</label>
              <Select onValueChange={setRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anf-iv">Anf. IV</SelectItem>
                  <SelectItem value="anf-v">Anf. V</SelectItem>
                  <SelectItem value="23.01.05">23.01.05</SelectItem>
                  <SelectItem value="23.01.06">23.01.06</SelectItem>
                  <SelectItem value="23.01.07">23.01.07</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duração */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration</label>
              <Input
                type="text"
                placeholder="2:00"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>
          </div>
        </form>

        {/* Buttons Section */}
        <div className="mt-8 flex justify-between items-center">
          {/* Back Button */}
          <BackButton />

          {/* Upload Exam & New Button */}
          <div className="flex gap-4">
            <PopupButton buttonText="PDF File" title="Custom Title" content="This is a customizable pop-up!" />
            <PopupButton buttonText="Multiple Choice" title="Custom Title" content="This is a customizable pop-up!" />
          </div>

          {/* Create Exam Button */}
          <Button type="submit" variant="outline" className="bg-white text-black border border-black hover:bg-gray-100">
            Create Session
          </Button>
        </div>
      </main>
    </div>
  );
}
