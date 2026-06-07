import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function Employees() {
    const [employees, setEmployees] = useState([]);
    const [filteredSorted, setFilteredSorted] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formData, setFormData] = useState({
        lastName: '', firstName: '', middleName: '',
        birthDate: '', phone: '', email: '', positionId: '', brigadeId: ''
    });
    const [positions, setPositions] = useState([]);
    const [brigades, setBrigades] = useState([]);
    const [sortColumn, setSortColumn] = useState('id');
    const [sortDirection, setSortDirection] = useState('asc');
    const [searchTerm, setSearchTerm] = useState('');
    const userRole = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');

    const fetchEmployees = useCallback(async () => {
        try {
            const response = await axios.get('/api/employees', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployees(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchSelects = useCallback(async () => {
        try {
            const [posRes, brigRes] = await Promise.all([
                axios.get('/api/positions', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/brigades', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setPositions(posRes.data);
            setBrigades(brigRes.data);
        } catch (err) {
            console.error('Ошибка загрузки справочников', err);
        }
    }, [token]);

    useEffect(() => {
        fetchEmployees();
        fetchSelects();
    }, [fetchEmployees, fetchSelects]);

    // Фильтрация и сортировка
    useEffect(() => {
        // Фильтр
        const filtered = employees.filter(emp => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return (
                (emp.lastName || '').toLowerCase().includes(term) ||
                (emp.firstName || '').toLowerCase().includes(term) ||
                (emp.middleName || '').toLowerCase().includes(term) ||
                (emp.phone || '').toLowerCase().includes(term) ||
                (emp.email || '').toLowerCase().includes(term)
            );
        });

        // Сортировка
        const sorted = [...filtered].sort((a, b) => {
            let aVal, bVal;
            if (sortColumn === 'positionName') {
                aVal = a.Position?.name || '';
                bVal = b.Position?.name || '';
            } else if (sortColumn === 'brigadeName') {
                aVal = a.Brigade?.name || '';
                bVal = b.Brigade?.name || '';
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
        setFilteredSorted(sorted);
    }, [employees, searchTerm, sortColumn, sortDirection]);

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
        if (!window.confirm('Удалить сотрудника?')) return;
        try {
            await axios.delete(`/api/employees/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchEmployees();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка удаления');
        }
    };

    const openCreateModal = () => {
        setEditingEmployee(null);
        setFormData({
            lastName: '', firstName: '', middleName: '',
            birthDate: '', phone: '', email: '', positionId: '', brigadeId: ''
        });
        setShowModal(true);
    };

    const openEditModal = (employee) => {
        setEditingEmployee(employee);
        setFormData({
            lastName: employee.lastName || '',
            firstName: employee.firstName || '',
            middleName: employee.middleName || '',
            birthDate: employee.birthDate || '',
            phone: employee.phone || '',
            email: employee.email || '',
            positionId: employee.positionId || '',
            brigadeId: employee.brigadeId || ''
        });
        setShowModal(true);
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : '/api/employees';
            const method = editingEmployee ? 'put' : 'post';
            await axios[method](url, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            fetchEmployees();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка сохранения');
        }
    };

    const isAdminOrManager = userRole === 'Администрация' || userRole === 'Руководитель отдела';

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div>
            <div className="flex-between mb-20">
                <h1>Сотрудники</h1>
                {isAdminOrManager && (
                    <button className="btn btn-primary" onClick={openCreateModal}>Добавить сотрудника</button>
                )}
            </div>

            <div className="filter-bar">
                <label>Поиск сотрудников</label>
                <input
                    type="text"
                    placeholder="Поиск по ФИО, телефону, email..."
                    className="form-input search-input"
                    style={{ width: '400px' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {setSearchTerm && (
                    <button className="btn btn-primary" onClick={() => setSearchTerm('')}>Сбросить</button>
                )}
            </div>

            <table className="data-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('id')}>ID <span className="sort-indicator">{getSortIndicator('id')}</span></th>
                        <th onClick={() => handleSort('lastName')}>Фамилия <span className="sort-indicator">{getSortIndicator('lastName')}</span></th>
                        <th onClick={() => handleSort('firstName')}>Имя <span className="sort-indicator">{getSortIndicator('firstName')}</span></th>
                        <th onClick={() => handleSort('middleName')}>Отчество <span className="sort-indicator">{getSortIndicator('middleName')}</span></th>
                        <th onClick={() => handleSort('positionName')}>Должность <span className="sort-indicator">{getSortIndicator('positionName')}</span></th>
                        <th onClick={() => handleSort('brigadeName')}>Бригада <span className="sort-indicator">{getSortIndicator('brigadeName')}</span></th>
                        <th onClick={() => handleSort('phone')}>Телефон <span className="sort-indicator">{getSortIndicator('phone')}</span></th>
                        <th onClick={() => handleSort('email')}>Email <span className="sort-indicator">{getSortIndicator('email')}</span></th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredSorted.map(emp => (
                        <tr key={emp.id}>
                            <td>{emp.id}</td>
                            <td>{emp.lastName}</td>
                            <td>{emp.firstName}</td>
                            <td>{emp.middleName}</td>
                            <td>{emp.Position?.name}</td>
                            <td>{emp.Brigade?.name}</td>
                            <td>{emp.phone}</td>
                            <td>{emp.email}</td>
                            {isAdminOrManager && (
                                <td>
                                    <button onClick={() => openEditModal(emp)} className="btn-edit">✏️</button>
                                    <button onClick={() => handleDelete(emp.id)} className="btn-delete">🗑️</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Фамилия*</label>
                                <input name="lastName" className="form-input" value={formData.lastName} onChange={handleFormChange} required />
                            </div>
                            <div className="form-group">
                                <label>Имя*</label>
                                <input name="firstName" className="form-input" value={formData.firstName} onChange={handleFormChange} required />
                            </div>
                            <div className="form-group">
                                <label>Отчество</label>
                                <input name="middleName" className="form-input" value={formData.middleName} onChange={handleFormChange} />
                            </div>
                            <div className="form-group">
                                <label>Дата рождения</label>
                                <input type="date" name="birthDate" className="form-input" value={formData.birthDate} onChange={handleFormChange} />
                            </div>
                            <div className="form-group">
                                <label>Телефон</label>
                                <input name="phone" className="form-input" value={formData.phone} onChange={handleFormChange} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" className="form-input" value={formData.email} onChange={handleFormChange} />
                            </div>
                            <div className="form-group">
                                <label>Должность*</label>
                                <select name="positionId" className="form-input" value={formData.positionId} onChange={handleFormChange} required>
                                    <option value="">Выберите</option>
                                    {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Бригада*</label>
                                <select name="brigadeId" className="form-input" value={formData.brigadeId} onChange={handleFormChange} required>
                                    <option value="">Выберите</option>
                                    {brigades.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
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

export default Employees;