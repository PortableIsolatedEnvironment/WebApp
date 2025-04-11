import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
  import { useTranslations } from "next-intl";
  
  export function StartSessionDialog({ open, onOpenChange, onConfirm }) {
    const t = useTranslations();
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Start Session")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("Are you sure you want to start the session? This will allow students to begin the exam")}
            </AlertDialogDescription>
          </AlertDialogHeader> 
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={onConfirm}
              className="bg-[#5BA87A] text-white hover:bg-[#4A8B65]"
            >
              {t("Start Session")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  
  export function EndSessionDialog({ open, onOpenChange, onConfirm }) {
    const t = useTranslations();
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("End Session")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("Are you sure you want to end the session? This will finalize the exam for all students")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
            {t("Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={onConfirm}
              className="bg-[#993333] text-white hover:bg-[#7A2929]"
            >
              {t("End Session")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }