import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function Locomotives() {
    const [locomotives, setLocomotives] = useState([]);
    const [models, setModels] = useState([]);
    const [sortedLocomotives, setSortedLocomotives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingLocomotive, setEditingLocomotive] = useState(null);
    const [formData, setFormData] = useState({
        modelId: '',
        productionDate: ''
    });
    const [sortColumn, setSortColumn] = useState('id');
    const [sortDirection, setSortDirection] = useState('asc');
    const userRole = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    const isAdmin = userRole === 'Администрация';

    const fetchData = useCallback(async () => {
        try {
            const [locoRes, modelsRes] = await Promise.all([
                axios.get('/api/locomotives', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/locomotive-models', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setLocomotives(locoRes.data);
            setModels(modelsRes.data);
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
        const sorted = [...locomotives].sort((a, b) => {
            let aVal, bVal;
            if (sortColumn === 'modelName') {
                aVal = a.LocomotiveModel?.name || '';
                bVal = b.LocomotiveModel?.name || '';
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
        setSortedLocomotives(sorted);
    }, [locomotives, sortColumn, sortDirection]);

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
        if (!window.confirm('Удалить локомотив?')) return;
        try {
            await axios.delete(`/api/locomotives/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка удаления');
        }
    };

    const openCreateModal = () => {
        setEditingLocomotive(null);
        setFormData({ modelId: '', productionDate: '' });
        setShowModal(true);
    };

    const openEditModal = (loco) => {
        setEditingLocomotive(loco);
        setFormData({
            modelId: loco.modelId,
            productionDate: loco.productionDate || ''
        });
        setShowModal(true);
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingLocomotive) {
                await axios.put(`/api/locomotives/${editingLocomotive.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/locomotives', formData, {
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
                <h1>Локомотивы</h1>
                {isAdmin && <button className="btn btn-primary" onClick={openCreateModal}>Добавить локомотив</button>}
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('id')}>ID <span className="sort-indicator">{getSortIndicator('id')}</span></th>
                        <th onClick={() => handleSort('modelName')}>Модель <span className="sort-indicator">{getSortIndicator('modelName')}</span></th>
                        <th onClick={() => handleSort('productionDate')}>Дата производства <span className="sort-indicator">{getSortIndicator('productionDate')}</span></th>
                        {isAdmin && <th>Действия</th>}
                    </tr>
                </thead>
                <tbody>
                    {sortedLocomotives.map(loco => (
                        <tr key={loco.id}>
                            <td>{loco.id}</td>
                            <td>{loco.LocomotiveModel?.name}</td>
                            <td>{loco.productionDate}</td>
                            {isAdmin && (
                                <td>
                                    <button onClick={() => openEditModal(loco)} className="btn-edit">✏️</button>
                                    <button onClick={() => handleDelete(loco.id)} className="btn-delete">🗑️</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingLocomotive ? 'Редактировать локомотив' : 'Добавить локомотив'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>ID*</label>
                                <input type="number" name="id" className="form-input" value={formData.id} onChange={handleFormChange} required />
                            </div>
                            <div className="form-group">
                                <label>Модель*</label>
                                <select name="modelId" className="form-input" value={formData.modelId} onChange={handleFormChange} required>
                                    <option value="">Выберите модель</option>
                                    {models.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Дата производства</label>
                                <input type="date" name="productionDate" className="form-input" value={formData.productionDate} onChange={handleFormChange} />
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

export default Locomotives;