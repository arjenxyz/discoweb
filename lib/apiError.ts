/** API JSON gövdesindeki kullanıcıya gösterilecek hata metni. */
export function apiErrorMessage(
  data: { error?: string; message?: string },
  fallback = 'İşlem başarısız. Lütfen tekrar deneyin.',
): string {
  return data.message || data.error || fallback;
}
