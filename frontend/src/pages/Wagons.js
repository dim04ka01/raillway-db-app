import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function Wagons() {
    const [wagons, setWagons] = useState([]);
    const [sortedWagons, setSortedWagons] = useState([]);
    const [wagonTypes, setWagonTypes] = useState([]);
    const [wagonModels, setWagonModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingWagon, setEditingWagon] = useState(null);
    const [formData, setFormData] = useState({
        wagonTypeId: '',
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
            const [wagonsRes, typesRes, modelsRes] = await Promise.all([
                axios.get('/api/wagons', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/wagon-types', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/wagon-models', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setWagons(wagonsRes.data);
            setWagonTypes(typesRes.data);
            setWagonModels(modelsRes.data);
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
        const sorted = [...wagons].sort((a, b) => {
            let aVal, bVal;
            if (sortColumn === 'typeName') {
                aVal = a.WagonType?.name || '';
                bVal = b.WagonType?.name || '';
            } else if (sortColumn === 'modelName') {
                aVal = a.WagonModel?.name || '';
                bVal = b.WagonModel?.name || '';
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
        setSortedWagons(sorted);
    }, [wagons, sortColumn, sortDirection]);

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
        if (!window.confirm('Удалить вагон?')) return;
        try {
            await axios.delete(`/api/wagons/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка удаления');
        }
    };

    const openCreateModal = () => {
        setEditingWagon(null);
        setFormData({ wagonTypeId: '', modelId: '', productionDate: '' });
        setShowModal(true);
    };

    const openEditModal = (wagon) => {
        setEditingWagon(wagon);
        setFormData({
            wagonTypeId: wagon.wagonTypeId,
            modelId: wagon.modelId,
            productionDate: wagon.productionDate || ''
        });
        setShowModal(true);
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingWagon) {
                await axios.put(`/api/wagons/${editingWagon.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/wagons', formData, {
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
                <h1>Вагоны</h1>
                {isAdmin && <button className="btn btn-primary" onClick={openCreateModal}>Добавить вагон</button>}
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('id')}>ID <span className="sort-indicator">{getSortIndicator('id')}</span></th>
                        <th onClick={() => handleSort('typeName')}>Тип вагона <span className="sort-indicator">{getSortIndicator('typeName')}</span></th>
                        <th onClick={() => handleSort('modelName')}>Модель вагона <span className="sort-indicator">{getSortIndicator('modelName')}</span></th>
                        <th onClick={() => handleSort('productionDate')}>Дата производства <span className="sort-indicator">{getSortIndicator('productionDate')}</span></th>
                        {isAdmin && <th>Действия</th>}
                    </tr>
                </thead>
                <tbody>
                    {sortedWagons.map(wagon => (
                        <tr key={wagon.id}>
                            <td>{wagon.id}</td>
                            <td>{wagon.WagonType?.name}</td>
                            <td>{wagon.WagonModel?.name}</td>
                            <td>{wagon.productionDate}</td>
                            {isAdmin && (
                                <td>
                                    <button onClick={() => openEditModal(wagon)} className="btn-edit">✏️</button>
                                    <button onClick={() => handleDelete(wagon.id)} className="btn-delete">🗑️</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingWagon ? 'Редактировать вагон' : 'Добавить вагон'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Тип вагона*</label>
                                <select name="wagonTypeId" className="form-input" value={formData.wagonTypeId} onChange={handleFormChange} required>
                                    <option value="">Выберите тип</option>
                                    {wagonTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Модель вагона*</label>
                                <select name="modelId" className="form-input" value={formData.modelId} onChange={handleFormChange} required>
                                    <option value="">Выберите модель</option>
                                    {wagonModels.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
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

export default Wagons;