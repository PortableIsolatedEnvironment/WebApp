"use client"

import { useState } from "react"
import { CalendarIcon, Upload, Link, AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import BackButton from "@/components/back-button"
import { examService } from "@/api/services/examService"
import { sessionService } from "@/api/services/sessionService"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert } from "@/components/ui/alert"
import { toast, Toaster } from "sonner"

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Exam title must be at least 2 characters.",
  }),
  createSession: z.boolean().default(false),
  sessionTitle: z.string().optional(),
  date: z.date().optional(),
  room: z.string().optional(),
  duration: z.string().optional(),
  examLink: z
    .string()
    .url("Please enter a valid URL starting with http:// or https://")
    .optional()
    .or(z.literal("")),
})

export default function CreateExamForm() {
  const [files, setFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [formError, setFormError] = useState("")
  const [createSessionEnabled, setCreateSessionEnabled] = useState(false)
  const [activeTab, setActiveTab] = useState("files")
  
  const params = useParams()
  const router = useRouter()
  const { course_id } = params

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      createSession: false,
      sessionTitle: "",
      room: "",
      duration: "02:00",
      examLink: "",
    },
  })

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files)
      setFiles(prevFiles => [...prevFiles, ...selectedFiles])
    }
  }

  const handleRemoveFile = (indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove))
  }

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

  const validateFormBeforeSubmit = (values) => {
    // Only validate materials if the create session option is enabled
    if (values.createSession) {
      const hasFiles = files.length > 0
      const hasLink = values.examLink && values.examLink.trim() !== ""
      
      if (hasFiles && hasLink) {
        setFormError("You cannot provide both files and an exam link. Please choose one option.")
        return false
      }
      
      // We don't require materials in exam creation, so no need to check for neither
    }
    
    return true
  }

  async function onSubmit(values) {
    try {
      // Clear previous errors
      setFormError("")
      setError(null)
      
      // Validate form data if creating a session
      if (!validateFormBeforeSubmit(values)) {
        return
      }
      
      setIsSubmitting(true)
      
      // 1. Create the exam
      const exam = {
        course_id: course_id,
        name: values.title
      }

      try {
        // Create exam and get its ID
        const examData = await examService.createExam(course_id, exam)
        const exam_id = examData.id

        // 2. Create a session if the option is enabled
        if (values.createSession) {
          const formattedDate = values.date ? format(values.date, "yyyy-MM-dd") : ""
          
          const session = {
            exam_id: exam_id,
            course_id: course_id,
            name: values.sessionTitle || values.title,
            date: formattedDate,
            duration: values.duration + ":00",
            room: values.room,
          }

          const sessionData = await sessionService.createSession(course_id, exam_id, session)
          const session_id = sessionData.id

          // Handle file uploads or link
          const hasFiles = files.length > 0
          const hasLink = values.examLink && values.examLink.trim() !== ""
          
          if (hasFiles || hasLink) {
            const formData = new FormData()
            
            if (hasFiles) {
              // For file uploads
              for (const file of files) {
                formData.append('files', file)
              }
            } else if (hasLink) {
              // For exam link
              formData.append('exam_link', values.examLink)
            }
            
            await sessionService.uploadFile(course_id, exam_id, session_id, formData)
          }
        }

        toast.success("Exam created successfully!")
        router.push(`/course/${course_id}`)
      } catch (apiError) {
        throw new Error(`API error: ${apiError.message}`)
      }
    } catch (err) {
      setError(err.message || "An error occurred while creating the exam")
      toast.error(err.message || "An error occurred while creating the exam")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Exam</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
      )}
      
      {formError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <span>{formError}</span>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Exam Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exam Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter exam name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Create Session Toggle */}
          <FormField
            control={form.control}
            name="createSession"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Create Session Automatically</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Enable to create an exam session at the same time
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked)
                      setCreateSessionEnabled(checked)
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Session Fields - Only shown when createSession is enabled */}
          {createSessionEnabled && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-6">
              <h2 className="text-lg font-medium">Session Details</h2>
              
              {/* Session Title */}
              <FormField
                control={form.control}
                name="sessionTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Title (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Leave blank to use exam title" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Session Date */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
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

                {/* Room */}
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

                {/* Duration */}
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (hours:minutes)</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-2">
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

              {/* Materials Section - Tabs for Files/Link */}
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-4">Exam Materials</h3>
                
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="files">Upload Files</TabsTrigger>
                    <TabsTrigger value="link">Use External Link</TabsTrigger>
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
                          <p className="text-sm font-medium">Attach Files</p>
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
                          <p className="text-sm font-medium">Selected Files:</p>
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
                              <Link className="mr-2 h-4 w-4 text-muted-foreground" />
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
            </div>
          )}

          <div className="flex justify-between">
            <BackButton />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Exam"}
            </Button>
          </div>
        </form>
      </Form>
      <Toaster />
    </div>
  )
}