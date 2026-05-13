import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function BrigadeTypes() {
    const [items, setItems] = useState([]);
    const [sortedItems, setSortedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formName, setFormName] = useState('');
    const [sortColumn, setSortColumn] = useState('id');
    const [sortDirection, setSortDirection] = useState('asc');
    const userRole = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');

    const fetchItems = useCallback(async () => {
        try {
            const response = await axios.get('/api/brigade-types', {
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
        if (!window.confirm('Удалить тип бригады?')) return;
        try {
            await axios.delete(`/api/brigade-types/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchItems();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка удаления');
        }
    };

    const openCreateModal = () => {
        setEditingItem(null);
        setFormName('');
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormName(item.name);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await axios.put(`/api/brigade-types/${editingItem.id}`, { name: formName }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/brigade-types', { name: formName }, {
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
                <h1>Типы бригад</h1>
                {isAdmin && <button className="btn btn-primary" onClick={openCreateModal}>Добавить тип</button>}
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('id')}>
                            ID <span className="sort-indicator">{getSortIndicator('id')}</span>
                        </th>
                        <th onClick={() => handleSort('name')}>
                            Название <span className="sort-indicator">{getSortIndicator('name')}</span>
                        </th>
                        {isAdmin && <th>Действия</th>}
                    </tr>
                </thead>
                <tbody>
                    {sortedItems.map(item => (
                        <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.name}</td>
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
                        <h2>{editingItem ? 'Редактировать тип бригады' : 'Добавить тип бригады'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Название</label>
                                <input className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} required />
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

export default BrigadeTypes;