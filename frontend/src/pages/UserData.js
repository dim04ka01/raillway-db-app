import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function UserData() {
    const [users, setUsers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        employeeId: '',
        roleId: '',
        login: '',
        password: ''
    });
    const [sortColumn, setSortColumn] = useState('login');
    const [sortDirection, setSortDirection] = useState('asc');
    const token = localStorage.getItem('token');

    const fetchData = useCallback(async () => {
        try {
            const [usersRes, empRes, rolesRes] = await Promise.all([
                axios.get('/api/user-data', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/employees', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/roles', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setUsers(usersRes.data);
            setEmployees(empRes.data);
            setRoles(rolesRes.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const sortedUsers = [...users].sort((a, b) => {
        let aVal, bVal;
        if (sortColumn === 'employeeName') {
            aVal = a.Employee?.lastName + ' ' + a.Employee?.firstName || '';
            bVal = b.Employee?.lastName + ' ' + b.Employee?.firstName || '';
        } else if (sortColumn === 'roleName') {
            aVal = a.Role?.name || '';
            bVal = b.Role?.name || '';
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

    const handleDelete = async (employeeId) => {
        if (!window.confirm('Удалить учётную запись?')) return;
        try {
            await axios.delete(`/api/user-data/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка удаления');
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({ employeeId: '', roleId: '', login: '', password: '' });
        setShowModal(true);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            employeeId: user.employeeId,
            roleId: user.roleId,
            login: user.login,
            password: ''
        });
        setShowModal(true);
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                employeeId: Number(formData.employeeId),
                roleId: Number(formData.roleId),
                login: formData.login
            };
            if (formData.password) payload.password = formData.password;
            if (editingUser) {
                await axios.put(`/api/user-data/${editingUser.employeeId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                if (!formData.password) {
                    alert('Пароль обязателен для новой учётной записи');
                    return;
                }
                await axios.post('/api/user-data', payload, {
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
                <h1>Учётные записи пользователей</h1>
                <button className="btn btn-primary" onClick={openCreateModal}>Создать учётную запись</button>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('employeeId')}>ID сотрудника <span className="sort-indicator">{getSortIndicator('employeeId')}</span></th>
                        <th onClick={() => handleSort('employeeName')}>ФИО сотрудника <span className="sort-indicator">{getSortIndicator('employeeName')}</span></th>
                        <th onClick={() => handleSort('login')}>Логин <span className="sort-indicator">{getSortIndicator('login')}</span></th>
                        <th onClick={() => handleSort('roleName')}>Роль <span className="sort-indicator">{getSortIndicator('roleName')}</span></th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedUsers.map(user => (
                        <tr key={user.employeeId}>
                            <td>{user.employeeId}</td>
                            <td>{user.Employee?.lastName || ''} {user.Employee?.firstName || ''}</td>
                            <td>{user.login}</td>
                            <td>{user.Role?.name}</td>
                            <td>
                                <button onClick={() => openEditModal(user)} className="btn-edit">✏️</button>
                                <button onClick={() => handleDelete(user.employeeId)} className="btn-delete">🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingUser ? 'Редактировать учётную запись' : 'Создать учётную запись'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Сотрудник*</label>
                                <select name="employeeId" className="form-input" value={formData.employeeId} onChange={handleFormChange} required>
                                    <option value="">Выберите сотрудника</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.lastName} {emp.firstName} (id={emp.id})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Логин*</label>
                                <input name="login" className="form-input" value={formData.login} onChange={handleFormChange} required />
                            </div>
                            <div className="form-group">
                                <label>Пароль {editingUser && '(оставьте пустым, если не менять)'}</label>
                                <input name="password" type="password" className="form-input" value={formData.password} onChange={handleFormChange} required={!editingUser} />
                            </div>
                            <div className="form-group">
                                <label>Роль*</label>
                                <select name="roleId" className="form-input" value={formData.roleId} onChange={handleFormChange} required>
                                    <option value="">Выберите роль</option>
                                    {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
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

export default UserData;