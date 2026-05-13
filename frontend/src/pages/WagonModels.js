import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function WagonModels() {
    const [items, setItems] = useState([]);
    const [sortedItems, setSortedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        tareWeight: '',
        designSpeed: '',
        seatingCapacity: ''
    });
    const [sortColumn, setSortColumn] = useState('id');
    const [sortDirection, setSortDirection] = useState('asc');
    const userRole = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');

    const fetchItems = useCallback(async () => {
        try {
            const response = await axios.get('/api/wagon-models', {
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
        if (!window.confirm('Удалить модель вагона?')) return;
        try {
            await axios.delete(`/api/wagon-models/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchItems();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка удаления');
        }
    };

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData({ name: '', tareWeight: '', designSpeed: '', seatingCapacity: '' });
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            tareWeight: item.tareWeight || '',
            designSpeed: item.designSpeed || '',
            seatingCapacity: item.seatingCapacity || ''
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
                await axios.put(`/api/wagon-models/${editingItem.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/wagon-models', formData, {
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Модели вагонов</h1>
                {isAdmin && <button className="btn btn-primary" onClick={openCreateModal}>Добавить модель</button>}
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('id')}>ID <span className="sort-indicator">{getSortIndicator('id')}</span></th>
                        <th onClick={() => handleSort('name')}>Название <span className="sort-indicator">{getSortIndicator('name')}</span></th>
                        <th onClick={() => handleSort('tareWeight')}>Масса тары (т) <span className="sort-indicator">{getSortIndicator('tareWeight')}</span></th>
                        <th onClick={() => handleSort('designSpeed')}>Конструкционная скорость (км/ч) <span className="sort-indicator">{getSortIndicator('designSpeed')}</span></th>
                        <th onClick={() => handleSort('seatingCapacity')}>Количество мест <span className="sort-indicator">{getSortIndicator('seatingCapacity')}</span></th>
                        {isAdmin && <th>Действия</th>}
                    </tr>
                </thead>
                <tbody>
                    {sortedItems.map(item => (
                        <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.name}</td>
                            <td>{item.tareWeight}</td>
                            <td>{item.designSpeed}</td>
                            <td>{item.seatingCapacity}</td>
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
                        <h2>{editingItem ? 'Редактировать модель вагона' : 'Добавить модель вагона'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Название*</label>
                                <input name="name" className="form-input" value={formData.name} onChange={handleFormChange} required />
                            </div>
                            <div className="form-group">
                                <label>Масса тары</label>
                                <input name="tareWeight" className="form-input" value={formData.tareWeight} onChange={handleFormChange} />
                            </div>
                            <div className="form-group">
                                <label>Конструкционная скорость</label>
                                <input name="designSpeed" className="form-input" value={formData.designSpeed} onChange={handleFormChange} />
                            </div>
                            <div className="form-group">
                                <label>Количество мест</label>
                                <input type="number" name="seatingCapacity" className="form-input" value={formData.seatingCapacity} onChange={handleFormChange} />
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

export default WagonModels;