'use client';

import { StepPreview } from '@/components/onboarding/step-preview';
import { StepProfile } from '@/components/onboarding/step-profile';
import { StepSocials } from '@/components/onboarding/step-socials';
import { WizardProgress } from '@/components/onboarding/wizard-progress';
import OpenBioLogo from '@/public/openbio.png';
import { api } from '@/trpc/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function Page() {
  const searchParams = useSearchParams();
  const link = searchParams.get('link') ?? '';
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { mutateAsync: createLink } = api.profileLink.create.useMutation();

  const handleSocialChange = (key: string, value: string) => {
    setSocials((prev) => ({ ...prev, [key]: value }));
  };

  const handlePublish = async () => {
    if (!link) {
      return;
    }
    setLoading(true);
    try {
      await createLink({
        link,
        twitter: socials.twitter || undefined,
        github: socials.github || undefined,
        linkedin: socials.linkedin || undefined,
        instagram: socials.instagram || undefined,
        telegram: socials.telegram || undefined,
        discord: socials.discord || undefined,
        youtube: socials.youtube || undefined,
        twitch: socials.twitch || undefined,
      });
      router.push(`/${link}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg animate-fade-up rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/">
            <Image src={OpenBioLogo} alt="OpenBio" width={48} height={48} />
          </Link>
          <h1 className="mt-4 font-cal text-2xl">Set up your page</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            openbio.app/{link}
          </p>
        </div>

        <div className="mb-8">
          <WizardProgress currentStep={currentStep} />
        </div>

        {currentStep === 0 && (
          <StepProfile
            name={name}
            bio={bio}
            onNameChange={setName}
            onBioChange={setBio}
            onNext={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 1 && (
          <StepSocials
            values={socials}
            onChange={handleSocialChange}
            onBack={() => setCurrentStep(0)}
            onNext={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 2 && (
          <StepPreview
            name={name}
            bio={bio}
            socials={socials}
            onBack={() => setCurrentStep(1)}
            onPublish={() => {
              handlePublish().catch(console.error);
            }}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
