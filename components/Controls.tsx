'use client';

export default function Controls({
  isPlaying,
  onTogglePlay,
  onStepBack,
  onStepForward,
  onRestart,
  canStepBack,
  canStepForward,
}: {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onRestart: () => void;
  canStepBack: boolean;
  canStepForward: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-2 border-t border-white/[0.06] pt-3">
      <IconButton onClick={onRestart} label="Restart">
        <RestartIcon />
      </IconButton>
      <IconButton onClick={onStepBack} disabled={!canStepBack} label="Step back">
        <StepBackIcon />
      </IconButton>
      <button
        onClick={onTogglePlay}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 active:scale-95"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <IconButton onClick={onStepForward} disabled={!canStepForward} label="Step forward">
        <StepForwardIcon />
      </IconButton>
      <div className="w-8" />
    </div>
  );
}

function IconButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-base-300 transition hover:bg-white/[0.06] hover:text-base-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 2.5v11l9-5.5-9-5.5z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="3.5" y="2.5" width="3.2" height="11" rx="0.8" />
      <rect x="9.3" y="2.5" width="3.2" height="11" rx="0.8" />
    </svg>
  );
}
function StepForwardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 2.5v11l7-5.5-7-5.5z" />
      <rect x="11.5" y="2.5" width="1.6" height="11" rx="0.6" />
    </svg>
  );
}
function StepBackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13 2.5v11l-7-5.5 7-5.5z" />
      <rect x="2.9" y="2.5" width="1.6" height="11" rx="0.6" />
    </svg>
  );
}
function RestartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M13.5 8A5.5 5.5 0 1 1 11.8 4" strokeLinecap="round" />
      <path d="M13.7 2v3.3H10.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
