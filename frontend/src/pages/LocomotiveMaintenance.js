import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function LocomotiveMaintenance() {
    const [records, setRecords] = useState([]);
    const [locomotives, setLocomotives] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [selectedLocomotiveId, setSelectedLocomotiveId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [formData, setFormData] = useState({
        locomotiveId: '',
        date: '',
        description: ''
    });
    const [sortColumn, setSortColumn] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const isAdmin = userRole === 'Администрация';

    const fetchData = useCallback(async () => {
        try {
            const [recordsRes, locomotivesRes] = await Promise.all([
                axios.get('/api/locomotive-maintenance', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/locomotives', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setRecords(recordsRes.data);
            setLocomotives(locomotivesRes.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (selectedLocomotiveId) {
            setFilteredRecords(records.filter(r => r.locomotiveId === parseInt(selectedLocomotiveId)));
        } else {
            setFilteredRecords(records);
        }
    }, [records, selectedLocomotiveId]);

    const sortedRecords = [...filteredRecords].sort((a, b) => {
        let aVal, bVal;
        if (sortColumn === 'locomotive') {
            aVal = a.Locomotive?.id || a.locomotiveId;
            bVal = b.Locomotive?.id || b.locomotiveId;
        } else if (sortColumn === 'employee') {
            aVal = a.Employee ? `${a.Employee.lastName} ${a.Employee.firstName}` : '';
            bVal = b.Employee ? `${b.Employee.lastName} ${b.Employee.firstName}` : '';
        } else {
            aVal = a[sortColumn];
            bVal = b[sortColumn];
        }
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === 'number') {
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const getSortIndicator = (column) => {
        if (sortColumn !== column) return '';
        return sortDirection === 'asc' ? '▲' : '▼';
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить запись?')) return;
        try {
            await axios.delete(`/api/locomotive-maintenance/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка удаления');
        }
    };

    const openCreateModal = () => {
        setEditingRecord(null);
        setFormData({
            locomotiveId: selectedLocomotiveId || '',
            date: new Date().toISOString().slice(0, 10),
            description: ''
        });
        setShowModal(true);
    };

    const openEditModal = (record) => {
        setEditingRecord(record);
        setFormData({
            locomotiveId: record.locomotiveId,
            date: record.date,
            description: record.description
        });
        setShowModal(true);
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRecord) {
                await axios.put(`/api/locomotive-maintenance/${editingRecord.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/locomotive-maintenance', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка сохранения');
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>История обслуживания локомотивов</h1>
                <button className="btn btn-primary" onClick={openCreateModal}>Добавить запись</button>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label>Фильтр по локомотиву:</label>
                <select
                    className="form-input"
                    style={{ width: '300px' }}
                    value={selectedLocomotiveId}
                    onChange={(e) => setSelectedLocomotiveId(e.target.value)}
                >
                    <option value="">Все локомотивы</option>
                    {locomotives.map(l => (
                        <option key={l.id} value={l.id}>
                            Локомотив #{l.id} (модель: {l.LocomotiveModel?.name})
                        </option>
                    ))}
                </select>
                {selectedLocomotiveId && (
                    <button className="btn" onClick={() => setSelectedLocomotiveId('')}>Сбросить</button>
                )}
            </div>

            <table className="data-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('id')}>ID <span className="sort-indicator">{getSortIndicator('id')}</span></th>
                        <th onClick={() => handleSort('locomotive')}>Локомотив <span className="sort-indicator">{getSortIndicator('locomotive')}</span></th>
                        <th onClick={() => handleSort('employee')}>Сотрудник <span className="sort-indicator">{getSortIndicator('employee')}</span></th>
                        <th onClick={() => handleSort('date')}>Дата <span className="sort-indicator">{getSortIndicator('date')}</span></th>
                        <th onClick={() => handleSort('description')}>Описание <span className="sort-indicator">{getSortIndicator('description')}</span></th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedRecords.map(record => (
                        <tr key={record.id}>
                            <td>{record.id}</td>
                            <td>{record.Locomotive ? `Локомотив #${record.Locomotive.id}` : `ID ${record.locomotiveId}`}</td>
                            <td>{record.Employee ? `${record.Employee.lastName} ${record.Employee.firstName}` : `ID ${record.employeeId}`}</td>
                            <td>{record.date}</td>
                            <td>{record.description}</td>
                            <td>
                                <button onClick={() => openEditModal(record)} className="btn-edit">✏️</button>
                                {isAdmin && <button onClick={() => handleDelete(record.id)} className="btn-delete">🗑️</button>}
                            </td>
                        </tr>
                    ))}
                    {sortedRecords.length === 0 && (
                        <tr><td colSpan="6">Нет записей</td></tr>
                    )}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingRecord ? 'Редактировать запись' : 'Добавить запись обслуживания'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Локомотив*</label>
                                <select name="locomotiveId" className="form-input" value={formData.locomotiveId} onChange={handleFormChange} required>
                                    <option value="">Выберите локомотив</option>
                                    {locomotives.map(l => (
                                        <option key={l.id} value={l.id}>
                                            Локомотив #{l.id} (модель: {l.LocomotiveModel?.name})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Дата*</label>
                                <input type="date" name="date" className="form-input" value={formData.date} onChange={handleFormChange} required />
                            </div>
                            <div className="form-group">
                                <label>Описание</label>
                                <textarea name="description" className="form-input" rows="3" value={formData.description} onChange={handleFormChange}></textarea>
                            </div>
                            <div className="modal-buttons">
                                <button type="button" className="btn" onClick={() => setShowModal(false)}>Отмена</button>
                                <button type="submit" className="btn btn-primary">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LocomotiveMaintenance;