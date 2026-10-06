import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { fetchMetadata } from "@/utils/metadata";

const EMPTY = { title: null, description: null, image: null, favicon: null, status: null };

// 북마크 저장 전 URL 메타데이터 조회. 외부 fetch가 열린 프록시가 되지 않도록 로그인한 admin만 허용한다.
export async function POST(request: Request) {
  const supabase = createClient(await cookies());
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url : "";
  try {
    return NextResponse.json(await fetchMetadata(url));
  } catch (e) {
    const code = e instanceof Error ? e.message : "fetch_failed";
    const blocked = code.startsWith("blocked") || code === "invalid_url";
    // 수집 실패는 저장 실패가 아니다: 빈 메타데이터를 돌려준다. 차단된 주소만 400.
    return NextResponse.json(
      { ...EMPTY, error: blocked ? code : "fetch_failed" },
      { status: blocked ? 400 : 200 },
    );
  }
}
