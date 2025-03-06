"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, Upload } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import BackButton from "@/components/back-button"
import { sessionService } from "@/api/services/sessionService"

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  date: z.date({
    required_error: "A date is required.",
  }),
  room: z.string().min(1, {
    message: "Room is required.",
  }),
  duration: z.string().min(1, {
    message: "Duration is required.",
  }),
})

export default function EditSessionForm() {
    const [files, setFiles] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [sessionData, setSessionData] = useState(null)
    
    const params = useParams()
    const router = useRouter()
    const { course_id, exam_id, session_id } = params

    const handleDragOver = (e) => {
      e.preventDefault()
      e.stopPropagation()
    }
    
    const handleDrop = (e) => {
      e.preventDefault()
      e.stopPropagation()

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFiles = Array.from(e.dataTransfer.files)
        setFiles(prevFiles => [...prevFiles, ...droppedFiles])
        e.dataTransfer.clearData()
      }
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const selectedFiles = Array.from(e.target.files)
          setFiles(prevFiles => [...prevFiles, ...selectedFiles])
        }
    }
  
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            room: "",
            duration: "02:00",
        },
    })

    useEffect(() => {
        async function fetchSessionData() {
            try {
                setIsLoading(true)
                const data = await sessionService.getSession(course_id, exam_id, session_id)
                setSessionData(data)
                
                // Update form values
                form.reset({
                    title: data.name,
                    room: data.room,
                    date: new Date(data.date),
                    duration: data.duration.slice(0, 5), // Format HH:MM from HH:MM:SS
                })
                
                setIsLoading(false)
            } catch (err) {
                console.error("Failed to fetch session data:", err)
                setError("Failed to load session data. Please try again.")
                setIsLoading(false)
            }
        }
        
        fetchSessionData()
    }, [course_id, exam_id, session_id, form])
      

    async function onSubmit(values) {
      try {
        setIsSubmitting(true)
        setError(null)
        
        const formattedDate = format(values.date, "yyyy-MM-dd")
        
        const updatedSession = {
          exam_id: Number(exam_id),
          course_id: course_id,
          name: values.title,
          date: formattedDate,
          duration: values.duration + ":00",
          room: values.room,
          exam_file: sessionData?.exam_file || "" // Preserve existing file if no new one
        }

        try {
          await sessionService.updateSession(course_id, exam_id, session_id, updatedSession)
          
          if (files.length > 0) {
            for (const file of files) {
              const formData = new FormData()
              formData.append('exam_file', file)
              
              try {
                await sessionService.uploadFile(course_id, exam_id, session_id, formData)
              } catch (uploadError) {
                throw new Error(`Failed to upload file: ${uploadError.message}`)
              }
            }
          }
          
          alert("Session updated successfully!") //*  ADD TOAST HERE
          router.push(`/course/${course_id}/${exam_id}`)
        } catch (apiError) {
          throw new Error(`API error: ${apiError.message}`)
        }
      } catch (err) {
        setError(err.message || "An error occurred while updating the session")
        console.error(err)
      } finally {
        setIsSubmitting(false)
      }
    }
  
    if (isLoading) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <Skeleton className="h-10 w-3/4 mb-6" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-40 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      )
    }
  
    if (error && !sessionData) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">Error Loading Session</h1>
          <p className="text-red-500">{error}</p>
          <div className="mt-4">
            <BackButton />
          </div>
        </div>
      )
    }
    
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Session</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Session Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "yyyy-MM-dd") : <span>YYYY-MM-DD</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="room"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room</FormLabel>
                    <FormControl>
                      <Input placeholder="Room Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (hours:minutes)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          min="0" 
                          max="10" 
                          placeholder="Hours" 
                          value={field.value.split(':')[0] || ""}
                          onChange={(e) => {
                            const hours = e.target.value;
                            const minutes = field.value.split(':')[1] || "00";
                            field.onChange(`${hours.padStart(2, '0')}:${minutes}`);
                          }}
                          className="w-20"
                        />
                        <span>:</span>
                        <Input 
                          type="number" 
                          min="0" 
                          max="59" 
                          placeholder="Minutes" 
                          value={field.value.split(':')[1] || ""}
                          onChange={(e) => {
                            const hours = field.value.split(':')[0] || "00";
                            const minutes = e.target.value;
                            field.onChange(`${hours}:${minutes.padStart(2, '0')}`);
                          }}
                          className="w-20"
                        />
                        <span className="ml-2 text-sm text-muted-foreground">
                          Total duration (e.g., 02:00 for 2 hours)
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Current File:</p>
              <p className="text-sm text-muted-foreground">
                {sessionData?.exam_file ? sessionData.exam_file.split('/').pop() : "No file currently uploaded"}
              </p>
            </div>

            <div
              className="border border-dashed rounded-md p-10 text-center cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium">Update Files</p>
                  <p className="text-xs text-muted-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, or other document files</p>
                </div>
                <Input type="file" className="hidden" id="file-upload" multiple onChange={handleFileChange} />
                <label
                  htmlFor="file-upload"
                  className="mt-2 inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                >
                  Select Files
                </label>
              </div>
              {files.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium">New Files to Upload:</p>
                  <ul className="text-sm text-muted-foreground mt-1">
                    {files.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <BackButton />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Session"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    )
}