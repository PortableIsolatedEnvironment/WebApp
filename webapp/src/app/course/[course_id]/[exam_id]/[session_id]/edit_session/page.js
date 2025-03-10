"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, Upload, Link as LinkIcon, AlertCircle } from "lucide-react"
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
import { format, parse } from "date-fns"
import BackButton from "@/components/back-button"
import { sessionService } from "@/api/services/sessionService"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert } from "@/components/ui/alert"
import { toast, Toaster } from "sonner"

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
  examLink: z
    .string()
    .url("Please enter a valid URL starting with http:// or https://")
    .optional()
    .or(z.literal("")),
})

export default function EditSessionForm() {
    const [files, setFiles] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [sessionData, setSessionData] = useState(null)
    const [activeTab, setActiveTab] = useState("files")
    const [formError, setFormError] = useState("")
    
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
        // Convert FileList to array and update state
        const droppedFiles = Array.from(e.dataTransfer.files)
        setFiles(prevFiles => [...prevFiles, ...droppedFiles])
        e.dataTransfer.clearData()
      }
    }

    const handleFileChange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        // Convert FileList to array and update state
        const selectedFiles = Array.from(e.target.files)
        setFiles(prevFiles => [...prevFiles, ...selectedFiles])
      }
    }
    
    const handleRemoveFile = (indexToRemove) => {
      setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove))
    }
  
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            room: "",
            duration: "02:00",
            examLink: "",
        },
    })

    // Load session data
    useEffect(() => {
        async function fetchSessionData() {
            try {
                setIsLoading(true)
                const data = await sessionService.getSession(course_id, exam_id, session_id)
                setSessionData(data)
                
                // Set the active tab based on whether the session has an exam link
                if (data.exam_link && data.exam_link.trim() !== '') {
                    setActiveTab("link")
                } else {
                    setActiveTab("files")
                }

                // Convert duration from seconds to HH:MM format
                let formattedDuration = "02:00" // Default
                if (data.duration) {
                    const totalSeconds = parseInt(data.duration)
                    
                    if (!isNaN(totalSeconds)) {
                        const hours = Math.floor(totalSeconds / 3600)
                        const minutes = Math.floor((totalSeconds % 3600) / 60)
                        formattedDuration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                    }
                }
                
                // Update form values
                form.reset({
                    title: data.name,
                    room: data.room,
                    date: new Date(data.date),
                    duration: formattedDuration,
                    examLink: data.exam_link || ""
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
    
    // Validate form data before submitting
    const validateFormBeforeSubmit = (values) => {
      // When editing, we may not be changing the materials
      const hasFiles = files.length > 0
      const hasLink = values.examLink && values.examLink.trim() !== ""
      const hasExistingMaterials = sessionData?.encrypted_exam_file || sessionData?.exam_link
      
      if (hasFiles && hasLink) {
        setFormError("You cannot provide both files and an exam link. Please choose one option.")
        return false
      }
      
      // In edit mode, we don't require new materials if they already exist
      if (!hasExistingMaterials && !hasFiles && !hasLink) {
        setFormError("Please provide either exam files or an external link.")
        return false
      }
      
      return true
    }

    // Form submission handler
    async function onSubmit(values) {
      try {
        // Clear previous errors
        setFormError("")
        setError(null)
        
        // Validate form data
        if (!validateFormBeforeSubmit(values)) {
          return
        }
        
        setIsSubmitting(true)
        
        const formattedDate = format(values.date, "yyyy-MM-dd")
        
        // Parse duration string to seconds more explicitly
        let durationInSeconds = 7200 // Default 2 hours
        
        if (typeof values.duration === "string" && values.duration.includes(":")) {
          try {
            const [hours, minutes] = values.duration.split(":")
            durationInSeconds = (parseInt(hours, 10) * 3600) + (parseInt(minutes, 10) * 60)
            console.log("Duration calculated:", values.duration, "->", durationInSeconds, "seconds")
          } catch (err) {
            console.error("Failed to parse duration:", err)
          }
        }
    
        const hasNewFiles = files.length > 0
        const hasNewLink = values.examLink && values.examLink.trim() !== ""
        
        // Use FormData to send everything in one request
        const formData = new FormData()
        
        // Add basic session info
        formData.append('name', values.title)
        formData.append('date', formattedDate)
        formData.append('duration', String(durationInSeconds)) // Explicitly convert to string
        formData.append('room', values.room)
        formData.append('exam_id', Number(exam_id))
        formData.append('course_id', course_id)
        
        // For debugging - log the FormData content
        console.log("Form data being sent:")
        for (let [key, value] of formData.entries()) {
          console.log(`${key}: ${value}`)
        }
        
        // Add files or link if provided
        if (hasNewFiles) {
          for (const file of files) {
            formData.append('files', file)
          }
        } else if (hasNewLink) {
          formData.append('exam_link', values.examLink)
        }
        
        // Use the updateSessionWithFiles method to send everything at once
        await sessionService.updateSessionWithFiles(course_id, exam_id, session_id, formData)
        
        toast.success("Session updated successfully!")
        router.push(`/course/${course_id}/${exam_id}`)
      } catch (err) {
        setError(err.message || "An error occurred while updating the session")
        toast.error(err.message || "An error occurred while updating the session")
        console.error(err)
      } finally {
        setIsSubmitting(false)
      }
    }

    // Show loading state
    if (isLoading) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">Edit Session</h1>
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-40 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      )
    }

    // Show error state
    if (error && !sessionData) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </Alert>
          <div className="mt-4">
            <BackButton />
          </div>
        </div>
      )
    }
    
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Session</h1>
        
        {formError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <span>{formError}</span>
          </Alert>
        )}

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
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            min="0" 
                            max="10" 
                            placeholder="Hours" 
                            value={(field.value && field.value.includes(':')) ? field.value.split(':')[0] : "00"}
                            onChange={(e) => {
                              const hours = e.target.value;
                              const minutes = (field.value && field.value.includes(':')) ? 
                                field.value.split(':')[1] || "00" : "00";
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
                            value={(field.value && field.value.includes(':')) ? field.value.split(':')[1] : "00"}
                            onChange={(e) => {
                              const hours = (field.value && field.value.includes(':')) ? 
                                field.value.split(':')[0] || "00" : "00";
                              const minutes = e.target.value;
                              field.onChange(`${hours}:${minutes.padStart(2, '0')}`);
                            }}
                            className="w-20"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Total duration (e.g., 02:00 for 2 hours)
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-4">Exam Materials</h3>

              {(sessionData?.encrypted_exam_file || sessionData?.exam_link) && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">Current materials:</p>
                  {sessionData?.encrypted_exam_file && (
                    <p className="text-sm text-muted-foreground">
                      File: {sessionData.encrypted_exam_file.split('/').pop()}
                    </p>
                  )}
                  {sessionData?.exam_link && (
                    <p className="text-sm text-muted-foreground">
                      Link: {sessionData.exam_link}
                    </p>
                  )}
                </div>
              )}
              
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="files">Replace with Files</TabsTrigger>
                  <TabsTrigger value="link">Replace with Link</TabsTrigger>
                </TabsList>
                
                <TabsContent value="files" className="mt-0">
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
                            <li key={index} className="flex justify-between items-center">
                              <span>{file.name}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRemoveFile(index)}
                                className="h-8 w-8 p-0"
                              >
                                ×
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="link" className="mt-0">
                  <FormField
                    control={form.control}
                    name="examLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>External Exam Link</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <LinkIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="https://example.com/exam" 
                              {...field}
                              className="flex-1"
                            />
                          </div>
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter a valid URL starting with http:// or https://
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-between">
              <BackButton />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Session"}
              </Button>
            </div>
          </form>
        </Form>
        <Toaster />
      </div>
    )
}