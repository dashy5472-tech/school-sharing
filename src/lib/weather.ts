/* 학교 위치의 오늘 날씨와 미세먼지를 Open-Meteo 에서 불러옵니다. 인증키가 필요 없습니다.
   미세먼지는 측정소 값이 아니라 예보 모델 값이라 에어코리아와 조금 다를 수 있습니다.
   실패하면 null 을 돌려주고, 화면에는 날짜만 나옵니다. */

import { SCHOOL } from "@/config/school";

export type Weather = {
  temp: number;
  max: number;
  min: number;
  rain: number;
  label: string;
  icon: string;
  pm10?: number;
  pm25?: number;
};

/* WMO 날씨 코드를 우리말로 바꿉니다. */
function describe(code: number): { label: string; icon: string } {
  if (code === 0) return { label: "맑음", icon: "☀️" };
  if (code <= 2) return { label: "구름 조금", icon: "🌤️" };
  if (code === 3) return { label: "흐림", icon: "☁️" };
  if (code === 45 || code === 48) return { label: "안개", icon: "🌫️" };
  if (code >= 51 && code <= 57) return { label: "이슬비", icon: "🌦️" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { label: "비", icon: "🌧️" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: "눈", icon: "🌨️" };
  if (code >= 95) return { label: "뇌우", icon: "⛈️" };
  return { label: "흐림", icon: "☁️" };
}

/* 환경부 예보 등급입니다. 미세먼지(PM10)와 초미세먼지(PM2.5)의 경계가 다릅니다. */
const GRADES = [
  { label: "좋음", tone: "good" },
  { label: "보통", tone: "normal" },
  { label: "나쁨", tone: "bad" },
  { label: "매우 나쁨", tone: "worst" }
] as const;

export function dustGrade(value: number, kind: "pm10" | "pm25") {
  const cut = kind === "pm10" ? [30, 80, 150] : [15, 35, 75];
  const index = cut.findIndex(limit => value <= limit);
  return GRADES[index === -1 ? 3 : index];
}

export async function fetchWeather(): Promise<Weather | null> {
  const { latitude, longitude } = SCHOOL.location;
  if (!latitude || !longitude) return null;
  const where = `latitude=${latitude}&longitude=${longitude}&timezone=Asia%2FSeoul`;

  try {
    const [forecast, air] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?${where}&forecast_days=1` +
          "&current=temperature_2m,weather_code" +
          "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max"
      ).then(r => (r.ok ? r.json() : null)),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${where}&current=pm10,pm2_5`)
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null)
    ]);
    if (!forecast?.current || !forecast?.daily) return null;

    return {
      temp: Math.round(forecast.current.temperature_2m),
      max: Math.round(forecast.daily.temperature_2m_max[0]),
      min: Math.round(forecast.daily.temperature_2m_min[0]),
      rain: forecast.daily.precipitation_probability_max[0] ?? 0,
      ...describe(forecast.current.weather_code),
      pm10: air?.current?.pm10 ?? undefined,
      pm25: air?.current?.pm2_5 ?? undefined
    };
  } catch {
    return null;
  }
}
