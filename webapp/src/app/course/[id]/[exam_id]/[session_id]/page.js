import { headers } from "next/headers";
import { Button } from "@/components/ui/button";

export default async function SessionPage({ params }) {
  const referer = headers().get("referer"); // get the referer header
  console.log("Referer:", referer);
  console.log("Previous page:", )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold">AAAAA</h1>

      {/* Back button */}
      <div className="mt-8">
        <Button variant="outline" className="text-white bg-[#1C1C1C] hover:bg-[#242424]">
          Back
        </Button>
      </div>
  </div>
  );
}