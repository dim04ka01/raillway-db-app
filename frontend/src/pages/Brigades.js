import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function Brigades() {
    const [brigades, setBrigades] = useState([]);
    const [sortedBrigades, setSortedBrigades] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [brigadeTypes, setBrigadeTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingBrigade, setEditingBrigade] = useState(null);
    const [formData, setFormData] = useState({ name: '', departmentId: '', brigadeTypeId: '' });
    const [sortColumn, setSortColumn] = useState('id');
    const [sortDirection, setSortDirection] = useState('asc');
    const userRole = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    const isAdmin = userRole === 'Администрация';

    const fetchData = useCallback(async () => {
        try {
            const [brigadesRes, deptsRes, typesRes] = await Promise.all([
                axios.get('/api/brigades', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/departments', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/brigade-types', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setBrigades(brigadesRes.data);
            setDepartments(deptsRes.data);
            setBrigadeTypes(typesRes.data);
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
        const sorted = [...brigades].sort((a, b) => {
            let aVal, bVal;
            if (sortColumn === 'department') {
                aVal = a.Department?.name || '';
                bVal = b.Department?.name || '';
            } else if (sortColumn === 'brigadeType') {
                aVal = a.BrigadeType?.name || '';
                bVal = b.BrigadeType?.name || '';
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
        setSortedBrigades(sorted);
    }, [brigades, sortColumn, sortDirection]);

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
        if (!window.confirm('Удалить бригаду?')) return;
        try {
            await axios.delete(`/api/brigades/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка удаления');
        }
    };

    const openCreateModal = () => {
        setEditingBrigade(null);
        setFormData({ name: '', departmentId: '', brigadeTypeId: '' });
        setShowModal(true);
    };

    const openEditModal = (brigade) => {
        setEditingBrigade(brigade);
        setFormData({
            name: brigade.name,
            departmentId: brigade.departmentId,
            brigadeTypeId: brigade.brigadeTypeId
        });
        setShowModal(true);
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBrigade) {
                await axios.put(`/api/brigades/${editingBrigade.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/brigades', formData, {
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Бригады</h1>
                {isAdmin && <button className="btn btn-primary" onClick={openCreateModal}>Добавить бригаду</button>}
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('id')}>ID <span className="sort-indicator">{getSortIndicator('id')}</span></th>
                        <th onClick={() => handleSort('name')}>Название <span className="sort-indicator">{getSortIndicator('name')}</span></th>
                        <th onClick={() => handleSort('department')}>Отдел <span className="sort-indicator">{getSortIndicator('department')}</span></th>
                        <th onClick={() => handleSort('brigadeType')}>Тип бригады <span className="sort-indicator">{getSortIndicator('brigadeType')}</span></th>
                        {isAdmin && <th>Действия</th>}
                    </tr>
                </thead>
                <tbody>
                    {sortedBrigades.map(brigade => (
                        <tr key={brigade.id}>
                            <td>{brigade.id}</td>
                            <td>{brigade.name}</td>
                            <td>{brigade.Department?.name}</td>
                            <td>{brigade.BrigadeType?.name}</td>
                            {isAdmin && (
                                <td>
                                    <button onClick={() => openEditModal(brigade)} className="btn-edit">✏️</button>
                                    <button onClick={() => handleDelete(brigade.id)} className="btn-delete">🗑️</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingBrigade ? 'Редактировать бригаду' : 'Добавить бригаду'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Название*</label>
                                <input name="name" className="form-input" value={formData.name} onChange={handleFormChange} required />
                            </div>
                            <div className="form-group">
                                <label>Отдел*</label>
                                <select name="departmentId" className="form-input" value={formData.departmentId} onChange={handleFormChange} required>
                                    <option value="">Выберите отдел</option>
                                    {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Тип бригады*</label>
                                <select name="brigadeTypeId" className="form-input" value={formData.brigadeTypeId} onChange={handleFormChange} required>
                                    <option value="">Выберите тип</option>
                                    {brigadeTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                                </select>
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

export default Brigades;