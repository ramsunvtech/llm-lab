'use client';

export default function StageHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex max-w-2xl flex-col items-center gap-2 text-center">
      <h2 className="text-xl font-semibold text-base-100 sm:text-2xl">{title}</h2>
      <p className="text-sm text-base-400 sm:text-base">{description}</p>
    </div>
  );
}
