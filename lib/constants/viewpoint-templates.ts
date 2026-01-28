/**
 * PRD F1: 관점(Viewpoint) 선택에 따른 System Prompt 템플릿.
 * 유저 입력 키워드는 Sanitization 후 주입.
 */
export const VIEWPOINT_TEMPLATES: Record<string, string> = {
  critical: "비판적 분석",
  investor: "투자자 관점",
  beginner: "초보자 눈높이",
  fact: "Fact 중심",
  // TODO: 백엔드와 동기화하여 템플릿 본문 정의
};
