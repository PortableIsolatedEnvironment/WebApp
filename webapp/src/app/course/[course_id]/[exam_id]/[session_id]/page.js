import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import BackButton from "@/components/back-button";
import { sessionService } from "@/api/services/sessionService";

export default async function SessionPage({ params }) {
  const { course_id, exam_id, session_id } = await params;
  const session = await sessionService.getSession(course_id, exam_id, session_id);
  console.log(session);  
  
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">{session.name}</h1>
        {/* Generate Code Section */}
        <div className="flex flex-col items-center justify-center mb-12 mt-8">
          <div className="flex flex-col items-center gap-6 p-8 rounded-lg bg-gray-50 w-full max-w-2xl">
            <div className="text-4xl font-mono font-semibold tracking-wider">{session.id}</div>
          </div>
        </div> 
      
        {/* Broadcast Message */}
        <div className="bg-gray-100 p-3 rounded-lg mb-8 flex items-center gap-2">
          <span className="font-medium">Broadcast Message:</span>
          <span>The exam will end in 5 minutes!</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button className="bg-[#5BA87A] hover:bg-[#4A8B65]">Send</Button>
          <Button className="bg-[#993333] hover:bg-[#7A2929]">Clear</Button>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>PIN/Key</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              {
                id: 1,
                name: "Ronald Richards",
                pin: "50431",
                startTime: "10:00",
                endTime: "12:00",
              },
              {
                id: 2,
                name: "Dianne Robertson",
                pin: "50487",
                startTime: "10:04",
                endTime: "12:04",
              },
              {
                id: 3,
                name: "Jerome Bell",
                pin: "50532",
                startTime: "10:02",
                endTime: "12:02",
              },
              {
                id: 4,
                name: "Kristin Watson",
                pin: "50584",
                startTime: "10:00",
                endTime: "12:00",
              },
              {
                id: 5,
                name: "Bessie Cooper",
                pin: "50474",
                startTime: "10:01",
                endTime: "12:01",
              },
              {
                id: 6,
                name: "Cameron Williamson",
                pin: "50588",
                startTime: "10:05",
                endTime: "12:05",
              },
            ].map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.id}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.pin}</TableCell>
                <TableCell>{student.startTime}</TableCell>
                <TableCell>{student.endTime}</TableCell>
                <TableCell>Connected</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    ⚙   {/*FALTA METER ISTO A DAR REDIRECT PRA PROXIMA PAGINA  */}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>


        {/* Back Button */}
        <div className="mt-8">
          <BackButton />
        </div>
      </main>
  </div>
  );
}