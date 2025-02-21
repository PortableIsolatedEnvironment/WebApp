import { Button } from "@/components/ui/button";

export default async function SessionPage({ params }) {

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold">Session Page</h1>

      {/* Back button */}
      <div className="mt-8">
        <Button variant="outline" className="text-white bg-[#1C1C1C] hover:bg-[#242424]">
          Back
        </Button>
      </div>
  </div>
  );
}