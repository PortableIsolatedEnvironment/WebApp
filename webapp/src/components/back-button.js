'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

const BackButton = () => {
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations();

    const handleBack = () => {
        const localeStripped = pathname.replace(/\/[a-z]{2}/, '');
        const pathParts = localeStripped.split('/').filter(Boolean);
        
        if (pathParts.length <= 1) {
            router.push('/');
            return;
        }
        
        if (pathParts[0] === 'course') {
            if (pathParts.length === 2) {
                router.push('/');
            } else if (pathParts.length === 3) {
                router.push(`/course/${pathParts[1]}`);
            } else if (pathParts.length === 4) {
                router.push(`/course/${pathParts[1]}/${pathParts[2]}`);
            } else if (pathParts.length >= 5) {
                if (pathParts[4] === 'edit_session' || pathParts[4] === 'create_session') {
                    router.push(`/course/${pathParts[1]}/${pathParts[2]}`);
                } else {
                    router.push(localeStripped.split('/').slice(0, -1).join('/'));
                }
            }
        } else {
            router.push(localeStripped.split('/').slice(0, -1).join('/'));
        }
    };

    return (
        <Button type="button" onClick={handleBack}>
            {t('Back')}
        </Button>
    );
};

export default BackButton;