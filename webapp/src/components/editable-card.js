'use client'; 
import { Button } from "@/components/ui/button";
import { Pencil, Router, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import { sessionService } from "@/api/services/sessionService";

export default function TestCard({ 
  name, 
  description, 
  link, 
  edit_link, 
  type = 'exam', // 'exam' or 'session'
  courseId = '',
  examId = '',
  sessionId = '', // Only needed for session deletion
  onDeleteSuccess, // Callback after successful deletion
}) {
  const router = useRouter();
  // Sanitize type and provide verbose logging
  const validType = ['exam', 'session'].includes(type) ? type : 'exam';
  if (validType !== type) {
    console.error(`Invalid type prop "${type}" provided. Using "${validType}" instead.`);
  }
  
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Delete button clicked", { type: validType, courseId, examId, sessionId });
    
    // Confirm deletion with user
    const confirmMessage = `Are you sure you want to delete this ${validType}?`;
    if (!window.confirm(confirmMessage)) {
      console.log("User canceled deletion");
      return;
    }
    
    // Validate required props before making the request
    if (!courseId) {
      console.error("Missing courseId - cannot delete");
      alert(`Cannot delete ${validType}: Missing course ID`);
      return;
    }
    
    if (!examId) {
      console.error("Missing examId - cannot delete");
      alert(`Cannot delete ${validType}: Missing exam ID`);
      return;
    }
    
    if (validType === 'session' && !sessionId) {
      console.error("Missing sessionId - cannot delete session");
      alert("Cannot delete session: Missing session ID");
      return;
    }
    
    setIsDeleting(true);
    
    try {
      let response;
      let success = false;
      
      if (validType === 'exam') {
        const endpoint = ENDPOINTS.EXAM_DELETE(courseId, examId);
        console.log(`Attempting to delete ${validType} with endpoint:`, endpoint);
        
        // Make the delete request
        response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        // Check fetch response
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        success = true;
      } else {
        // For sessions, use the service directly
        console.log(`Attempting to delete session with courseId: ${courseId}, examId: ${examId}, sessionId: ${sessionId}`);
        try {
          await sessionService.deleteSession(courseId, examId, sessionId);
          success = true;
        } catch (serviceError) {
          throw new Error(`Service error: ${serviceError.message}`);
        }
      }
      
      if (success) {
        console.log(`${validType} deleted successfully`);
        
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
      }
      router.refresh();
    } catch (error) {
      console.error(`Error deleting ${validType}:`, error);
      alert(`Failed to delete ${validType}. Please try again. (${error.message})`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="group relative rounded-lg border bg-[#1C1C1C] p-6 hover:bg-[#242424] transition-colors">
      <Link href={link} className="block cursor-pointer">
        <div>
          <h2 className="text-lg font-semibold text-white">{name}</h2>
          <p className="mt-2 text-sm text-gray-400">{description || "No description available"}</p>
        </div>
      </Link>

      {/* Edit Button */}
      <Link href={edit_link} >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-12 text-white"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </Link>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-4 right-4 text-white opacity-60 hover:opacity-100">    
        <Trash2 className="h-4 w-4" />
        {isDeleting && <span className="sr-only">Deleting...</span>}
      </Button>
    </div>
  );
}