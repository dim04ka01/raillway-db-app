import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function LocomotiveModels() {
    const [items, setItems] = useState([]);
    const [sortedItems, setSortedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        tractionForce: '',
        speed: '',
        couplingWeight: '',
        serviceWeight: ''
    });
    const [sortColumn, setSortColumn] = useState('id');
    const [sortDirection, setSortDirection] = useState('asc');
    const userRole = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');

    const fetchItems = useCallback(async () => {
        try {
            const response = await axios.get('/api/locomotive-models', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItems(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    useEffect(() => {
        const sorted = [...items].sort((a, b) => {
            let aVal = a[sortColumn];
            let bVal = b[sortColumn];
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            if (typeof aVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
            return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
        setSortedItems(sorted);
    }, [items, sortColumn, sortDirection]);

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
        if (!window.confirm('Удалить модель локомотива?')) return;
        try {
            await axios.delete(`/api/locomotive-models/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchItems();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка удаления');
        }
    };

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData({ name: '', tractionForce: '', speed: '', couplingWeight: '', serviceWeight: '' });
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            tractionForce: item.tractionForce || '',
            speed: item.speed || '',
            couplingWeight: item.couplingWeight || '',
            serviceWeight: item.serviceWeight || ''
        });
        setShowModal(true);
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await axios.put(`/api/locomotive-models/${editingItem.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/locomotive-models', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowModal(false);
            fetchItems();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка сохранения');
        }
    };

    const isAdmin = userRole === 'Администрация';

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div>
            <div className="flex-between mb-20">
                <h1>Модели локомотивов</h1>
                {isAdmin && <button className="btn btn-primary" onClick={openCreateModal}>Добавить модель</button>}
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('id')}>ID <span className="sort-indicator">{getSortIndicator('id')}</span></th>
                        <th onClick={() => handleSort('name')}>Название <span className="sort-indicator">{getSortIndicator('name')}</span></th>
                        <th onClick={() => handleSort('tractionForce')}>Сила тяги (кН) <span className="sort-indicator">{getSortIndicator('tractionForce')}</span></th>
                        <th onClick={() => handleSort('speed')}>Скорость (км/ч) <span className="sort-indicator">{getSortIndicator('speed')}</span></th>
                        <th onClick={() => handleSort('couplingWeight')}>Сцепной вес (т) <span className="sort-indicator">{getSortIndicator('couplingWeight')}</span></th>
                        <th onClick={() => handleSort('serviceWeight')}>Служебный вес (т) <span className="sort-indicator">{getSortIndicator('serviceWeight')}</span></th>
                        {isAdmin && <th>Действия</th>}
                    </tr>
                </thead>
                <tbody>
                    {sortedItems.map(item => (
                        <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.name}</td>
                            <td>{item.tractionForce}</td>
                            <td>{item.speed}</td>
                            <td>{item.couplingWeight}</td>
                            <td>{item.serviceWeight}</td>
                            {isAdmin && (
                                <td>
                                    <button onClick={() => openEditModal(item)} className="btn-edit">✏️</button>
                                    <button onClick={() => handleDelete(item.id)} className="btn-delete">🗑️</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingItem ? 'Редактировать модель' : 'Добавить модель'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Название*</label>
                                <input name="name" className="form-input" value={formData.name} onChange={handleFormChange} required />
                            </div>
                            <div className="form-group">
                                <label>Сила тяги</label>
                                <input name="tractionForce" className="form-input" value={formData.tractionForce} onChange={handleFormChange} />
                            </div>
                            <div className="form-group">
                                <label>Скорость</label>
                                <input name="speed" className="form-input" value={formData.speed} onChange={handleFormChange} />
                            </div>
                            <div className="form-group">
                                <label>Сцепной вес</label>
                                <input name="couplingWeight" className="form-input" value={formData.couplingWeight} onChange={handleFormChange} />
                            </div>
                            <div className="form-group">
                                <label>Служебный вес</label>
                                <input name="serviceWeight" className="form-input" value={formData.serviceWeight} onChange={handleFormChange} />
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

export default LocomotiveModels;