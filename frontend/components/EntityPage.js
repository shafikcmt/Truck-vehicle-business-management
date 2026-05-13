'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { dateInputValue, formatDate, formatTaka, getItemId } from '../lib/format';

const emptyPagination = { current: 1, total: 0, totalPages: 1, limit: 10 };
const emptyObject = {};
const emptyArray = [];

const getNested = (row, key) => row?.[key];

function normalizeRow(row, fields) {
  const form = {};
  fields.forEach((field) => {
    const source = field.from || field.name;
    let value = getNested(row, source);
    if (field.type === 'date') value = dateInputValue(value);
    if (value === null || value === undefined) value = field.defaultValue || '';
    form[field.name] = value;
  });
  return form;
}

function renderCell(row, column) {
  const value = column.render ? column.render(row) : row[column.key];
  if (column.type === 'money') return formatTaka(value);
  if (column.type === 'date') return formatDate(value);
  if (column.type === 'status') return <span className={`status-pill ${String(value || '').toLowerCase().replace(/\s+/g, '-')}`}>{value || '-'}</span>;
  return value ?? '-';
}

export default function EntityPage({
  title,
  subtitle,
  listKey,
  api,
  columns,
  fields,
  filters = emptyArray,
  optionLoaders = emptyObject,
  initialFilters = emptyObject,
  addLabel = 'Add New',
  transformBeforeSave = (data) => data,
  extraActions,
}) {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState(initialFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [options, setOptions] = useState({});

  const page = pagination.current || 1;

  const loadOptions = useCallback(async () => {
    const loaded = {};
    for (const [key, loader] of Object.entries(optionLoaders)) {
      try { loaded[key] = await loader(); } catch (err) { loaded[key] = []; }
    }
    setOptions(loaded);
  }, [optionLoaders]);

  const loadData = useCallback(async (nextPage = page) => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getAll(nextPage, pagination.limit || 10, { ...filterState, search: search || undefined });
      const payload = result?.data || {};
      setRows(payload[listKey] || []);
      setPagination(payload.pagination || emptyPagination);
    } catch (err) {
      setError(err?.message || 'Failed to load data. Check API server and database.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [api, filterState, listKey, page, pagination.limit, search]);

  useEffect(() => { loadOptions(); }, [loadOptions]);
  useEffect(() => { loadData(1); }, [filterState]);

  const openCreate = () => {
    const initial = {};
    fields.forEach((field) => { initial[field.name] = field.defaultValue || ''; });
    setForm(initial);
    setEditing(null);
    setModalOpen(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (row) => {
    setForm(normalizeRow(row, fields));
    setEditing(row);
    setModalOpen(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this record?')) return;
    setError('');
    try {
      await api.delete(getItemId(row));
      setSuccess('Record deleted successfully.');
      loadData(page);
    } catch (err) {
      setError(err?.message || 'Delete failed.');
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = transformBeforeSave(form);
      if (editing) await api.update(getItemId(editing), payload);
      else await api.create(payload);
      setSuccess(editing ? 'Record updated successfully.' : 'Record created successfully.');
      setModalOpen(false);
      loadData(editing ? page : 1);
    } catch (err) {
      setError(err?.message || 'Save failed. Please check required fields.');
    } finally {
      setSaving(false);
    }
  };

  const filterControls = useMemo(() => filters.map((filter) => (
    <label key={filter.name} className="filter-control">
      <span>{filter.label}</span>
      {filter.type === 'select' ? (
        <select value={filterState[filter.name] || ''} onChange={(e) => setFilterState((prev) => ({ ...prev, [filter.name]: e.target.value || undefined }))}>
          <option value="">All</option>
          {(filter.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input type={filter.type || 'text'} value={filterState[filter.name] || ''} onChange={(e) => setFilterState((prev) => ({ ...prev, [filter.name]: e.target.value || undefined }))} />
      )}
    </label>
  )), [filters, filterState]);

  return (
    <section className="page-card">
      <div className="section-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button className="primary-button" onClick={openCreate}>{addLabel}</button>
      </div>

      <div className="toolbar">
        <label className="search-box">
          <span>Search</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadData(1)} placeholder="Search records" />
        </label>
        {filterControls}
        <button className="ghost-button" onClick={() => loadData(1)}>Apply</button>
      </div>

      {success && <div className="alert success">{success}</div>}
      {error && <div className="alert error">{error}</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead><tr>{columns.map((col) => <th key={col.key}>{col.label}</th>)}<th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={columns.length + 1}>Loading...</td></tr> : rows.length ? rows.map((row) => (
              <tr key={getItemId(row)}>
                {columns.map((col) => <td key={col.key}>{renderCell(row, col)}</td>)}
                <td className="action-cell">
                  {extraActions?.(row)}
                  <button className="small-button" onClick={() => openEdit(row)}>Edit</button>
                  <button className="small-button danger" onClick={() => handleDelete(row)}>Delete</button>
                </td>
              </tr>
            )) : <tr><td colSpan={columns.length + 1}>No records found.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="pagination-bar">
        <span>Total: {pagination.total || 0}</span>
        <div>
          <button className="ghost-button" disabled={page <= 1} onClick={() => loadData(page - 1)}>Previous</button>
          <span className="page-indicator">Page {page} / {pagination.totalPages || 1}</span>
          <button className="ghost-button" disabled={page >= (pagination.totalPages || 1)} onClick={() => loadData(page + 1)}>Next</button>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="section-header compact">
              <div><h2>{editing ? `Edit ${title}` : addLabel}</h2><p>Fill required information carefully.</p></div>
              <button className="icon-button" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <form className="form-grid" onSubmit={handleSave}>
              {fields.map((field) => (
                <label key={field.name} className={field.full ? 'full' : ''}>
                  <span>{field.label}{field.required ? ' *' : ''}</span>
                  {field.type === 'select' ? (
                    <select required={field.required} value={form[field.name] || ''} onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}>
                      <option value="">Select</option>
                      {(field.optionsKey ? options[field.optionsKey] : field.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea required={field.required} value={form[field.name] || ''} onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))} />
                  ) : (
                    <input required={field.required} type={field.type || 'text'} step={field.step || undefined} value={form[field.name] || ''} onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))} />
                  )}
                </label>
              ))}
              <div className="form-actions full">
                <button type="button" className="ghost-button" onClick={() => setModalOpen(false)}>Cancel</button>
                <button className="primary-button" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
