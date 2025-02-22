import { Button } from "@/components/ui/button";
import BackButton from "@/components/back-button";
import Navbar from "@/components/navbar";



export default async function MonitoringPage({params}){
      return (
        <div className="min-h-screen bg-white">
          <Navbar />

          {/* Main Content */}
          <main className="p-8">
            {/* Student Info */}
            <div className="mb-8 space-y-1">
              <p className="text-xl">Nome: Gabriel da Silva</p>
              <p className="text-xl">NºMec: 148394</p>
              <p className="text-xl">@email: gabriel@ua.pt</p>
            </div>
            <div className="flex justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Code Editor and Console */}
                <div className="bg-[#1E1E1E] rounded-lg p-4 h-[700px] overflow-auto">
                  <pre className="text-green-400 font-mono text-sm">
                    {`// Code editor content
                        function example() {
                          // Your code here
                        }`}
                  </pre>
                </div>
                <div className="bg-black rounded-lg p-4 h-[700px] overflow-auto">
                  <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                    {`-991/7 I/WifiService: reportActivityInfo uid=1000
                        -991/7 I/WifiService: getSupportedFeatures uid=1000
                        152-23884/7 W/TileUtils: Found com.android.settings.backup.BackupSettingsActivity
                        152-23884/7 D/Settings: No enabled state changed, skipping updateCategory call
                        152-28452/7 D/DashboardSummary: Listening for condition changes
                        152-28452/7 D/DashboardSummary: onConditionsChanged`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center space-x-4">
              <Button variant="secondary" className="bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]">
                + Add Time
              </Button>
              <Button variant="secondary" className="bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]">
                − Reduce Time
              </Button>
              <Button variant="destructive">× End Exam</Button>
            </div>


            {/* Back Button */}
            <div className="mt-8">
              <BackButton />
            </div>
          </main>
        </div>
      );
}