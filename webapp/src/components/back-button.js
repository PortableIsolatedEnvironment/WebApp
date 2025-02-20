'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const BackButton = () => {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    return (
        <Button onClick={handleBack}>
            Back
        </ Button>
    );
};

export default BackButton;