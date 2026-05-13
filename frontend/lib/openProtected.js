import Cookies from 'js-cookie';

export async function openProtectedUrl(url) {
  const token = Cookies.get('token');
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const contentType = response.headers.get('content-type') || 'text/html';
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(new Blob([blob], { type: contentType }));
  window.open(objectUrl, '_blank', 'noopener,noreferrer');
}
