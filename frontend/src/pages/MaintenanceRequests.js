import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function MaintenanceRequests() {
    const [requests, setRequests] = useState([]);
    const [transportList, setTransportList] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);
    const [formData, setFormData] = useState({
        transportId: '',
        desiredDate: '',
        description: ''
    });
    const [sortColumn, setSortColumn] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const isAdmin = userRole === 'Администрация';
    const isManagerOrAdmin = userRole === 'Администрация' || userRole === 'Руководитель отдела';

    const fetchData = useCallback(async () => {
        try {
            const [requestsRes, transportRes] = await Promise.all([
                axios.get('/api/maintenance-requests', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/transport', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setRequests(requestsRes.data);
            setTransportList(transportRes.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Фильтрация по статусу
    useEffect(() => {
        if (statusFilter) {
            setFilteredRequests(requests.filter(r => r.status === statusFilter));
        } else {
            setFilteredRequests(requests);
        }
    }, [requests, statusFilter]);

    // Сортировка
    const sortedRequests = [...filteredRequests].sort((a, b) => {
        let aVal, bVal;
        if (sortColumn === 'transport') {
            aVal = a.transportInfo?.id || a.transportId;
            bVal = b.transportInfo?.id || b.transportId;
        } else if (sortColumn === 'manager') {
            aVal = a.Manager ? `${a.Manager.lastName} ${a.Manager.firstName}` : '';
            bVal = b.Manager ? `${b.Manager.lastName} ${b.Manager.firstName}` : '';
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
        if (!isAdmin) return;
        if (!window.confirm('Удалить заявку? Это действие необратимо.')) return;
        try {
            await axios.delete(`/api/maintenance-requests/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Заявка удалена');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка удаления');
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        if (!isAdmin) return;
        if (!window.confirm(`Изменить статус заявки на "${newStatus}"?`)) return;
        try {
            await axios.put(`/api/maintenance-requests/${id}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Статус обновлён');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка изменения статуса');
        }
    };

    const openCreateModal = () => {
        setEditingRequest(null);
        setFormData({
            transportId: '',
            desiredDate: new Date().toISOString().slice(0, 10),
            description: ''
        });
        setShowModal(true);
    };

    const openEditModal = (req) => {
        if (!isAdmin) return;
        setEditingRequest(req);
        setFormData({
            transportId: req.transportId,
            desiredDate: req.desiredDate || '',
            description: req.description || ''
        });
        setShowModal(true);
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRequest) {
                await axios.put(`/api/maintenance-requests/${editingRequest.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Заявка обновлена');
            } else {
                await axios.post('/api/maintenance-requests', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Заявка создана');
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка сохранения');
        }
    };

    const getTransportLabel = (ts) => {
        if (!ts) return '—';
        if (ts.type === 'locomotive') {
            return `Локомотив #${ts.id} (${ts.modelName || 'нет модели'})`;
        } else if (ts.type === 'wagon') {
            return `Вагон #${ts.id} (${ts.modelName || 'нет модели'}, тип: ${ts.wagonType || 'не указан'})`;
        }
        return `ТС #${ts.id}`;
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Заявки на техосмотр</h1>
                {isManagerOrAdmin && (
                    <button className="btn btn-primary" onClick={openCreateModal}>Создать заявку</button>
                )}
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label>Фильтр по статусу:</label>
                <select className="form-input" style={{ width: '150px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">Все</option>
                    <option value="В ожидании">В ожидании</option>
                    <option value="Выполнена">Выполнена</option>
                </select>
            </div>

            <table className="data-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('id')}>ID <span className="sort-indicator">{getSortIndicator('id')}</span></th>
                        <th onClick={() => handleSort('transport')}>ТС <span className="sort-indicator">{getSortIndicator('transport')}</span></th>
                        <th onClick={() => handleSort('manager')}>Руководитель <span className="sort-indicator">{getSortIndicator('manager')}</span></th>
                        <th onClick={() => handleSort('createdAt')}>Дата создания <span className="sort-indicator">{getSortIndicator('createdAt')}</span></th>
                        <th onClick={() => handleSort('desiredDate')}>Желаемая дата <span className="sort-indicator">{getSortIndicator('desiredDate')}</span></th>
                        <th onClick={() => handleSort('status')}>Статус <span className="sort-indicator">{getSortIndicator('status')}</span></th>
                        <th>Описание</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedRequests.map(req => (
                        <tr key={req.id}>
                            <td>{req.id}</td>
                            <td>{getTransportLabel(req.transportInfo)}</td>
                            <td>{req.Manager ? `${req.Manager.lastName} ${req.Manager.firstName}` : `ID ${req.managerId}`}</td>
                            <td>{req.createdAt}</td>
                            <td>{req.desiredDate || '—'}</td>
                            <td>
                                {isAdmin ? (
                                    <select
                                        className="form-input"
                                        style={{ width: '120px' }}
                                        value={req.status}
                                        onChange={(e) => handleStatusChange(req.id, e.target.value)}
                                    >
                                        <option value="В ожидании">В ожидании</option>
                                        <option value="Выполнена">Выполнена</option>
                                    </select>
                                ) : (
                                    req.status
                                )}
                            </td>
                            <td>{req.description || '—'}</td>
                            <td>
                                {isAdmin && (
                                    <>
                                        <button onClick={() => openEditModal(req)} className="btn-edit">✏️</button>
                                        <button onClick={() => handleDelete(req.id)} className="btn-delete">🗑️</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                    {sortedRequests.length === 0 && (
                        <tr><td colSpan="8">Нет заявок</td></tr>
                    )}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingRequest ? 'Редактировать заявку' : 'Создать заявку'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Транспортное средство*</label>
                                <select name="transportId" className="form-input" value={formData.transportId} onChange={handleFormChange} required>
                                    <option value="">Выберите</option>
                                    {transportList.map(ts => (
                                        <option key={ts.id} value={ts.id}>
                                            {ts.type === 'locomotive' ? `Локомотив #${ts.id}` : `Вагон #${ts.id}`}
                                            {ts.modelName ? ` (${ts.modelName})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Желаемая дата выполнения</label>
                                <input type="date" name="desiredDate" className="form-input" value={formData.desiredDate} onChange={handleFormChange} />
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

export default MaintenanceRequests;