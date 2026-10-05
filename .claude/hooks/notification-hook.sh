#!/bin/bash
# Claude Code Notification 훅 - 권한 요청 및 사용자 입력 대기 알림
#
# 이 스크립트는 Claude Code가 Notification 이벤트를 발생시킬 때 실행됩니다.
# 주로 권한 요청이나 사용자 입력 대기 상황에서 Slack 알림을 보냅니다.

# .env 파일에서 Slack 웹훅 URL 로드
if [ -f "$CLAUDE_PROJECT_DIR/.env" ]; then
    source "$CLAUDE_PROJECT_DIR/.env"
else
    echo "오류: .env 파일을 찾을 수 없습니다: $CLAUDE_PROJECT_DIR/.env" >&2
    exit 1
fi

# Slack 웹훅 URL 확인
if [ -z "$SLACK_WEBHOOK_URL" ]; then
    echo "오류: SLACK_WEBHOOK_URL이 설정되지 않았습니다." >&2
    exit 1
fi

# JSON 입력에서 메시지 추출 (있는 경우)
MESSAGE=$(jq -r '.message')

# 프로젝트명 추출
PROJECT_NAME=$(basename "$CLAUDE_PROJECT_DIR")

# 현재 시간
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# JSON payload 생성 (jq가 개행·따옴표 등을 안전하게 이스케이프)
PAYLOAD=$(jq -n \
  --arg project "$PROJECT_NAME" \
  --arg message "$MESSAGE" \
  --arg time "$TIMESTAMP" \
  '{
    channel: "#claude-code",
    username: "Claude Code",
    icon_emoji: ":bell:",
    text: "🔔 권한 요청 알림\n\n프로젝트: \($project)\n상태: \($message)\n시간: \($time)\n\nClaude Code에서 알림이 도착했습니다."
  }')

# Slack으로 알림 전송 (HTTP 오류 시 -f로 실패 처리, 응답 본문은 보관)
RESPONSE=$(curl -sS -f -X POST \
  -H 'Content-Type: application/json' \
  --data "$PAYLOAD" \
  "$SLACK_WEBHOOK_URL" 2>&1)
STATUS=$?

# 성공 여부 확인 (Slack 웹훅은 성공 시 본문 "ok" 반환)
if [ $STATUS -eq 0 ] && [ "$RESPONSE" = "ok" ]; then
    echo "Slack 알림이 성공적으로 전송되었습니다." >&2
else
    echo "Slack 알림 전송에 실패했습니다: $RESPONSE" >&2
    exit 1
fi
