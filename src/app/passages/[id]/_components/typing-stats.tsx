import { StatItem } from "@/components/common/stat-item";
import { Progress } from "@/components/ui/progress";

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** 타이핑 중 실시간 지표. 현재 줄 번호는 1부터 센다. */
export function TypingStats({
  elapsedMs,
  currentLine,
  totalLines,
  cpm,
  accuracy,
}: {
  elapsedMs: number;
  currentLine: number;
  totalLines: number;
  cpm: number;
  accuracy: number;
}) {
  const progress = totalLines > 0 ? ((currentLine - 1) / totalLines) * 100 : 0;
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatItem label="경과 시간" value={formatElapsed(elapsedMs)} />
        <StatItem label="진행" value={`${currentLine} / ${totalLines}`} unit="줄" />
        <StatItem label="타수" value={cpm} unit="타/분" />
        <StatItem label="정확도" value={accuracy} unit="%" />
      </dl>
      <Progress
        value={progress}
        aria-label="진행도"
        data-testid="typing-progress"
      />
    </div>
  );
}
