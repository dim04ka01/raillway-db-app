import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function Departments() {
    const [departments, setDepartments] = useState([]);
    const [sortedDepartments, setSortedDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [formName, setFormName] = useState('');
    const [sortColumn, setSortColumn] = useState('id');
    const [sortDirection, setSortDirection] = useState('asc');
    const userRole = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await axios.get('/api/departments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDepartments(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    useEffect(() => {
        const sorted = [...departments].sort((a, b) => {
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
        setSortedDepartments(sorted);
    }, [departments, sortColumn, sortDirection]);

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
        if (!window.confirm('Удалить отдел?')) return;
        try {
            await axios.delete(`/api/departments/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDepartments();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка удаления');
        }
    };

    const openCreateModal = () => {
        setEditingDept(null);
        setFormName('');
        setShowModal(true);
    };

    const openEditModal = (dept) => {
        setEditingDept(dept);
        setFormName(dept.name);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDept) {
                await axios.put(`/api/departments/${editingDept.id}`, { name: formName }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/departments', { name: formName }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowModal(false);
            fetchDepartments();
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
                <h1>Отделы</h1>
                {isAdmin && <button className="btn btn-primary" onClick={openCreateModal}>Добавить отдел</button>}
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
                    {sortedDepartments.map(dept => (
                        <tr key={dept.id}>
                            <td>{dept.id}</td>
                            <td>{dept.name}</td>
                            {isAdmin && (
                                <td>
                                    <button onClick={() => openEditModal(dept)} className="btn-edit">✏️</button>
                                    <button onClick={() => handleDelete(dept.id)} className="btn-delete">🗑️</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingDept ? 'Редактировать отдел' : 'Добавить отдел'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Название отдела</label>
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

export default Departments;