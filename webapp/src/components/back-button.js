'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTranslations, useLocale } from 'next-intl';

const BackButton = () => {
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations();
    const locale = useLocale();

    const handleBack = () => {
        // Remove locale prefix from path
        const localeStripped = pathname.replace(new RegExp(`^/${locale}`), '');
        const pathParts = localeStripped.split('/').filter(Boolean);

        // If we're at the root or a top-level page, go to home
        if (pathParts.length <= 1) {
            router.push(`/${locale}`);
            return;
        }
        
        if (pathParts[0] === 'course') {
            if (pathParts.length === 2) {
                // From /en/course/[course_id] to /en
                router.push(`/${locale}`);
            } else if (pathParts.length === 3) {
                // From /en/course/[course_id]/[exam_id] to /en/course/[course_id]
                router.push(`/${locale}/course/${pathParts[1]}`);
            } else if (pathParts.length === 4) {
                // From /en/course/[course_id]/[exam_id]/[session_id] to /en/course/[course_id]/[exam_id]
                router.push(`/${locale}/course/${pathParts[1]}/${pathParts[2]}`);
            } else if (pathParts.length >= 5) {
                if (pathParts[4] === 'edit_session' || pathParts[4] === 'create_session') {
                    // Special case for edit/create pages
                    router.push(`/${locale}/course/${pathParts[1]}/${pathParts[2]}`);
                } else {
                    // General case - go up one level
                    const newPath = `/${locale}${localeStripped.split('/').slice(0, -1).join('/')}`;
                    router.push(newPath);
                }
            }
        } else {
            // For other paths, just go up one level
            const newPath = `/${locale}${localeStripped.split('/').slice(0, -1).join('/')}`;
            router.push(newPath);
        }
    };

    return (
        <Button type="button" onClick={handleBack}>
            {t('Back')}
        </Button>
    );
};

export default BackButton;