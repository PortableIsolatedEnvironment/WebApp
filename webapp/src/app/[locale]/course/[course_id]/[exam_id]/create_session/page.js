"use client";

import { useState } from "react";
import { CalendarIcon, Upload, Link, AlertCircle, Globe } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import BackButton from "@/components/back-button";
import { sessionService } from "@/api/services/sessionService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/alert";
import { toast, Toaster } from "sonner";
import { useTranslations } from "next-intl";

const createFormSchema = (t) =>
  z.object({
    title: z.string().min(2, {
      message: t("Title_Warning"),
    }),
    date: z.date({
      required_error: t("Date_Warning"),
    }),
    room: z.string().min(1, {
      message: t("Room_Warning"),
    }),
    duration: z.string().min(1, {
      message: t("Duration_Warning"),
    }),
    examLink: z
      .string()
      .url(t("URL_Validation"))
      .optional()
      .or(z.literal("")),
  });

export default function CreateSessionForm() {
  const t = useTranslations();
  const formSchema = createFormSchema(t);
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("files");
  const [formError, setFormError] = useState("");
  // New state for link whitelist
  const [whitelistLink, setWhitelistLink] = useState("");
  const [whitelistLinks, setWhitelistLinks] = useState([]);

  const params = useParams();
  const router = useRouter();
  const { course_id, exam_id } = params;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Convert FileList to array and update state
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
      e.dataTransfer.clearData();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to array and update state
      const selectedFiles = Array.from(e.target.files);
      setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  // New functions for link whitelist
  const isValidUrl = (string) => {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  };

  const handleAddWhitelistLink = () => {
    if (isValidUrl(whitelistLink) && !whitelistLinks.includes(whitelistLink)) {
      setWhitelistLinks([...whitelistLinks, whitelistLink]);
      setWhitelistLink("");
    }
  };

  const handleRemoveWhitelistLink = (indexToRemove) => {
    setWhitelistLinks(whitelistLinks.filter((_, index) => index !== indexToRemove));
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      room: "",
      duration: "02:00",
      examLink: "",
    },
  });

  async function onSubmit(values) {
    try {
      setIsSubmitting(true);
      setError(null);
      setFormError("");

      const formattedDate = format(values.date, "yyyy-MM-dd");

      // Validate that either files OR link is provided, but not both
      const hasFiles = files.length > 0;
      const hasLink = values.examLink && values.examLink.trim() !== "";

      if (hasFiles && hasLink) {
        setFormError(
          t("Link_File_Error")
        );
        return;
      }

      if (!hasFiles && !hasLink) {
        setFormError("Please provide either exam files or an external link.");
        return;
      }

      // Basic session data (without files or link)
      const sessionData = {
        exam_id: Number(exam_id),
        course_id: course_id,
        name: values.title,
        date: formattedDate,
        duration: values.duration
          .split(":")
          .reduce(
            (acc, time, index) =>
              acc + parseInt(time) * (index === 0 ? 3600 : 60),
            0
          ),
        room: values.room,
        // Add whitelist links
        allowed_links: whitelistLinks.length > 0 ? whitelistLinks : null,
      };

      try {
        // First create the session
        const sessionResponse = await sessionService.createSession(
          course_id,
          exam_id,
          sessionData
        );
        const session_id = sessionResponse.id;

        // Then upload either files or link
        if (hasFiles) {
          // For file uploads
          const formData = new FormData();

          // Add each file
          for (const file of files) {
            formData.append("files", file);
          }

          await sessionService.uploadFile(
            course_id,
            exam_id,
            session_id,
            formData
          );
        } else if (hasLink) {
          // For exam link
          const formData = new FormData();
          formData.append("exam_link", values.examLink);

          await sessionService.uploadFile(
            course_id,
            exam_id,
            session_id,
            formData
          );
        }

        toast.success("Session created successfully!");
        router.push(`/course/${course_id}/${exam_id}`);
      } catch (apiError) {
        throw new Error(`API error: ${apiError.message}`);
      }
    } catch (err) {
      toast.error(
        err.message || "An error occurred while creating the session"
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-light-gray">
      <h1 className="text-2xl font-bold mb-6">{t("CreateSessionTitle")}</h1>

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
                <FormLabel>{t("SessionTitle")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("SessionTitlePlaceholder")}
                    {...field}
                  />
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
                <FormItem>
                  <FormLabel>{t("Date")}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "yyyy-MM-dd")
                          ) : (
                            <span>{t("DatePlaceholder")}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
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
                  <FormLabel>{t("Room")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("RoomPlaceholder")} {...field} />
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
                  <FormLabel>{t("Duration")}</FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          placeholder={t("Hours")}
                          value={field.value.split(":")[0] || ""}
                          onChange={(e) => {
                            const hours = e.target.value;
                            const minutes = field.value.split(":")[1] || "00";
                            field.onChange(
                              `${hours.padStart(2, "0")}:${minutes}`
                            );
                          }}
                          className="w-20"
                        />
                        <span>:</span>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          placeholder={t("Minutes")}
                          value={field.value.split(":")[1] || ""}
                          onChange={(e) => {
                            const hours = field.value.split(":")[0] || "00";
                            const minutes = e.target.value;
                            field.onChange(
                              `${hours}:${minutes.padStart(2, "0")}`
                            );
                          }}
                          className="w-20"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {t("DurationHelper")}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-4">{t("ExamMaterials")}</h3>

            <Tabs
              defaultValue={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="files">{t("UploadFiles")}</TabsTrigger>
                <TabsTrigger value="link">{t("UseExternalLink")}</TabsTrigger>
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
                      <p className="text-sm font-medium">{t("AttachFiles")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("DropFilesInstructions")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("AcceptedFileTypes")}
                      </p>
                    </div>
                    <Input
                      type="file"
                      className="hidden"
                      id="file-upload"
                      multiple
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="file-upload"
                      className="mt-2 inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                    >
                      {t("SelectFiles")}
                    </label>
                  </div>
                  {files.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium">
                        {t("SelectedFiles")}
                      </p>
                      <ul className="text-sm text-muted-foreground mt-1">
                        {files.map((file, index) => (
                          <li
                            key={index}
                            className="flex justify-between items-center"
                          >
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
                      <FormLabel>{t("ExternalExamLink")}</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Link className="mr-2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={t("ExamLinkPlaceholder")}
                            {...field}
                            className="flex-1"
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("ExamLinkHelper")}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* New Link Whitelist Section */}
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-4">{t("Allowed_Links") || "Allowed Links"}</h3>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("LinksPopUp") || "Add links that students are allowed to access during the exam."}
              </p>
              
              {/* Add whitelist links */}
              <div className="flex gap-2">
                <div className="flex items-center flex-1">
                  <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="https://example.com"
                    value={whitelistLink}
                    onChange={(e) => setWhitelistLink(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={handleAddWhitelistLink}
                  disabled={!isValidUrl(whitelistLink)}
                >
                  {t("Add_Link") || "Add Link"}
                </Button>
              </div>
              
              {/* Display whitelist links */}
              {whitelistLinks.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium">{t("Whitelisted_Links") || "Whitelisted Links"}:</p>
                  <ul className="mt-2 space-y-2">
                    {whitelistLinks.map((link, index) => (
                      <li key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                        <span className="text-sm truncate max-w-[80%]">{link}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveWhitelistLink(index)}
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
          </div>

          <div className="flex justify-between">
            <BackButton />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("Creating") + "..." : t("CreateSession")}
            </Button>
          </div>
        </form>
      </Form>
      <Toaster richColors />
    </div>
  );
}