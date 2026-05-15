import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function WagonMaintenance() {
    const [records, setRecords] = useState([]);
    const [wagons, setWagons] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [selectedWagonId, setSelectedWagonId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [formData, setFormData] = useState({
        wagonId: '',
        date: '',
        description: ''
    });
    const [sortColumn, setSortColumn] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc'); // сортировка по дате (сначала новые)
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const isAdmin = userRole === 'Администрация';

    const fetchData = useCallback(async () => {
        try {
            const [recordsRes, wagonsRes] = await Promise.all([
                axios.get('/api/wagon-maintenance', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/wagons', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setRecords(recordsRes.data);
            setWagons(wagonsRes.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Фильтрация по вагону
    useEffect(() => {
        if (selectedWagonId) {
            setFilteredRecords(records.filter(r => r.wagonId === parseInt(selectedWagonId)));
        } else {
            setFilteredRecords(records);
        }
    }, [records, selectedWagonId]);

    // Сортировка отфильтрованных записей
    const sortedRecords = [...filteredRecords].sort((a, b) => {
        let aVal, bVal;
        if (sortColumn === 'wagon') {
            aVal = a.Wagon?.id || a.wagonId;
            bVal = b.Wagon?.id || b.wagonId;
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
            await axios.delete(`/api/wagon-maintenance/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка удаления');
        }
    };

    const openCreateModal = () => {
        setEditingRecord(null);
        setFormData({ wagonId: selectedWagonId || '', date: new Date().toISOString().slice(0, 10), description: '' });
        setShowModal(true);
    };

    const openEditModal = (record) => {
        setEditingRecord(record);
        setFormData({
            wagonId: record.wagonId,
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
                await axios.put(`/api/wagon-maintenance/${editingRecord.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/wagon-maintenance', formData, {
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
            <div className="flex-between mb-20">
                <h1>История обслуживания вагонов</h1>
                <button className="btn btn-primary" onClick={openCreateModal}>Добавить запись</button>
            </div>

            <div className="filter-bar">
                <label>Фильтр по вагону:</label>
                <select
                    className="form-input"
                    style={{ width: '400px' }}
                    value={selectedWagonId}
                    onChange={(e) => setSelectedWagonId(e.target.value)}
                >
                    <option value="">Все вагоны</option>
                    {wagons.map(w => (
                        <option key={w.id} value={w.id}>Вагон #{w.id} (модель: {w.WagonModel?.name}, тип: {w.WagonType?.name})</option>
                    ))}
                </select>
                {selectedWagonId && (
                    <button className="btn btn-primary" onClick={() => setSelectedWagonId('')}>Сбросить</button>
                )}
            </div>

            <table className="data-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('id')}>ID <span className="sort-indicator">{getSortIndicator('id')}</span></th>
                        <th onClick={() => handleSort('wagon')}>Вагон <span className="sort-indicator">{getSortIndicator('wagon')}</span></th>
                        <th onClick={() => handleSort('employee')}>Сотрудник <span className="sort-indicator">{getSortIndicator('employee')}</span></th>
                        <th onClick={() => handleSort('date')}>Дата <span className="sort-indicator">{getSortIndicator('date')}</span></th>
                        <th onClick={() => handleSort('description')}>Описание <span className="sort-indicator">{getSortIndicator('description')}</span></th>
                        {isAdmin && <th>Действия</th>}
                    </tr>
                </thead>
                <tbody>
                    {sortedRecords.map(record => (
                        <tr key={record.id}>
                            <td>{record.id}</td>
                            <td>{record.Wagon ? `Вагон #${record.Wagon.id}` : `ID ${record.wagonId}`}</td>
                            <td>{record.Employee ? `${record.Employee.lastName} ${record.Employee.firstName}` : `ID ${record.employeeId}`}</td>
                            <td>{record.date}</td>
                            <td>{record.description}</td>
                            {isAdmin && (
                                <td>
                                    <button onClick={() => openEditModal(record)} className="btn-edit">✏️</button>
                                    <button onClick={() => handleDelete(record.id)} className="btn-delete">🗑️</button>
                                </td>
                            )}
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
                                <label>Вагон*</label>
                                <select name="wagonId" className="form-input" value={formData.wagonId} onChange={handleFormChange} required>
                                    <option value="">Выберите вагон</option>
                                    {wagons.map(w => (
                                        <option key={w.id} value={w.id}>Вагон #{w.id} (модель: {w.WagonModel?.name}, тип: {w.WagonType?.name})</option>
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

export default WagonMaintenance;