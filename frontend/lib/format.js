export const formatTaka = (value = 0) => {
  const number = Number(value || 0);
  return `৳ ${number.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB');
};

export const dateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
};

export const getItemId = (item) => item?.id || item?.trip_id;

export const unwrap = (response, key) => response?.data?.[key] || response?.data || response?.[key] || [];
