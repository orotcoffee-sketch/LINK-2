export type Folder = { id: string; name: string };
export type Bookmark = {
  id: string;
  title: string;
  url: string;
  description: string;
  // 대표 이미지 URL (없으면 빈 문자열)
  thumbnailUrl: string;
  // 폴더가 없는(미분류) 북마크는 빈 문자열
  folderId: string;
  createdAt: string;
};
