import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import EmployeeFormModal from '../components/EmployeeFormModal';

function Employees() {
    const [employees, setEmployees] = useState([]);
    const [filteredAndSorted, setFilteredAndSorted] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [sortColumn, setSortColumn] = useState('id');
    const [sortDirection, setSortDirection] = useState('asc');
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

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    // Сортировка при изменении employees или параметров сортировки
    useEffect(() => {
        const sorted = [...employees].sort((a, b) => {
            let aVal = a[sortColumn];
            let bVal = b[sortColumn];
            // Если значение null/undefined, кладём в конец
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            // Для числовых полей (id)
            if (typeof aVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }
            // Для строковых полей
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
            if (sortDirection === 'asc') {
                return aVal.localeCompare(bVal);
            } else {
                return bVal.localeCompare(aVal);
            }
        });
        setFilteredAndSorted(sorted);
    }, [employees, sortColumn, sortDirection]);

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить сотрудника?')) return;
        try {
            const token = localStorage.getItem('token');
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
        setShowModal(true);
    };

    const openEditModal = (employee) => {
        setEditingEmployee(employee);
        setShowModal(true);
    };

    const getSortIndicator = (column) => {
        if (sortColumn !== column) return '';
        return sortDirection === 'asc' ? ' ▲' : ' ▼';
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Сотрудники</h1>
                {(userRole === 'Администрация' || userRole === 'Руководитель отдела') && (
                    <button className="btn btn-primary" onClick={openCreateModal}>Добавить</button>
                )}
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('id')}>
                            ID <span className="sort-indicator">{getSortIndicator('id')}</span>
                        </th>
                        <th onClick={() => handleSort('lastName')}>
                            Фамилия <span className="sort-indicator">{getSortIndicator('lastName')}</span>
                        </th>
                        <th onClick={() => handleSort('firstName')}>
                            Имя <span className="sort-indicator">{getSortIndicator('firstName')}</span>
                        </th>
                        <th onClick={() => handleSort('middleName')}>
                            Отчество <span className="sort-indicator">{getSortIndicator('middleName')}</span>
                        </th>
                        <th onClick={() => handleSort('positionId')}>
                            Должность <span className="sort-indicator">{getSortIndicator('positionId')}</span>
                        </th>
                        <th onClick={() => handleSort('brigadeId')}>
                            Бригада <span className="sort-indicator">{getSortIndicator('brigadeId')}</span>
                        </th>
                        <th onClick={() => handleSort('phone')}>
                            Телефон <span className="sort-indicator">{getSortIndicator('phone')}</span>
                        </th>
                        <th onClick={() => handleSort('email')}>
                            Email <span className="sort-indicator">{getSortIndicator('email')}</span>
                        </th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAndSorted.map(emp => (
                        <tr key={emp.id}>
                            <td>{emp.id}</td>
                            <td>{emp.lastName}</td>
                            <td>{emp.firstName}</td>
                            <td>{emp.middleName}</td>
                            <td>{emp.Position?.name}</td>
                            <td>{emp.Brigade?.name}</td>
                            <td>{emp.phone}</td>
                            <td>{emp.email}</td>
                            <td>
                                {(userRole === 'Администрация' || userRole === 'Руководитель отдела') && (
                                    <>
                                        <button onClick={() => openEditModal(emp)} className="btn-edit">✏️</button>
                                        {userRole === 'Администрация' && (
                                            <button onClick={() => handleDelete(emp.id)} className="btn-delete">🗑️</button>
                                        )}
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <EmployeeFormModal
                    employee={editingEmployee}
                    onClose={() => setShowModal(false)}
                    onSaved={() => {
                        setShowModal(false);
                        fetchEmployees();
                    }}
                />
            )}
        </div>
    );
}

export default Employees;