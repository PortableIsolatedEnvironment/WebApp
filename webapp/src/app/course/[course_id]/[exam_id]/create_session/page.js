"use client"; // Next.js requer isto para usar useState e eventos no lado do cliente.

import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PopupButton from "@/components/ui/button-popup";
import BackButton from "@/components/back-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

// Fix form structure to make button work

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

        {/* Attach Files Section */}
        <div className="mt-6 mb-8 border border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
          <div className="flex flex-col items-center">
            <Label htmlFor="exam_file" className="text-sm font-medium mb-3">
              Attach Files
            </Label>
            <div className="w-full max-w-md">
              <div className="flex flex-col items-center justify-center w-full">
                <label htmlFor="exam_file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-3 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF, DOCX, or other document files</p>
                  </div>
                  <Input 
                    id="exam_file" 
                    type="file"
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons Section */}
        <div className="mt-8 flex justify-between items-center">
          {/* Back Button */}
          <BackButton />

          {/* Create Exam Button */}
          <Button type="submit" variant="outline" className="bg-white text-black border border-black hover:bg-gray-100">
            Create Session
          </Button>
        </div>
      </form>
    </main>
  </div>
);
}
